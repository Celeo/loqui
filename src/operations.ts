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
}

const OPERATIONS_LENGTH =
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
