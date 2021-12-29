import { getUser, storeNewUser, userExists, validatePassword } from "./db.ts";

/**
 * Username requirements.
 */
export const usernameRegex = /^[a-z0-9][a-z0-9_-]{2,14}$/;

/**
 * Authentication process.
 */
export enum SessionStatus {
  SUPPLY_USERNAME,
  SUPPLY_PASSWORD,
  AUTHENTICATED,
}

/**
 * Information about a user, required for
 * interacting with the server.
 */
export interface UserData {
  socket: WebSocket;
  sessionStatus: SessionStatus;
  username: string | null;
  channels: Array<string>;
}

/**
 * Handler for socket messages.
 *
 * Takes the socket, user uuid, and connectionMap, and returns
 * an async function to handle messages from the client.
 */
export function socketOnMessage(
  socket: WebSocket,
  uuid: string,
  connectionMap: Record<string, UserData>,
): (event: MessageEvent<string>) => Promise<void> {
  return async function (event: MessageEvent<string>) {
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
      // Currently this is taking a very simple approach to
      // authentication; this will need to be updated to support
      // the operation schema.
      case SessionStatus.SUPPLY_USERNAME: {
        if (usernameRegex.test(trimmed)) {
          if (
            Object.values(connectionMap).find((data) =>
              data.username === trimmed
            ) !== null
          ) {
            socket.send(
              "That username is currently on the server; you need to use another",
            );
            return;
          }
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
        } else {
          socket.send(`Username "${trimmed}" does not match ${usernameRegex}.`);
        }
        return;
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
        // Currently this is just sending messages, but it'll
        // need to be expanded to support the actual operation
        // schema and non-chatting commands.
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
}
