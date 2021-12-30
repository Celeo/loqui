import { serve } from "./deps.ts";
import { createTables, getAllChannels } from "./db.ts";
import { SessionStatus, socketOnMessage, UserData } from "./socket.ts";

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
    uuid,
    sessionStatus: SessionStatus.ANONYMOUS,
    userInfo: null,
    channelMemberships: [],
  };

  socket.onopen = () => {
    socket.send("Welcome!");
  };

  socket.onmessage = socketOnMessage(socket, uuid, connectionMap);

  socket.onerror = (event) => {
    if (event instanceof ErrorEvent) {
      const username = connectionMap[uuid].userInfo?.username || "*unknown*";
      console.log(`Socket error from ${username}: ${event.message}`);
    }
  };

  socket.onclose = () => {
    const username = connectionMap[uuid].userInfo?.username;
    if (username) {
      console.log(`${username} disconnected`);
    }
    delete connectionMap[uuid];
  };
}

/**
 * Serve the HTTP server.
 */
export function main(hostname: string, port: number) {
  createTables();
  const channels = getAllChannels(); // TODO use
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
