import { serve } from "./deps.ts";
import { Channel, createTables, getAllChannels } from "./db.ts";
import {
  makeOperationResponse,
  parseOperation,
  SessionStatus,
  UserData,
} from "./util.ts";
import { OPERATIONS_MAP } from "./operations/index.ts";

/**
 * Set up the websocket's connections.
 */
function handleSocket(
  socket: WebSocket,
  connectionMap: Record<string, UserData>,
  channels: Array<Channel>,
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

  socket.onmessage = async (event: MessageEvent<string>) => {
    const operation = parseOperation(event.data);
    if (operation === null) {
      socket.send(
        JSON.stringify(
          makeOperationResponse(-1, false, "No command recognized"),
        ),
      );
      return;
    }
    try {
      await OPERATIONS_MAP[operation.id]({
        operation,
        socket,
        uuid,
        connectionMap,
        channels,
      });
    } catch (e) {
      const username = connectionMap[uuid].userInfo?.username || "*unknown*";
      console.log(
        `Error processing operation ${operation.id} from ${username}: ${e}`,
      );
      socket.send(
        JSON.stringify(
          makeOperationResponse(
            operation.id,
            false,
            "Could not process operation",
          ),
        ),
      );
    }
  };

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
  const channels = getAllChannels();
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
        handleSocket(socket, connectionMap, channels);
        return response;
      }
      return new Response("Open a websocket connection to /ws");
    },
    { hostname, port },
  );
}
