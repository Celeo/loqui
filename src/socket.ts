// TODO
// deno-lint-ignore-file no-unused-vars require-await

import {
  getUser,
  storeNewUser,
  User,
  userExists,
  usernameRegex,
  validatePassword,
} from "./db.ts";
import { Operation, Operations, parseOperation } from "./operations.ts";

/**
 * Authentication process representation.
 */
export enum SessionStatus {
  ANONYMOUS,
  AUTHENTICATED,
}

/**
 * Information about a user, required for
 * interacting with the server.
 */
export interface UserData {
  socket: WebSocket;
  uuid: string;
  sessionStatus: SessionStatus;
  userInfo: User | null;
  channelMemberships: Array<string>;
}

function updateMap(
  uuid: string,
  connectionMap: Record<string, UserData>,
  userInfo: User,
): void {
  connectionMap[uuid] = {
    ...connectionMap[uuid],
    sessionStatus: SessionStatus.AUTHENTICATED,
    userInfo,
    channelMemberships: [], // TODO
  };
}

async function register(
  operation: Operation,
  socket: WebSocket,
  uuid: string,
  connectionMap: Record<string, UserData>,
): Promise<void> {
  const username = (operation.payload as Array<string>)[0];
  const password = (operation.payload as Array<string>)[1];
  if (!usernameRegex.test(username)) {
    socket.send(`Username must match ${usernameRegex}`);
    return;
  }
  if (password.length < 8 || password.length > 100) {
    socket.send("Password length must be between 8 and 100 (inclusive)");
    return;
  }
  if (!userExists(username)) {
    socket.send("A user with that name already exists");
    return;
  }
  const userInfo = await storeNewUser(username, password);
  updateMap(uuid, connectionMap, userInfo);
  socket.send(`Registered. Welcome, ${username}`);
}

async function authenticate(
  operation: Operation,
  socket: WebSocket,
  uuid: string,
  connectionMap: Record<string, UserData>,
): Promise<void> {
  const username = (operation.payload as Array<string>)[0];
  const password = (operation.payload as Array<string>)[1];
  if (!usernameRegex.test(username)) {
    socket.send(`Username must match ${usernameRegex}`);
    return;
  }
  if (password.length < 8 || password.length > 100) {
    socket.send("Password length must be between 8 and 100 (inclusive)");
    return;
  }
  const dbUser = getUser(username);
  if (dbUser === null) {
    socket.send("Incorrect login information");
    return;
  }
  if (!(await validatePassword(dbUser, password))) {
    socket.send("Incorrect login information");
  }
  updateMap(uuid, connectionMap, dbUser);
  socket.send(`Authenticated. Welcome, ${username}`);
}

async function my_info(
  operation: Operation,
  socket: WebSocket,
  uuid: string,
  connectionMap: Record<string, UserData>,
): Promise<void> {
  if (connectionMap[uuid].sessionStatus !== SessionStatus.AUTHENTICATED) {
    socket.send("Only available after authentication");
    return;
  }
  socket.send(JSON.stringify(connectionMap[uuid]));
}

async function whois(
  operation: Operation,
  socket: WebSocket,
  uuid: string,
  connectionMap: Record<string, UserData>,
): Promise<void> {
  // TODO
}

async function channels(
  operation: Operation,
  socket: WebSocket,
  uuid: string,
  connectionMap: Record<string, UserData>,
): Promise<void> {
  // TODO
}

async function join(
  operation: Operation,
  socket: WebSocket,
  uuid: string,
  connectionMap: Record<string, UserData>,
): Promise<void> {
  // TODO
}

async function leave(
  operation: Operation,
  socket: WebSocket,
  uuid: string,
  connectionMap: Record<string, UserData>,
): Promise<void> {
  // TODO
}

async function message(
  operation: Operation,
  socket: WebSocket,
  uuid: string,
  connectionMap: Record<string, UserData>,
): Promise<void> {
  // TODO
}

const OPERATIONS_MAP: Record<
  number,
  (
    operation: Operation,
    socket: WebSocket,
    uuid: string,
    connectionMap: Record<string, UserData>,
  ) => Promise<void>
> = {
  [Operations.REGISTER]: register,
  [Operations.AUTHENTICATE]: authenticate,
  [Operations.MY_INFO]: my_info,
  [Operations.WHOIS]: whois,
  [Operations.CHANNELS]: channels,
  [Operations.JOIN]: join,
  [Operations.LEAVE]: leave,
  [Operations.MESSAGE]: message,
};

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
    const operation = parseOperation(event.data);
    if (operation === null) {
      socket.send("No command recognized");
      return;
    }
    try {
      await OPERATIONS_MAP[operation.id](
        operation,
        socket,
        uuid,
        connectionMap,
      );
    } catch (e) {
      const username = connectionMap[uuid].userInfo?.username || "*unknown*";
      console.log(
        `Error processing operation ${operation.id} from ${username}: ${e}`,
      );
    }
  };
}
