import { useUser } from "@/hooks/use-user";
import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// {
//     "name": "Python",
//     "code": "python"
// },
// {
//     "name": "Java",
//     "code": "java"
// },
// {
//     "name": "Rust",
//     "code": "rust"
// }

export function onNavigate(path: string) {
  // This is a placeholder function for navigation
  // In a real app, this would use Next.js router or similar
  console.log(`Navigating to: ${path}`);
}
export const terminalSample = [
  "Welcome to MB Projects Terminal",
  "$ npm install",
  "✓ Dependencies installed successfully",
  "$ npm start",
  "Server running on http://localhost:3000",
  "",
];

export const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "json":
      return "json";
    case "html":
      return "html";
    case "css":
      return "css";
    case "scss":
    case "sass":
      return "scss";
    case "md":
      return "markdown";
    case "py":
      return "python";
    case "java":
      return "java";
    case "cpp":
    case "c":
      return "cpp";
    case "php":
      return "php";
    case "rb":
      return "ruby";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "sql":
      return "sql";
    case "xml":
      return "xml";
    case "yaml":
    case "yml":
      return "yaml";
    default:
      return "plaintext";
  }
};

export function codeSample() {
  return `
  // Online Code Editor for free
  // Write, Edit and Run your code using Online Compiler
  // Select your programming language below
`;
}

export const handleShare = (title: string, url: string) => {
  if (navigator.share) {
    navigator
      .share({
        title: `Watch "${title}" on MasteringBackend`,
        text: `I'm learning from this great video: "${title}" on MasteringBackend.\nJoin me to become a great backend engineer!`,
        url: url,
      })
      .then(() => toast.success("Thanks for sharing!"))
      .catch((error) => toast.error("Error sharing", error));
  } else {
    // Fallback for browsers that don’t support navigator.share
    const shareText = `I'm watching "${title}" on MasteringBackend. Check it out: ${url}`;
    navigator.clipboard.writeText(shareText);
    toast.success(
      "Link copied to clipboard! You can now share it with your friends."
    );
  }
};

export const formatDate = (date: string) => {
  const user = useUser();

  if (!date || date.includes("Free forever")) return date;

  const format = user?.settings?.dateFormat ?? "mdy"; // Default to mdy if not set
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;

  const pad = (n: number) => String(n).padStart(2, "0");

  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1); // Months are 0-based
  const year = d.getFullYear();

  switch (format) {
    case "dmy":
      return `${day}/${month}/${year}`;
    case "ymd":
      return `${year}-${month}-${day}`;
    case "mdy":
    default:
      return `${month}/${day}/${year}`;
  }
};

export function preprocessTerminalOutput(raw: string) {
  // --- Handle carriage return (\r) ---
  const lines = raw.split("\n").reduce<string[]>((acc, line) => {
    if (line.includes("\r")) {
      const parts = line.split("\r");
      acc.push(parts[parts.length - 1]); // keep last overwrite
    } else {
      acc.push(line);
    }
    return acc;
  }, []);

  // --- Regex for ANSI escape sequences ---
  const ansiRegex = /\x1b\[(\d+)(;\d+)*m/g; // e.g. \x1b[31m or \x1b[1;32m

  // Mapping ANSI codes → Tailwind classes
  const ansiToClass: Record<string, string> = {
    "0": "text-gray-300", // reset/default
    "1": "font-bold",
    "30": "text-black",
    "31": "text-red-400",
    "32": "text-green-400",
    "33": "text-yellow-400",
    "34": "text-blue-400",
    "35": "text-pink-400",
    "36": "text-cyan-400",
    "37": "text-white",
    "90": "text-gray-500",
    "91": "text-red-500",
    "92": "text-green-500",
    "93": "text-yellow-500",
    "94": "text-blue-500",
    "95": "text-pink-500",
    "96": "text-cyan-500",
    "97": "text-white",
  };

  // --- Split lines and parse ANSI ---
  return lines.map((line) => {
    const spans = [];
    let lastIndex = 0;
    let currentClass = "text-gray-300"; // default

    line.replace(ansiRegex, (match, p1, p2, offset) => {
      // Push text before ANSI code
      if (offset > lastIndex) {
        spans.push({
          text: line.slice(lastIndex, offset),
          className: currentClass,
        });
      }

      // Parse codes (may be multiple: e.g. "1;32")
      const codes = [p1, ...(p2 ? p2.split(";").slice(1) : [])];
      codes.forEach((c) => {
        if (ansiToClass[c]) {
          currentClass = ansiToClass[c];
        } else if (c === "0") {
          currentClass = "text-gray-300"; // reset
        }
      });

      lastIndex = offset + match.length;
      return "";
    });

    // Push any trailing text
    if (lastIndex < line.length) {
      spans.push({
        text: line.slice(lastIndex).replace(/\t/g, "    "),
        className: currentClass,
      });
    }

    return spans;
  });
}

export function formatRelativeDate(
  dateString: string,
  targetTimezone: string
): string {
  const now = new Date();
  const inputDate = new Date(dateString);

  // Converts to timezone-correct date object
  const convertToTZ = (d: Date) =>
    new Date(
      new Intl.DateTimeFormat("en-US", {
        timeZone: targetTimezone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      }).format(d)
    );

  const tzNow = convertToTZ(now);
  const tzDate = convertToTZ(inputDate);

  // Helpers
  const diffDays = Math.floor(
    (tzDate.getTime() - new Date(tzNow.toDateString()).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: targetTimezone,
  }).format(inputDate);

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: targetTimezone,
  }).format(inputDate);

  const tzAbbrev = inputDate
    .toLocaleDateString("en-US", {
      timeZone: targetTimezone,
      timeZoneName: "short",
    })
    .split(" ")
    .pop()!;

  // Natural language rules
  let prefix = "";

  if (diffDays === 0) {
    prefix = "Today";
  } else if (diffDays === 1) {
    prefix = "Tomorrow";
  } else if (diffDays >= 2 && diffDays <= 6) {
    prefix = weekday; // e.g., "Friday"
  } else if (diffDays >= 7 && diffDays < 14) {
    prefix = `Next ${weekday}`;
  } else {
    // Long future → use full date
    const longDate = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: targetTimezone,
    }).format(inputDate);

    return `${longDate}, ${time} ${tzAbbrev}`;
  }

  return `${prefix}, ${time} ${tzAbbrev}`;
}
