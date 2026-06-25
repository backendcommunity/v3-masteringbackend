"use client";

import { useState, useRef, useId, KeyboardEvent } from "react";
import { sanitizeSvg } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import { ArrowRight, Mic, MicOff, Code2, PenTool, X } from "lucide-react";

interface ChatInputAttachment {
  type: "code" | "whiteboard";
  language?: string;
  svg?: string;
}

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  attachments?: ChatInputAttachment[];
  onRemoveAttachment?: (type: "code" | "whiteboard") => void;
}

export function ChatInput({
  onSend,
  disabled,
  placeholder,
  attachments,
  onRemoveAttachment,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();

  const hasAttachments = (attachments?.length ?? 0) > 0;

  const handleSend = () => {
    const trimmed = value.trim();
    if (disabled) return;
    if (!trimmed && !hasAttachments) return;
    onSend(trimmed);
    setValue("");
    // Restore height after clear
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    // Return focus to input after send
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Escape cancels recording
    if (e.key === "Escape" && isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
  };

  const toggleVoice = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      // Graceful no-op if not supported
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setValue((prev) => (prev ? `${prev} ${t}` : t));
      textareaRef.current?.focus();
    };
    r.onend = () => setIsRecording(false);
    r.onerror = () => setIsRecording(false);
    recognitionRef.current = r;
    r.start();
    setIsRecording(true);
  };

  const canSend = (value.trim().length > 0 || hasAttachments) && !disabled;

  return (
    <div className="px-4 pb-4 sm:pb-5 pt-2 bg-background">
      {/* sr-only label for screen readers */}
      <label htmlFor={inputId} className="sr-only">
        Your response to Kap
      </label>

      {/* Staged attachment chips */}
      {hasAttachments && (
        <div className="flex flex-wrap items-center gap-2 pb-2">
          {attachments!.map((attachment) =>
            attachment.type === "code" ? (
              <span
                key="code"
                className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs text-foreground border border-border"
              >
                <Code2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span>Code{attachment.language ? ` · ${attachment.language}` : ""}</span>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment?.("code")}
                  aria-label="Remove code attachment"
                  className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ) : (
              <span
                key="whiteboard"
                className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs text-foreground border border-border"
              >
                {attachment.svg ? (
                  <span
                    className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-sm bg-white [&_svg]:h-full [&_svg]:w-full"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeSvg(attachment.svg),
                    }}
                  />
                ) : (
                  <PenTool className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                )}
                <span>Diagram</span>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment?.("whiteboard")}
                  aria-label="Remove diagram attachment"
                  className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ),
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id={inputId}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            // Auto-grow
            e.target.style.height = "auto";
            e.target.style.height =
              Math.min(e.target.scrollHeight, 128) + "px";
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Enter response here"}
          disabled={disabled}
          rows={1}
          autoComplete="off"
          autoCorrect="on"
          spellCheck={true}
          aria-label="Your response"
          aria-multiline="true"
          aria-disabled={disabled}
          aria-describedby={isRecording ? `${inputId}-recording` : undefined}
          className={cn(
            "flex-1 resize-none rounded-xl border border-input bg-background",
            // 16px minimum on mobile prevents iOS zoom on focus
            "px-4 py-3 text-[16px] sm:text-sm text-foreground leading-[1.5]",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-shadow",
          )}
          style={{ minHeight: 48, maxHeight: 128, overflow: "hidden" }}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send response"
          className={cn(
            "flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            canSend
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              : "bg-muted text-muted-foreground/40 cursor-not-allowed",
          )}
        >
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Mic button */}
        {isRecording && (
          <span
            id={`${inputId}-recording`}
            className="sr-only"
            aria-live="assertive"
          >
            Recording active. Press Escape or tap the microphone button to stop.
          </span>
        )}
        <button
          type="button"
          onClick={toggleVoice}
          disabled={disabled}
          aria-label={
            isRecording ? "Stop voice recording" : "Start voice input"
          }
          aria-pressed={isRecording}
          className={cn(
            "flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            isRecording
              ? "bg-destructive text-destructive-foreground shadow-lg motion-safe:animate-pulse scale-110"
              : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 hover:border-primary/60",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          {isRecording ? (
            <MicOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Mic className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Keyboard hint — visible only on desktop */}
      <p
        className="hidden sm:block text-[10px] text-muted-foreground/50 mt-1.5 pl-1"
        aria-hidden="true"
      >
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
