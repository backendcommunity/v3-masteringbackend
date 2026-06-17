// socket.ts
import { io } from "socket.io-client";
import { getStoredUser } from "./user-store";

// mb-executor's handshake auth needs identity:
//  - prod: a JWT in `token`
//  - local dev (no JWT_SECRET): the `userId` directly
// `auth` is a callback so it re-reads the current user on every (re)connect —
// the socket auto-connects before the user is loaded, then reconnects with the
// real userId once the store is populated.
const socket = io(
  process.env.NEXT_PUBLIC_WEBHOOK_URL || "http://localhost:8000",
  {
    withCredentials: true,
    transports: ["websocket", "polling"], // or polling fallback
    auth: (cb) => {
      const user = getStoredUser();
      cb({
        userId: user?.id,
        token: process.env.NEXT_PUBLIC_SOCKET_TOKEN || "your-auth-token",
      });
    },
  }
);
export default socket;
