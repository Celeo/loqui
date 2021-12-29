import { serve } from "./deps.ts";
import { createTables } from "./db.ts";
import {
  SessionStatus,
  socketOnMessage,
  UserData,
  usernameRegex,
} from "./socket.ts";

/**
 * Set up the websocket's connections.
 */
function handleSocket(
  socket: WebSocket,
  connectionMap: Record<string, UserData>,
): void {
  const uuid = crypto.randomUUID();
  connectionMap[uuid] = {
    socket,
    sessionStatus: SessionStatus.SUPPLY_USERNAME,
    username: null,
    channels: [],
  };

  socket.onopen = () => {
    socket.send("Welcome!");
    socket.send(
      `Please supply a username as your first message, matching ${usernameRegex}.`,
    );
  };

  socket.onmessage = socketOnMessage(socket, uuid, connectionMap);

  socket.onerror = (event) => {
    if (event instanceof ErrorEvent) {
      if (connectionMap[uuid].username !== null) {
        console.log(
          `Socket error from ${connectionMap[uuid].username}: ${event.message}`,
        );
      } else {
        console.log(`Socket error from ${uuid}: ${event.message}`);
      }
    }
  };

  socket.onclose = () => {
    if (connectionMap[uuid].username !== null) {
      console.log(`${connectionMap[uuid].username} disconnected`);
    }
    delete connectionMap[uuid];
  };
}

/**
 * Serve the HTTP server.
 */
export function main(hostname: string, port: number) {
  createTables();
  const connectionMap = {};
  console.log(`Listening on ${hostname}:${port}`);
  serve(
    (request: Request): Response => {
      if (request.url.endsWith("/ws")) {
        let socket, response;
        try {
          const res = Deno.upgradeWebSocket(request);
          socket = res.socket;
          response = res.response;
        } catch {
          return new Response("Websocket upgrade failed", { status: 400 });
        }
        handleSocket(socket, connectionMap);
        return response;
      }
      return new Response("Open a websocket connection to /ws");
    },
    { hostname, port },
  );
}
