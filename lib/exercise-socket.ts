import { io, type Socket } from "socket.io-client";
import { deriveAcademyOrigin } from "./exercise-playground";

let socket: Socket | null = null;

/** Singleton Socket.IO connection to the academy exercise gateway. */
export function getExerciseSocket(): Socket {
  if (socket) return socket;
  const origin =
    process.env.NEXT_PUBLIC_ACADEMY_SOCKET_URL ??
    deriveAcademyOrigin(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081/api/v3");

  socket = io(origin, {
    path: "/exercise-socket",
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
  });
  return socket;
}
