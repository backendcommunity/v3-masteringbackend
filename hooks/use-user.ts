import { dataStore, User } from "@/lib/data";
import { localDB } from "@/lib/localDB";
import { useAppStore } from "@/lib/store";

export function useUser() {
  // Subscribe to version so components re-render whenever syncUserSnapshot
  // or forceUpdate() is called after a point-awarding mutation.
  useAppStore((s) => s.version);

  let user: User | any = dataStore.user;

  try {
    const u = localDB.get("user", "");
    if (!u?.includes("undefined")) user = JSON.parse(u!);
    return user;
  } catch (error) {
    return user;
  }
}
