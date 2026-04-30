import { PanelRightClose, PanelRightOpen, Play, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { languages } from "@/lib/languages";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Input } from "../ui/input";
import { Playground } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import {
  codeSample,
  decodeBase64Utf8,
  encodeBase64Utf8,
} from "@/lib/utils";
import { Label } from "../ui/label";

interface EditorProps {
  playground?: Playground;
  full?: boolean;
}

export function SimpleEditor({ playground, full = true }: EditorProps) {
  const { theme } = useTheme();
  const store = useAppStore();
  const editorRef = useRef<any>(null);
  const [language, setLanguage] = useState<any>(null);
  const [code, setCode] = useState(
    playground?.code ? decodeBase64Utf8(playground.code) : codeSample
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userInputOpen, setUserInputOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [savedCodes, setSavedCodes] = useState<Playground[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isTextRequired, setIsTextRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const playgrounds = await store.getSavedPlaygrounds();
        if (!cancelled) {
          setSavedCodes(playgrounds);
        }
      } catch (error) {}
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [store]);

  useEffect(() => {
    const lan = playground?.language ?? "node";
    const language = languages.find((l) => l.code === lan);
    setLanguage(language ?? null);
  }, [playground]);

  useEffect(() => {
    setCode(language?.snippet ?? codeSample);
  }, [language]);

  async function saveCode() {
    try {
      if (!language?.code) {
        toast.error("Select a programming language to save with");
        return;
      }

      if (!title) {
        setIsTextRequired(true);
        return;
      }

      const playground = await store.savePlayground({
        code: encodeBase64Utf8(code),
        title,
        language: language.code,
      });

      setSavedCodes((prev) => [...prev, playground]);

      toast.success("Playground saved successfully");
    } catch (error) {
      toast.error("Playground failed to save");
    }
  }

  async function runCode() {
    setDrawerOpen(true);

    if (!language?.code) {
      setResult("Please select a programming language before running code.");
      return;
    }
    setIsLoading(true);
    setResult(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);

    try {
      const executionResult = await store.executeCode({
        language: language.code,
        code: encodeBase64Utf8(code),
        signal: controller.signal,
      });

      const output =
        executionResult?.stdout ?? executionResult?.stderr ?? "No output";
      setResult(String(output));
      toast.success("Code executed successfully!");
    } catch (error: any) {
      console.error("Code execution error:", error);
      
      const errorMsg = error?.message || "Code execution failed";
      if (controller.signal.aborted || error?.code === "ERR_CANCELED") {
        setResult("Error: Code execution timed out after 30 seconds.");
      } else if (error?.response?.status === 404) {
        setResult("Error: Execution endpoint not found on backend (404).");
      } else if (error?.response?.data?.message) {
        setResult(`Error: ${error.response.data.message}`);
      } else {
        setResult(`Error: ${errorMsg}`);
      }
      toast.error(`Execution failed: ${errorMsg}`);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily:
        "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
      lineHeight: 1.6,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: "selection",
      bracketPairColorization: { enabled: true },
    });
  };

  return (
    <Card className="relative">
      <CardHeader
        className={`flex justify-between  ${
          full ? "lg:flex-row flex-col" : "flex-col"
        }`}
      >
        <span>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Code Editor
          </CardTitle>
          <CardDescription>
            Follow along with the video and write your code here
          </CardDescription>
        </span>

        <div className="flex gap-5 justify-between">
          <Select
            onValueChange={(lang) => {
              const language = languages.find((l) => l.code === lang);
              setLanguage(language);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(id) => {
              const playground = savedCodes.find(
                (c: Playground) => c.id === id
              );
              setCode(decodeBase64Utf8(playground?.code!));
            }}
          >
            <SelectTrigger>
              <SelectValue
                className="w-full"
                placeholder="Select your saved code"
              />
            </SelectTrigger>
            <SelectContent>
              {savedCodes.map((c: Playground) => (
                <SelectItem key={c?.id} value={c?.id}>
                  {c?.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative flex h-[600px] border overflow-hidden flex-col">
          {/* Code box */}

          <div
            className="flex-1  text-white p- font-mono text-sm"
            onClick={() => {
              setDrawerOpen(false);
              setUserInputOpen(false);
            }}
          >
            <Editor
              height="100%"
              language={language?.code === "node" ? "javascript" : language?.code}
              theme={theme?.includes("dark") ? "vs-dark" : "light"}
              value={code}
              onChange={(e) => setCode(e!)}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 14,
                fontFamily:
                  "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                lineHeight: 1.6,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
                renderWhitespace: "selection",
                bracketPairColorization: { enabled: true },
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                parameterHints: { enabled: true },
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>

          {/* Right Drawer */}
          <div
            className={`absolute top-0 right-0 h-full w-80 bg-white dark:bg-secondary border-l shadow-md transform transition-transform duration-300 ${
              drawerOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="p-4">
              <h3 className="font-semibold text-lg">Execution Result</h3>
              <p className="text-sm text-muted-foreground">
                Output from your code will appear here
              </p>
              <div className="mt-4">
                {isLoading ? (
                  <div className="animate-pulse text-gray-500">
                    Running code...
                  </div>
                ) : result ? (
                  <pre className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap break-words">
                    {result}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Click "Run" to execute your code
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Toggle button on edge */}
          <Button
            onClick={() => setDrawerOpen((o) => !o)}
            className="absolute top-1/2 right-8 -translate-y-1/2 translate-x-full rounded-l-none"
            size="icon"
            variant="outline"
          >
            {drawerOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>

          {/* Bottom Drawer for User Input */}
          <div
            className={`absolute bottom-0 left-0 w-full bg-white dark:bg-secondary border-t shadow-md transform transition-transform duration-300 ${
              userInputOpen ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="p-4">
              <h3 className="font-semibold text-lg">User Input</h3>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full h-32 resize-none border rounded-md p-2 text-sm font-mono"
                placeholder="Enter input for your program..."
              />
            </div>
          </div>
        </div>
      </CardContent>

      {full ? (
        <div className="flex justify-between items-center p-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="flex w-1/2 gap-2 items-center">
              <Label htmlFor="title">Title</Label>
              <Input
                required
                name="Title"
                id="title"
                value={title}
                onChange={(e) => {
                  setIsTextRequired(false);
                  setTitle(e.target.value);
                }}
                type="text"
                className={`${
                  isTextRequired ? "border-red-300 focus:ring-red-500" : ""
                }`}
              ></Input>
            </div>
            <Button
              disabled={isLoading}
              onClick={() => saveCode()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                disabled={isLoading}
                id="toggle-input"
                checked={userInputOpen}
                onCheckedChange={(checked) =>
                  setUserInputOpen(checked as boolean)
                }
              />
              <label htmlFor="toggle-input" className="text-sm">
                Add Input
              </label>
            </div>
            <Button
              disabled={isLoading}
              onClick={runCode}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <i>Compiling</i>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className={`flex justify-between items-center p-4 gap-4 flex-col`}>
          <div className=" w-full">
            <div className="flex-1">
              <Button
                disabled={isLoading}
                onClick={runCode}
                className="flex items-center gap-2 w-full"
              >
                {isLoading ? (
                  <i>Compiling</i>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-end w-full gap-5">
            <div className="flex items-center gap-2">
              <Checkbox
                disabled={isLoading}
                id="toggle-input"
                checked={userInputOpen}
                onCheckedChange={(checked) =>
                  setUserInputOpen(checked as boolean)
                }
              />
              <label htmlFor="toggle-input" className="text-sm">
                Input
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <Label htmlFor="title">Title</Label>
              <Input
                required
                name="Title"
                id="title"
                value={title}
                onChange={(e) => {
                  setIsTextRequired(false);
                  setTitle(e.target.value);
                }}
                type="text"
                className={`${
                  isTextRequired ? "border-red-300 focus:ring-red-500" : ""
                }`}
              ></Input>
            </div>
            <Button
              disabled={isLoading}
              onClick={() => saveCode()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
