"use client";

import { useState } from "react";
import { Check, X, HelpCircle, RotateCcw, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

// A lightweight, ungraded knowledge-check embedded in an article. Immediate
// feedback only — it doesn't submit to the path's quiz scoring.
export function InlineQuiz({
  question,
  options,
  answer,
  explanation,
}: {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const correct = selected === answer;

  return (
    <div className="my-7 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-5 py-3">
        <HelpCircle className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Quick checkpoint</span>
      </div>

      <div className="px-5 py-5">
        <p className="text-[15px] font-semibold leading-snug">{question}</p>

        <div className="mt-4 space-y-2.5">
          {options.map((option, i) => {
            const isSelected = selected === i;
            const isCorrect = i === answer;
            const showCorrect = revealed && isCorrect;
            const showWrong = revealed && isSelected && !isCorrect;

            let cls = "border-border bg-background/40 hover:bg-muted/60";
            if (showCorrect) cls = "border-[#5fb0b0] bg-[#347474]/15";
            else if (showWrong) cls = "border-red-500/60 bg-red-500/10";
            else if (isSelected) cls = "border-foreground/40 bg-muted";

            return (
              <button
                key={i}
                type="button"
                disabled={revealed}
                onClick={() => setSelected(i)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-[14px] transition-colors disabled:cursor-default ${cls}`}
              >
                <span
                  className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-md text-[11px] font-bold ${
                    showCorrect
                      ? "bg-[#347474] text-white"
                      : showWrong
                        ? "bg-red-500 text-white"
                        : isSelected
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {showCorrect ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : showWrong ? (
                    <X className="h-3.5 w-3.5" />
                  ) : (
                    LETTERS[i]
                  )}
                </span>
                <span className="min-w-0 flex-1">{option}</span>
              </button>
            );
          })}
        </div>

        {revealed && (
          <div
            className={`mt-4 rounded-xl border p-3.5 ${
              correct
                ? "border-[#5fb0b0]/40 bg-[#347474]/10"
                : "border-red-500/30 bg-red-500/5"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              {correct ? (
                <>
                  <Check className="h-4 w-4 text-[#5fb0b0]" />
                  <span className="text-[#5fb0b0]">Correct!</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-red-400" />
                  <span className="text-red-400">Not quite</span>
                </>
              )}
            </div>
            {explanation && (
              <p className="mt-1.5 flex gap-1.5 text-sm leading-relaxed text-muted-foreground">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#caa000]" />
                {explanation}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
        {revealed ? (
          <Button
            variant="outline"
            onClick={() => {
              setSelected(null);
              setRevealed(false);
            }}
            className="h-9 gap-1.5 border-border bg-transparent px-4 text-[13px]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Try again
          </Button>
        ) : (
          <Button
            onClick={() => setRevealed(true)}
            disabled={selected == null}
            className="h-9 rounded-lg bg-gradient-to-br from-primary to-[#2BB8D8] px-5 text-[13px] font-bold text-[#06222b] hover:brightness-110 disabled:opacity-40"
          >
            Submit Answer
          </Button>
        )}
      </div>
    </div>
  );
}
