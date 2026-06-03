"use client";

import { useState, useRef, useId, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Mic, MicOff } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
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

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="px-4 pb-4 sm:pb-5 pt-2 bg-background">
      {/* sr-only label for screen readers */}
      <label htmlFor={inputId} className="sr-only">
        Your response to Kap
      </label>

      <div className="flex items-end gap-2">
        {/* Textarea */}
        <div className="flex-1 relative">
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
              "w-full resize-none rounded-xl border border-input bg-background",
              // 16px minimum on mobile prevents iOS zoom on focus
              "px-4 pr-10 py-3 text-[16px] sm:text-sm text-foreground leading-[1.5]",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-shadow",
            )}
            style={{ minHeight: 48, maxHeight: 128, overflow: "hidden" }}
          />
          {/* Send button inside textarea */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send response"
            className={cn(
              "absolute right-2.5 bottom-2.5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              canSend
                ? "text-foreground/70 hover:bg-muted"
                : "text-muted-foreground/30 cursor-not-allowed",
            )}
          >
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Mic button — 44x44 minimum touch target */}
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
              ? "bg-destructive text-destructive-foreground shadow-md motion-safe:animate-pulse"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
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
