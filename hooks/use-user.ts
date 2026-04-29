
import { useUserStore } from "@/lib/user-store";
import type { User } from "@/lib/data";

export function useUser(): User | null {
  return useUserStore((s) => s.user);
}
