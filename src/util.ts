import { User } from "./db.ts";

/**
 * Authentication process representation.
 */
export enum SessionStatus {
  ANONYMOUS,
  AUTHENTICATED,
}

/**
 * Information about a user, required for interacting with the server.
 */
export interface UserData {
  socket: WebSocket;
  uuid: string;
  sessionStatus: SessionStatus;
  userInfo: User | null;
  channelMemberships: Array<string>;
}

/**
 * Update the connectionMap with a user's now-authenticated data.
 */
export function updateMap(
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

/** */
export interface EventOperationResponse {
  type: string;
  trigger: string;
  payload: {
    succeeded: boolean;
    operation_id: number;
    message: string;
  };
}

/** */
export function makeOperationResponse(
  id: number,
  succeeded: boolean,
  message: string,
): EventOperationResponse {
  return {
    type: "event",
    trigger: "operation",
    payload: {
      succeeded,
      operation_id: id,
      message,
    },
  };
}

/**
 * Operations invocable by users.
 */
export enum Operations {
  REGISTER = 1,
  AUTHENTICATE,
  MY_INFO,
  WHOIS,
  CHANNELS,
  JOIN,
  LEAVE,
  MESSAGE,
  CHANNEL_CREATE,
  CHANNEL_INVITE,
}

/**
 * Number of operations.
 */
export const OPERATIONS_LENGTH =
  Object.keys(Operations).filter((e) => isNaN(Number(e))).length;

/**
 * Combination of operation identifier and payload.
 */
export interface Operation {
  id: Operations;
  payload: unknown;
}

/**
 * Events from the server.
 */
export interface Event {
  type: string;
  trigger: string;
  payload: Record<string, unknown>;
}

/**
 * Parse a user's input into an operation, or `null` if invalid.
 */
export function parseOperation(payload: string): Operation | null {
  try {
    const trimmed = payload.trim();
    const id = Number(trimmed.substring(0, 2));
    if (isNaN(id) || id > OPERATIONS_LENGTH) {
      return null;
    }
    return {
      id,
      payload: JSON.parse(trimmed.substring(2, trimmed.length)),
    };
  } catch {
    return null;
  }
}

/**
 * Type for operation execution functions.
 */
export type OperationExecuteFn = (
  operation: Operation,
  socket: WebSocket,
  uuid: string,
  connectionMap: Record<string, UserData>,
) => Promise<void>;
