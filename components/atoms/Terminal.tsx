"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { SandboxAddon } from "@cloudflare/sandbox/xterm";
import {
  getWorkerToken,
  pgExec,
  pgTerminalUrl,
  type PgCtx,
} from "@/lib/playground-client";
import { TerminalSquare, Trash2, HelpCircle, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import "@xterm/xterm/css/xterm.css";

interface TerminalProps {
  ctx: PgCtx | null;
  output?: string[];
  onClose: (open: boolean) => void;
  collapsed?: boolean;
  onToggle?: () => void;
  /** Per-project terminal sandbox jail. Defaults ON; only `false` disables it. */
  jail?: boolean;
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

export interface TerminalRunHandle {
  /**
   * Writes `cmd` into the live PTY session exactly as if typed, then Enter.
   * Returns `false` (and does nothing) if the PTY isn't connected yet — the
   * `SandboxAddon` WebSocket connect is an async chain
   * (rAF → getWorkerToken → connect) that runs after this ref is already
   * attached, so a Run click in that window must not silently drop the
   * command. Callers should surface feedback when this returns `false`.
   */
  runCommand: (cmd: string) => boolean;

  /**
   * Writes a line of text directly to the terminal display (xterm).
   * Used for mock log emission in demo mode. Automatically formats
   * the line with ANSI codes based on its prefix.
   */
  write: (line: string) => void;
}

export const Terminal = forwardRef<TerminalRunHandle, TerminalProps>(
  function Terminal(
    { ctx, onClose, output, collapsed, onToggle, jail = true },
    ref,
  ) {
  const { theme } = useTheme();
  const isDark = !theme || theme.includes("dark");
  const hostRef = useRef<HTMLDivElement>(null);
  const xtRef = useRef<any>(null);
  const fitRef = useRef<any>(null);
  const addonRef = useRef<SandboxAddon | null>(null);
  const writtenRef = useRef(0); // run-log lines already written
  // Tracks the PTY WebSocket's actual connection state (per the SandboxAddon's
  // onStateChange), which lags behind this component mounting by an async
  // chain (rAF → getWorkerToken → connect). runCommand() checks this before
  // pasting so a Run click in that window is never a silent no-op.
  const connectionStateRef = useRef<"connecting" | "connected" | "disconnected">(
    "connecting",
  );
  // Set inside the boot effect to the current connectPty() closure, so
  // restartPty() (below) can call it without re-running the whole effect.
  const connectPtyRef = useRef<() => Promise<void>>(async () => {});
  const [restarting, setRestarting] = useState(false);

  // ── boot a real xterm + attach the Cloudflare Sandbox PTY addon ──
  //
  // The worker serves the terminal via the Sandbox SDK (`sandbox.terminal()`),
  // which speaks its own PTY framing over the WS (binary frames for data, JSON
  // control messages for ready/error/exit). `@cloudflare/sandbox/xterm`'s
  // `SandboxAddon` speaks that exact framing — so we hand it a URL builder and
  // let it own keystrokes↔PTY, output, and resize. We never touch a raw socket.
  //
  // Effect is keyed on `ctx`: until the worker context exists we render the pane
  // but don't connect; once `ctx` is non-null we boot the terminal and connect.
  useEffect(() => {
    if (!ctx || !hostRef.current || xtRef.current) return;
    // client-only deps. Must be @xterm/xterm (not the deprecated `xterm`
    // package) — @cloudflare/sandbox/xterm's SandboxAddon types against
    // @xterm/xterm's Terminal, and only @xterm/xterm exposes `.input()`
    // (needed to submit a command without triggering bracketed-paste mode).
    const XTerm = require("@xterm/xterm").Terminal;
    const FitAddon = require("@xterm/addon-fit").FitAddon;

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
    xtRef.current = xt;
    fitRef.current = fit;

    const host = hostRef.current;
    let opened = false;
    let disposed = false;
    const safeFit = () => {
      if (!host || !host.offsetWidth || !host.offsetHeight) return;
      try {
        fit.fit();
      } catch {}
    };

    // Build the Sandbox PTY addon. `getWebSocketUrl` runs on every (re)connect,
    // so the freshly-minted token is read at call-time. `sessionId` from the
    // addon is unused by our worker (identity rides the token); we only need a
    // truthy `sandboxId` for the addon's internal connect guard. Token + ids
    // travel in the query string because a browser WS can't set headers.
    const buildAddon = (token: string) =>
      new SandboxAddon({
        reconnect: true,
        getWebSocketUrl: () =>
          pgTerminalUrl(token, ctx, { cols: xt.cols, rows: xt.rows, jail }),
        onStateChange: (state, error) => {
          connectionStateRef.current = state;
          if (state === "disconnected" && error) {
            xt.writeln(`\r\n\x1b[31m${error.message}\x1b[0m`);
          }
        },
      });

    // Mint a fresh worker token and attach a new PTY addon (cols/rows reflect
    // the fitted size). Shared by the initial open AND by restartPty() below —
    // each call to the worker's /terminal produces a brand-new pty/shell, so
    // disconnecting the old addon and re-running this is a genuine restart,
    // not a resume.
    const connectPty = async () => {
      try {
        const token = await getWorkerToken(ctx.slug);
        if (disposed) return;
        const addon = buildAddon(token);
        addonRef.current = addon;
        xt.loadAddon(addon as any);
        addon.connect({ sandboxId: ctx.projectId });
      } catch (e: any) {
        xt.writeln(
          `\r\n\x1b[31m${e?.message ?? "failed to start terminal"}\x1b[0m`,
        );
      }
    };
    connectPtyRef.current = connectPty;

    // Defer open()/fit() until the host actually has a size. Opening xterm on a
    // zero-size element (collapsed panel, or before layout settles) leaves the
    // renderer without dimensions, and the next refresh throws. The
    // ResizeObserver below opens it the moment the host gets a real size.
    const openTerminal = async () => {
      if (opened || disposed || !host || !host.offsetWidth || !host.offsetHeight)
        return;
      opened = true;
      xt.open(host);
      safeFit();
      // seed any run-log lines collected before the terminal opened (BEFORE the
      // PTY attaches, so they sit above the live shell output)
      const out = output ?? [];
      for (let i = writtenRef.current; i < out.length; i++)
        xt.writeln(ansi(out[i]));
      writtenRef.current = out.length;

      await connectPty();
    };
    requestAnimationFrame(openTerminal);

    const ro = new ResizeObserver(() => {
      if (!opened) openTerminal();
      else safeFit(); // fit() fires xterm.onResize → addon sends a resize frame
    });
    ro.observe(host);

    return () => {
      disposed = true;
      ro.disconnect();
      addonRef.current?.dispose();
      addonRef.current = null;
      connectionStateRef.current = "connecting";
      xt.dispose();
      xtRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx]);

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
    if (xtRef.current)
      xtRef.current.options.theme = isDark ? XTERM_DARK : XTERM_LIGHT;
  }, [isDark]);

  useImperativeHandle(
    ref,
    () => ({
      runCommand: (cmd: string) => {
        if (connectionStateRef.current !== "connected") {
          console.warn(
            "[Terminal] runCommand called before the PTY connected; dropping command",
            cmd,
          );
          return false;
        }
        // xterm.js's paste() wraps content in bracketed-paste escapes (real
        // terminal behavior) — bash/readline treat a \r *inside* a bracketed
        // paste as literal text, not a submit, so `paste(cmd + "\r")` types
        // the command but never runs it. `input()` delivers data "the same
        // way input typed into the terminal would" (no bracketed-paste
        // wrapping), exactly matching a real keypress — use it for both the
        // command text and the trailing Enter.
        xtRef.current?.input(cmd, true);
        xtRef.current?.input("\r", true);
        return true;
      },
      write: (line: string) => {
        const xt = xtRef.current;
        if (!xt) return;
        xt.writeln(ansi(line));
      },
    }),
    [],
  );

  // Run the shell `clear` command in the live PTY so the session itself is
  // cleared (not just the local xterm buffer). Falls back to a local clear when
  // the PTY isn't attached yet.
  const clearTerm = () => {
    const xt = xtRef.current;
    if (!xt) return;
    if (addonRef.current) xt.input("clear\r");
    else xt.clear();
  };

  // Full restart: stop whatever's running, tear down the current PTY
  // connection, and open a fresh one — a genuinely new shell process, not a
  // resume. Each /terminal request the worker receives starts a new pty, so
  // disconnecting the old addon and reconnecting is a real restart.
  const restartPty = async () => {
    if (restarting) return;
    setRestarting(true);
    try {
      if (ctx) {
        try {
          // Best-effort: kill anything left running in this project's
          // sandbox before dropping the session, so a restart doesn't leave
          // an orphaned background process. Same REST kill path terminal
          // mode's Run already uses — never blocks the restart if it fails.
          await pgExec(ctx, {
            cmd: "pkill -9 -x node -x python3 2>/dev/null; true",
          });
        } catch {}
      }
      addonRef.current?.disconnect();
      addonRef.current?.dispose();
      addonRef.current = null;
      connectionStateRef.current = "connecting";
      xtRef.current?.reset();
      await connectPtyRef.current();
    } finally {
      setRestarting(false);
    }
  };

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
          title="Stop everything and start a fresh terminal session"
          disabled={restarting}
          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
          onClick={restartPty}
        >
          <RotateCcw className={cn("h-3.5 w-3.5", restarting && "animate-spin")} />
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
  },
);
