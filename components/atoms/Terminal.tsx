"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import socket from "@/lib/socketIo";
import { useUser } from "@/hooks/use-user";
import { TerminalSquare, Trash2, HelpCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import "xterm/css/xterm.css";

interface TerminalProps {
  slug: string;
  output?: string[];
  onClose: (open: boolean) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

// Mock-matched dark theme (navy/cyan/teal palette).
const XTERM_DARK = {
  background: "#171b26",
  foreground: "#cbd5e1",
  cursor: "#13aece",
  cursorAccent: "#171b26",
  selectionBackground: "rgba(19,174,206,0.30)",
  black: "#0c0f16",
  red: "#ef5d6b",
  green: "#5fb0b0",
  yellow: "#f2c94c",
  blue: "#13aece",
  magenta: "#2bb8d8",
  cyan: "#5fb0b0",
  white: "#cbd5e1",
  brightBlack: "#5e6678",
  brightRed: "#ef5d6b",
  brightGreen: "#5fb0b0",
  brightYellow: "#f2c94c",
  brightBlue: "#2bb8d8",
  brightMagenta: "#2bb8d8",
  brightCyan: "#5fb0b0",
  brightWhite: "#e7ebf3",
};

// Light theme — white surface, dark ink, same brand accents.
const XTERM_LIGHT = {
  background: "#ffffff",
  foreground: "#0f172a",
  cursor: "#0f8ba8",
  cursorAccent: "#ffffff",
  selectionBackground: "rgba(19,174,206,0.18)",
  black: "#0f172a",
  red: "#dc2626",
  green: "#347474",
  yellow: "#b45309",
  blue: "#0f8ba8",
  magenta: "#13aece",
  cyan: "#347474",
  white: "#475569",
  brightBlack: "#94a3b8",
  brightRed: "#dc2626",
  brightGreen: "#347474",
  brightYellow: "#b45309",
  brightBlue: "#13aece",
  brightMagenta: "#13aece",
  brightCyan: "#347474",
  brightWhite: "#0f172a",
};

// Colour the playground's run-log lines (project:run output) as they stream in.
const ansi = (line: string) => {
  const l = line ?? "";
  if (l.startsWith("$")) return `\x1b[36m${l}\x1b[0m`; // command → cyan
  if (l.startsWith("✓") || l.startsWith("✔")) return `\x1b[32m${l}\x1b[0m`; // ok → green
  if (l.startsWith("✗") || l.startsWith("✖")) return `\x1b[31m${l}\x1b[0m`; // fail → red
  if (l.startsWith(">")) return `\x1b[38;5;244m${l}\x1b[0m`; // npm subline → dim
  return l;
};

export function Terminal({
  slug,
  onClose,
  output,
  collapsed,
  onToggle,
}: TerminalProps) {
  const user = useUser();
  const { theme } = useTheme();
  const isDark = !theme || theme.includes("dark");
  const hostRef = useRef<HTMLDivElement>(null);
  const xtRef = useRef<any>(null);
  const fitRef = useRef<any>(null);
  const sessionRef = useRef<string | null>(null);
  const writtenRef = useRef(0); // run-log lines already written

  // ── boot a real xterm + wire the PTY socket ──
  useEffect(() => {
    if (!hostRef.current || xtRef.current) return;
    // client-only deps
    const XTerm = require("xterm").Terminal;
    const FitAddon = require("xterm-addon-fit").FitAddon;

    const xt = new XTerm({
      theme: isDark ? XTERM_DARK : XTERM_LIGHT,
      fontFamily: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
      fontSize: 12.5,
      lineHeight: 1.35,
      cursorBlink: true,
      convertEol: true,
      scrollback: 2000,
      letterSpacing: 0,
    });
    const fit = new FitAddon();
    xt.loadAddon(fit);
    xt.open(hostRef.current);
    requestAnimationFrame(() => {
      try {
        fit.fit();
      } catch {}
    });
    xtRef.current = xt;
    fitRef.current = fit;

    // seed with any run-log lines already collected by the playground
    (output ?? []).forEach((l) => xt.writeln(ansi(l)));
    writtenRef.current = (output ?? []).length;

    // start the interactive PTY in the sandbox container
    socket.emit("term:start", {
      userId: user?.id,
      projectName: slug,
      cols: xt.cols,
      rows: xt.rows,
    });

    // forward every keystroke to the PTY (raw — the shell echoes back)
    const dataDisp = xt.onData((d: string) => {
      if (sessionRef.current)
        socket.emit("term:stdin", {
          sessionId: sessionRef.current,
          userId: user?.id,
          projectName: slug,
          data: d,
        });
    });

    const onTermData = ({ sessionId, data }: any) => {
      if (!sessionRef.current || sessionId === sessionRef.current) xt.write(data);
    };
    const onStarted = ({ sessionId }: { sessionId: string }) => {
      sessionRef.current = sessionId;
    };
    const onExit = () => {
      xt.writeln("\r\n\x1b[38;5;244m[session ended — restart to reconnect]\x1b[0m");
      sessionRef.current = null;
    };
    const onError = ({ message }: any) => {
      if (message) xt.writeln(`\x1b[31m${message}\x1b[0m`);
    };

    socket.on("term:data", onTermData);
    socket.on("term:started", onStarted);
    socket.on("term:restarted", onStarted);
    socket.on("term:exit", onExit);
    socket.on("term:error", onError);

    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
      } catch {}
    });
    ro.observe(hostRef.current);

    return () => {
      dataDisp.dispose();
      ro.disconnect();
      socket.off("term:data", onTermData);
      socket.off("term:started", onStarted);
      socket.off("term:restarted", onStarted);
      socket.off("term:exit", onExit);
      socket.off("term:error", onError);
      if (sessionRef.current)
        socket.emit("term:stop", { sessionId: sessionRef.current });
      xt.dispose();
      xtRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // stream new run-log lines into xterm as the playground appends them
  useEffect(() => {
    const xt = xtRef.current;
    if (!xt || !output) return;
    for (let i = writtenRef.current; i < output.length; i++)
      xt.writeln(ansi(output[i]));
    writtenRef.current = output.length;
  }, [output]);

  // live-switch the xterm palette when the app theme flips
  useEffect(() => {
    if (xtRef.current) xtRef.current.options.theme = isDark ? XTERM_DARK : XTERM_LIGHT;
  }, [isDark]);

  const clearTerm = () => xtRef.current?.clear();
  const restartTerm = () =>
    socket.emit("term:start", { userId: user?.id, projectName: slug });
  const showHelp = () => {
    const xt = xtRef.current;
    if (!xt) return;
    [
      "\x1b[1;36mAvailable commands\x1b[0m",
      "  \x1b[36mnpm start\x1b[0m   run your server",
      "  \x1b[36mls\x1b[0m          list project files",
      "  \x1b[36mnode -v\x1b[0m     print the Node version",
      "  \x1b[36mclear\x1b[0m       clear the terminal",
    ].forEach((l) => xt.writeln(l));
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header — 32px, matches mock */}
      <div className="flex items-center gap-2.5 h-8 flex-none pr-2 pl-3 border-b border-border bg-secondary">
        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] uppercase text-foreground">
          <TerminalSquare className="h-3.5 w-3.5 text-[#5fb0b0]" />
          Terminal
        </span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Show terminal commands"
          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={showHelp}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Clear terminal"
          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={clearTerm}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Restart terminal"
          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={restartTerm}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={collapsed ? "Expand terminal" : "Collapse terminal"}
          title={collapsed ? "Expand" : "Collapse"}
          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={() => (onToggle ? onToggle() : onClose(false))}
        >
          <svg
            viewBox="0 0 24 24"
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              collapsed && "rotate-180",
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </Button>
      </div>

      {/* real xterm.js host */}
      <div ref={hostRef} className="flex-1 min-h-0 overflow-hidden px-2 pt-1.5" />
    </div>
  );
}
