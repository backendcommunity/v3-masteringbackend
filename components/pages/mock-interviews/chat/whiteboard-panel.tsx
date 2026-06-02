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
          initialData={{
            ...initialData,
            appState: {
              ...(initialData?.appState || {}),
              currentItemStrokeColor: "#0E1F33",
              currentItemBackgroundColor: "transparent",
              currentItemFillStyle: "solid" as const,
              viewBackgroundColor: "#FFFFFF",
            },
          }}
          theme="light"
          UIOptions={{
            canvasActions: {
              export: false,
              saveAsImage: false,
              loadScene: false,
              saveToActiveFile: false,
              toggleTheme: false,
            },
            colorPalette: {
              topPicks: [
                "#13AECE",
                "#0E1F33",
                "#347474",
                "#F2C94C",
                "#EB5757",
                "#2D9CDB",
                "#000000",
                "#FFFFFF",
              ],
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
    <div className="relative h-full w-full bg-background">
      {/* Full-canvas Excalidraw — native toolbar visible */}
      <div className="h-full w-full excal">
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

      {/* "Send to Kap" — floats above Excalidraw's bottom footer on the right */}
      {/* right-14 = ~56px gap clears Excalidraw's native help button at bottom-right */}
      <div className="absolute bottom-3 right-14 z-[100] pointer-events-auto">
        <button
          onClick={handleSendToKap}
          disabled={disabled || !hasContent || isSending}
          className={cn(
            "h-9 px-5 rounded-lg text-sm font-semibold transition-all",
            "shadow-sm",
            disabled || !hasContent
              ? "bg-primary/40 text-primary-foreground cursor-not-allowed opacity-60"
              : isSending
                ? "bg-primary/80 text-primary-foreground opacity-80"
                : "bg-primary hover:bg-primary/90 text-primary-foreground",
          )}
        >
          {isSending ? "Sending…" : "Send to Kap"}
        </button>
      </div>
    </div>
  );
}
