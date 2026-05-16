import { Server, Database, Code2, Layers, Cloud, Box, BookOpen, Cpu } from "lucide-react";

const TAG_ICON_MAP: Record<string, any> = {
  "node.js": Server, "nodejs": Server, "node": Server,
  "python": Code2, "typescript": Code2, "javascript": Code2,
  "sql": Database, "postgresql": Database, "mysql": Database, "redis": Database, "mongodb": Database,
  "react": Layers, "nextjs": Layers, "vue": Layers,
  "docker": Box, "kubernetes": Box,
  "aws": Cloud, "gcp": Cloud, "azure": Cloud,
  "go": Cpu, "rust": Cpu,
};

export function getTagIcon(tags?: string[]): any {
  const first = (tags?.[0] ?? "").toLowerCase();
  return TAG_ICON_MAP[first] ?? BookOpen;
}
