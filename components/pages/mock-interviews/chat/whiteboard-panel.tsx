"use client";
import "@excalidraw/excalidraw/index.css";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Footer } from "@excalidraw/excalidraw";
// Load Excalidraw and WelcomeScreen client-side only
const ExcalidrawWithWelcome = dynamic(
  async () => {
    const { Excalidraw, WelcomeScreen } =
      await import("@excalidraw/excalidraw");

    return function ExcalidrawWithWelcome({
      excalidrawAPI,
      onChange,
      initialData,
    }: {
      excalidrawAPI: (api: any) => void;
      onChange: (elements: readonly any[], state: any, files: any) => void;
      initialData?: any;
    }) {
      return (
        <Excalidraw
          excalidrawAPI={excalidrawAPI}
          onChange={onChange}
          initialData={initialData}
          theme="light"
          UIOptions={{
            canvasActions: {
              export: false,
              saveAsImage: false,
              loadScene: false,
              saveToActiveFile: false,
              toggleTheme: false,
            },
          }}
        >
          <WelcomeScreen>
            <WelcomeScreen.Hints.MenuHint />
            <WelcomeScreen.Hints.ToolbarHint />
          </WelcomeScreen>
        </Excalidraw>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">Loading whiteboard…</p>
        </div>
      </div>
    ),
  },
);

interface WhiteboardPanelProps {
  onSendToKap: (diagramJSON: string) => void;
  disabled?: boolean;
  savedDiagram?: unknown;
}

export function WhiteboardPanel({
  onSendToKap,
  disabled,
  savedDiagram,
}: WhiteboardPanelProps) {
  const excalidrawAPIRef = useRef<any>(null);
  const [hasContent, setHasContent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [libaryData, setLibraryData] = useState<any>(null);

  const handleChange = useCallback((elements: readonly any[]) => {
    setHasContent(elements.some((el: any) => !el.isDeleted));
  }, []);

  const handleSendToKap = async () => {
    if (!excalidrawAPIRef.current || disabled || isSending) return;
    setIsSending(true);
    try {
      const elements = excalidrawAPIRef.current.getSceneElements();
      const appState = excalidrawAPIRef.current.getAppState();
      const files = excalidrawAPIRef.current.getFiles();
      onSendToKap(JSON.stringify({ elements, appState, files }));
    } finally {
      setTimeout(() => setIsSending(false), 1000);
    }
  };

  useEffect(() => {
    fetch("/mb.excalidrawlib")
      .then((res) => res.json())
      .then((data) => {
        // The file structure typically contains a 'libraryItems' array
        console.log("Excalidraw library loaded with items:", data);
        if (data.library) {
          setLibraryData(data.library);
        }
      })
      .catch((err) => console.error("Error loading Excalidraw library:", err));
  }, []);

  const initialData = savedDiagram
    ? {
        elements: (savedDiagram as any)?.elements || [],
      }
    : undefined;

  return (
    <div className="relative h-full w-full bg-background flex flex-col">
      {/* Full-canvas Excalidraw — leave room for footer */}
      <div className="flex-1 min-h-0 pb-[41px] excal">
        <ExcalidrawWithWelcome
          excalidrawAPI={(api) => {
            excalidrawAPIRef.current = api;
          }}
          onChange={handleChange}
          initialData={{
            ...initialData,
            libraryItems: libaryData,
          }}
        />
      </div>

      {/* Footer — same design as code editor footer */}
      <div className="absolute bottom-0 left-0 right-0 z-[100] flex items-center justify-between px-3 py-2 border-t border-border bg-background">
        <span className="text-[10px] text-muted-foreground">
          {disabled ? "Interview ended" : "Share your diagram with Kap"}
        </span>
        <button
          onClick={handleSendToKap}
          disabled={disabled || !hasContent || isSending}
          className={cn(
            "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold transition-all",
            disabled || !hasContent
              ? "bg-primary/40 text-primary-foreground cursor-not-allowed opacity-50"
              : isSending
                ? "bg-primary/80 text-primary-foreground"
                : "bg-primary hover:bg-primary/90 text-primary-foreground",
          )}
        >
          {isSending ? "Sending…" : "Send to Kap"}
        </button>
      </div>
    </div>
  );
}
