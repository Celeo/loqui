import { serve } from "./deps.ts";
import {
  createTables,
  getUser,
  storeNewUser,
  userExists,
  validatePassword,
} from "./db.ts";

const usernameRegex = /^[a-z0-9][a-z0-9_-]{2,14}$/;

enum SessionStatus {
  SUPPLY_USERNAME,
  SUPPLY_PASSWORD,
  AUTHENTICATED,
}

interface UserData {
  socket: WebSocket;
  sessionStatus: SessionStatus;
  username: string | null;
  channels: Array<string>;
}

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
      `Please supply a username as you first message, matching ${usernameRegex}.`,
    );
  };

  socket.onmessage = async (event) => {
    if (typeof event.data !== "string") {
      return;
    }
    const trimmed = event.data.trim();
    if (trimmed.length === 0) {
      return;
    }
    const connectionMapEntry = connectionMap[uuid];
    console.log(
      `Message from socket ${uuid} at state ${
        SessionStatus[connectionMapEntry.sessionStatus]
      }`,
    );
    switch (connectionMapEntry.sessionStatus) {
      case SessionStatus.SUPPLY_USERNAME: {
        if (usernameRegex.test(trimmed)) {
          if (userExists(trimmed)) {
            socket.send(
              `Welcome back, ${trimmed}. Please enter the password for that account or disconnect and use another username.`,
            );
          } else {
            socket.send(
              `Welcome, ${trimmed}. Please now set a password of length [8, 100].`,
            );
          }
          connectionMapEntry.username = trimmed;
          connectionMapEntry.sessionStatus = SessionStatus.SUPPLY_PASSWORD;
          return;
        } else {
          socket.send(`Username "${trimmed}" does not match ${usernameRegex}.`);
          return;
        }
      }
      case SessionStatus.SUPPLY_PASSWORD: {
        if (trimmed.length < 8 || trimmed.length > 100) {
          socket.send("Please supply a password of length [8, 100].");
          return;
        }
        const selectedUsername = connectionMapEntry.username as string;
        const dbUser = getUser(selectedUsername);
        if (dbUser === null) {
          await storeNewUser(selectedUsername, trimmed);
          socket.send("New password accepted.");
        } else {
          if (await validatePassword(dbUser, trimmed)) {
            socket.send("Password validated.");
          } else {
            socket.send("Incorrect password.");
            return;
          }
        }
        socket.send(
          `\n=================================\nWelcome to the server!\n=================================\n`,
        );
        connectionMapEntry.sessionStatus = SessionStatus.AUTHENTICATED;
        return;
      }
      case SessionStatus.AUTHENTICATED: {
        Object.keys(connectionMap)
          .filter(
            (key) =>
              key !== uuid &&
              connectionMap[key].sessionStatus === SessionStatus.AUTHENTICATED,
          )
          .forEach((key) => {
            connectionMap[key].socket.send(
              `[${connectionMap[uuid].username}] ${trimmed}`,
            );
          });
        return;
      }
    }
  };

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
