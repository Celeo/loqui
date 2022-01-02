import { Channel, ChannelMembership, User } from "./db.ts";

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
export async function updateMap(
  uuid: string,
  connectionMap: Record<string, UserData>,
  userInfo: User,
): Promise<void> {
  const res = await ChannelMembership.where("userId", userInfo.id as number)
    .leftJoin(
      Channel,
      Channel.field("id"),
      ChannelMembership.field("channelId"),
    ).get() as Array<Record<string, unknown>>;
  connectionMap[uuid] = {
    ...connectionMap[uuid],
    sessionStatus: SessionStatus.AUTHENTICATED,
    userInfo,
    channelMemberships: res.map((membership) => membership["name"] as string),
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
  AUTHENTICATE = 2,
  MY_INFO = 3,
  WHOIS = 4,
  CHANNELS = 10,
  JOIN = 11,
  LEAVE = 12,
  MESSAGE = 13,
  CHANNEL_CREATE = 14,
  CHANNEL_INVITE = 15,
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
    if (isNaN(id) || !(id in Operations)) {
      return null;
    }
    const rest = trimmed.substring(2, trimmed.length);
    if (rest.length > 0) {
      return {
        id,
        payload: JSON.parse(rest),
      };
    }
    return {
      id,
      payload: null,
    };
  } catch {
    return null;
  }
}

/**
 * Operation execution function parameter type.
 */
export interface OperationExecuteFnData {
  operation: Operation;
  socket: WebSocket;
  uuid: string;
  connectionMap: Record<string, UserData>;
  channels: Array<Channel>;
}

/**
 * Type for operation execution functions.
 */
export type OperationExecuteFn = (
  data: OperationExecuteFnData,
) => Promise<void>;
