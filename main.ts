import { serve } from "https://deno.land/std@0.119.0/http/server.ts";

/**
 * Set up websocket connections.
 */
function handleSocket(
  socket: WebSocket,
  connectionMap: Record<string, WebSocket>
): void {
  const uuid = crypto.randomUUID();
  connectionMap[uuid] = socket;
  socket.onopen = () => {
    socket.send("Welcome!");
  };
  socket.onmessage = (event) => {
    const trimmed = event.data.trim();
    if (trimmed.length > 0) {
      console.log(`Message from ${uuid}: ${event.data.trim()}`);
      Object.keys(connectionMap)
        .filter((key) => key !== uuid)
        .forEach((key) => {
          connectionMap[key].send(`[${uuid}] ${trimmed}`);
        });
    }
  };
  socket.onerror = (event) => {
    if (event instanceof ErrorEvent) {
      console.log(`Socket error: ${event.message}`);
    }
  };
  socket.onclose = () => {
    delete connectionMap[uuid];
  };
}

/**
 * Serve an HTTP server.
 */
function main(hostname: string, port: number) {
  const connectionMap = {};

  console.log(`Listening on ${hostname}:${port}`);
  serve(
    (request: Request): Response => {
      // console.log(connectionMap);
      if (request.url.endsWith("/ws")) {
        let socket, response;
        try {
          const res = Deno.upgradeWebSocket(request);
          socket = res.socket;
          response = res.response;
        } catch {
          return new Response("Websocket upgrade failed");
        }
        handleSocket(socket, connectionMap);
        return response;
      }
      return new Response("Open a websocket connection to /ws");
    },
    { hostname, port }
  );
}

if (import.meta.main) {
  main("127.0.0.1", 8080);
}
