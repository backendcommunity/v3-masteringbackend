"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface WhiteboardPanelProps {
  onSendToKap: (diagramJSON: string, svgString: string) => void;
  disabled?: boolean;
  savedDiagram?: unknown;
}

// Dynamically import Excalidraw to avoid SSR issues
const ExcalidrawComponent = dynamic(
  async () => {
    const { Excalidraw } = await import("@excalidraw/excalidraw");
    return Excalidraw;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export function WhiteboardPanel({ onSendToKap, disabled, savedDiagram }: WhiteboardPanelProps) {
  const excalidrawAPIRef = useRef<any>(null);
  const [isSending, setIsSending] = useState(false);

  const setExcalidrawAPI = useCallback((api: any) => {
    excalidrawAPIRef.current = api;
  }, []);

  const handleSendToKap = async () => {
    if (!excalidrawAPIRef.current || disabled) return;

    setIsSending(true);
    try {
      const elements = excalidrawAPIRef.current.getSceneElements();
      const appState = excalidrawAPIRef.current.getAppState();
      const files = excalidrawAPIRef.current.getFiles();

      const diagramJSON = JSON.stringify({ elements, appState, files });

      let svgString = "";
      try {
        const { exportToSvg } = await import("@excalidraw/excalidraw");
        const svgElement = await exportToSvg({
          elements,
          appState,
          files,
        });
        svgString = new XMLSerializer().serializeToString(svgElement);
      } catch {
        // SVG export failed, use empty string
        svgString = "";
      }

      onSendToKap(diagramJSON, svgString);
    } finally {
      setIsSending(false);
    }
  };

  const initialData = savedDiagram
    ? (savedDiagram as any)
    : {
        appState: {
          currentItemStrokeColor: "#0E1F33",
          currentItemBackgroundColor: "transparent",
          viewBackgroundColor: "#FFFFFF",
        },
      };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 relative">
        <ExcalidrawComponent
          excalidrawAPI={setExcalidrawAPI}
          initialData={initialData}
          UIOptions={{
            canvasActions: {
              export: false,
              saveAsImage: false,
              loadScene: false,
              saveToActiveFile: false,
              toggleTheme: false,
            },
          }}
        />
      </div>
      {!disabled && (
        <div className="flex items-center justify-end px-3 py-2 border-t border-border bg-background">
          <Button
            size="sm"
            onClick={handleSendToKap}
            disabled={isSending || disabled}
            className="gap-1.5 text-xs h-8"
          >
            {isSending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Send to Kap
          </Button>
        </div>
      )}
    </div>
  );
}
