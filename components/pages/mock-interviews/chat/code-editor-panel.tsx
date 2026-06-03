"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface CodeEditorPanelProps {
  onSendToKap: (code: string, language: string) => void;
  disabled?: boolean;
  savedCode?: string | null;
  savedLanguage?: string | null;
}

const LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "C++",
  "SQL",
];

const STARTER_TEMPLATES: Record<string, string> = {
  JavaScript: `/**
 * @param {number[]} nums
 * @return {number}
 */
function solution(nums) {
  // Write your solution here

  return 0;
}

// Test your solution
console.log(solution([1, 2, 3]));`,
  TypeScript: `function solution(nums: number[]): number {
  // Write your solution here

  return 0;
}

// Test your solution
console.log(solution([1, 2, 3]));`,
  Python: `def solution(nums: list[int]) -> int:
    """Write your solution here."""

    return 0


# Test your solution
print(solution([1, 2, 3]))`,
  Java: `import java.util.*;

public class Solution {
    public int solution(int[] nums) {
        // Write your solution here

        return 0;
    }

    public static void main(String[] args) {
        Solution s = new Solution();
        System.out.println(s.solution(new int[]{1, 2, 3}));
    }
}`,
  Go: `package main

import "fmt"

func solution(nums []int) int {
	// Write your solution here

	return 0
}

func main() {
	fmt.Println(solution([]int{1, 2, 3}))
}`,
  Rust: `fn solution(nums: Vec<i32>) -> i32 {
    // Write your solution here

    0
}

fn main() {
    println!("{}", solution(vec![1, 2, 3]));
}`,
  "C++": `#include <iostream>
#include <vector>
using namespace std;

int solution(vector<int>& nums) {
    // Write your solution here

    return 0;
}

int main() {
    vector<int> nums = {1, 2, 3};
    cout << solution(nums) << endl;
    return 0;
}`,
  SQL: `-- Write your SQL query here
SELECT
    id,
    name,
    created_at
FROM users
WHERE active = true
ORDER BY created_at DESC
LIMIT 10;`,
};

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-[#1e1e1e]">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

export function CodeEditorPanel({
  onSendToKap,
  disabled,
  savedCode,
  savedLanguage,
}: CodeEditorPanelProps) {
  const [language, setLanguage] = useState(savedLanguage || "JavaScript");
  const [code, setCode] = useState<string>(
    savedCode ?? STARTER_TEMPLATES["JavaScript"],
  );

  const handleLanguageChange = (newLang: string) => {
    const currentIsTemplate = Object.values(STARTER_TEMPLATES).includes(code);
    setLanguage(newLang);
    // Reset to starter template only when no saved code and user hasn't edited
    if (!savedCode && currentIsTemplate) {
      setCode(STARTER_TEMPLATES[newLang] ?? "");
    }
  };

  const monacoLanguage = language
    .toLowerCase()
    .replace("c++", "cpp");

  const handleSend = () => {
    if (disabled) return;
    onSendToKap(code, language);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-[#1e1e1e]">
        <span className="text-xs text-muted-foreground">Language:</span>
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={disabled}
          className="text-xs bg-[#2d2d2d] text-foreground border border-border rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language={monacoLanguage}
          value={code}
          theme="vs-dark"
          onChange={(val) => setCode(val ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            wordWrap: "on",
            readOnly: disabled,
            scrollBeyondLastLine: false,
            padding: { top: 8, bottom: 8 },
            lineNumbers: "on",
            folding: false,
            glyphMargin: false,
            lineDecorationsWidth: 8,
          }}
        />
      </div>

      {/* Send footer */}
      {!disabled && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-background">
          <span className="text-[10px] text-muted-foreground">
            Share your solution with Kap
          </span>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={disabled || !code.trim()}
            className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="w-3.5 h-3.5" />
            Send to Kap
          </Button>
        </div>
      )}
    </div>
  );
}
