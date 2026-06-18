export const ALL_LANGUAGES = [
  { value: "node", label: "JavaScript (Node.js)" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "perl", label: "Perl" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "typescript", label: "TypeScript" },
];

export const DYNAMIC_LANGUAGES = ["node", "python", "php", "ruby", "perl"];

export type LanguageOption = { value: string; label: string };

interface ExerciseForStub {
  starterCode?: string;
  languages?: string[];
  graderConfig?: {
    entry?: string;
    signature?: {
      params?: Array<{ name: string; type: string }>;
      returns?: string;
    };
  };
}

/** Returns the language options available for a given grader type + exercise. */
export function languageOptions(
  graderType: string,
  exercise: ExerciseForStub
): LanguageOption[] {
  if (graderType === "TEST_CASES") {
    const native = exercise.languages?.[0] ?? "node";
    return ALL_LANGUAGES.filter((l) => l.value === native);
  }
  if (graderType === "OUTPUT_MATCH") {
    return ALL_LANGUAGES;
  }
  if (graderType === "FUNCTION_CALL") {
    const hasSig = !!exercise.graderConfig?.signature;
    if (hasSig) return ALL_LANGUAGES;
    return ALL_LANGUAGES.filter((l) => DYNAMIC_LANGUAGES.includes(l.value));
  }
  return ALL_LANGUAGES;
}

// ── Per-language OUTPUT_MATCH stubs (read stdin, print) ──────────────────────
const OUTPUT_MATCH_STUBS: Record<string, string> = {
  node: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
  // process lines and console.log your answer
});`,
  python: `import sys

lines = sys.stdin.read().splitlines()
# process lines and print your answer`,
  java: `import java.util.Scanner;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // read input and System.out.println your answer
    }
}`,
  go: `package main
import (
    "bufio"
    "fmt"
    "os"
)
func main() {
    scanner := bufio.NewScanner(os.Stdin)
    for scanner.Scan() {
        line := scanner.Text()
        _ = line
    }
    fmt.Println("your answer")
}`,
  rust: `use std::io::{self, BufRead};
fn main() {
    let stdin = io::stdin();
    for line in stdin.lock().lines() {
        let _line = line.unwrap();
    }
    println!("your answer");
}`,
  cpp: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string line;
    while (getline(cin, line)) {
        // process line
    }
    cout << "your answer" << endl;
    return 0;
}`,
  csharp: `using System;
class Solution {
    static void Main() {
        string line;
        while ((line = Console.ReadLine()) != null) {
            // process line
        }
        Console.WriteLine("your answer");
    }
}`,
  ruby: `STDIN.each_line do |line|
  # process line
end
puts "your answer"`,
  php: `<?php
$lines = [];
while (($line = fgets(STDIN)) !== false) {
    $lines[] = trim($line);
}
// process $lines and echo your answer`,
  perl: `use strict;
use warnings;
while (my $line = <STDIN>) {
    chomp $line;
    # process line
}
print "your answer\n";`,
  swift: `import Foundation
while let line = readLine() {
    // process line
}
print("your answer")`,
  kotlin: `fun main() {
    val lines = generateSequence(::readLine).toList()
    // process lines and println your answer
}`,
  typescript: `import * as readline from 'readline';
const rl = readline.createInterface({ input: process.stdin });
const lines: string[] = [];
rl.on('line', (line: string) => lines.push(line));
rl.on('close', () => {
  // process lines and console.log your answer
});`,
};

// ── Per-language FUNCTION_CALL dynamic stubs ─────────────────────────────────
function dynamicFcStub(lang: string, entry: string): string {
  switch (lang) {
    case "node":
      return `function ${entry}(/* args */) {\n  \n}`;
    case "python":
      return `def ${entry}(*args):\n    pass`;
    case "php":
      return `<?php\nfunction ${entry}() {\n    // implement\n}`;
    case "ruby":
      return `def ${entry}(*args)\n  # implement\nend`;
    case "perl":
      return `sub ${entry} {\n    my @args = @_;\n    # implement\n}`;
    default:
      return `// Implement ${entry}`;
  }
}

// ── Per-language FUNCTION_CALL static stubs (with signature) ─────────────────
function staticFcStub(
  lang: string,
  entry: string,
  signature: { params?: Array<{ name: string; type: string }>; returns?: string }
): string {
  const params = signature.params ?? [];
  const returns = signature.returns ?? "void";

  switch (lang) {
    case "java": {
      const jParams = params.map((p) => `${p.type} ${p.name}`).join(", ");
      return `public class Solution {\n    public static ${returns} ${entry}(${jParams}) {\n        // implement\n    }\n}`;
    }
    case "go": {
      const gParams = params.map((p) => `${p.name} ${p.type}`).join(", ");
      return `package main\n\nfunc ${entry}(${gParams}) ${returns} {\n    // implement\n}`;
    }
    case "rust": {
      const rParams = params.map((p) => `${p.name}: ${p.type}`).join(", ");
      return `fn ${entry}(${rParams}) -> ${returns} {\n    // implement\n}`;
    }
    case "cpp": {
      const cParams = params.map((p) => `${p.type} ${p.name}`).join(", ");
      return `${returns} ${entry}(${cParams}) {\n    // implement\n}`;
    }
    case "csharp": {
      const csParams = params.map((p) => `${p.type} ${p.name}`).join(", ");
      return `public static ${returns} ${entry}(${csParams}) {\n    // implement\n}`;
    }
    case "swift": {
      const swParams = params.map((p) => `_ ${p.name}: ${p.type}`).join(", ");
      return `func ${entry}(${swParams}) -> ${returns} {\n    // implement\n}`;
    }
    case "kotlin": {
      const ktParams = params.map((p) => `${p.name}: ${p.type}`).join(", ");
      return `fun ${entry}(${ktParams}): ${returns} {\n    // implement\n}`;
    }
    case "typescript": {
      const tsParams = params.map((p) => `${p.name}: ${p.type}`).join(", ");
      return `function ${entry}(${tsParams}): ${returns} {\n  \n}`;
    }
    default:
      return dynamicFcStub(lang, entry);
  }
}

/**
 * Returns starter code for the given graderType + language + exercise.
 *
 * Rules:
 * - Native language (first of exercise.languages) → return exercise.starterCode ?? ""
 * - OUTPUT_MATCH, non-native → read-stdin/print scaffold
 * - FUNCTION_CALL, non-native, dynamic lang → function entry stub
 * - FUNCTION_CALL, non-native, static lang WITH signature → typed stub
 * - FUNCTION_CALL, non-native, static lang WITHOUT signature → comment stub
 * - TEST_CASES → always returns starterCode (only native shown in selector anyway)
 */
export function stubFor(
  graderType: string,
  language: string,
  exercise: ExerciseForStub
): string {
  const nativeLang = exercise.languages?.[0];
  const isNative = language === nativeLang;

  if (isNative || graderType === "TEST_CASES") {
    return exercise.starterCode ?? "";
  }

  if (graderType === "OUTPUT_MATCH") {
    return OUTPUT_MATCH_STUBS[language] ?? `// Write a solution in ${language}`;
  }

  if (graderType === "FUNCTION_CALL") {
    const entry = exercise.graderConfig?.entry ?? "solution";
    const signature = exercise.graderConfig?.signature;

    if (DYNAMIC_LANGUAGES.includes(language)) {
      return dynamicFcStub(language, entry);
    }
    // Static lang
    if (signature) {
      return staticFcStub(language, entry, signature);
    }
    // Static lang without signature — comment stub
    return `// Implement ${entry} in ${language}\n// (signature not available for this language)`;
  }

  return exercise.starterCode ?? "";
}
