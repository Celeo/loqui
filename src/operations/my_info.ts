import {
  makeOperationResponse,
  Operation,
  Operations,
  SessionStatus,
  UserData,
} from "../util.ts";

// deno-lint-ignore require-await
export async function execute(
  _: Operation,
  socket: WebSocket,
  uuid: string,
  connectionMap: Record<string, UserData>,
): Promise<void> {
  const connectionMapEntry = connectionMap[uuid];
  if (connectionMapEntry.sessionStatus !== SessionStatus.AUTHENTICATED) {
    socket.send(
      JSON.stringify(
        makeOperationResponse(Operations.WHOIS, false, "Must be authenticated"),
      ),
    );
    return;
  }
  socket.send(
    JSON.stringify(
      makeOperationResponse(
        Operations.WHOIS,
        true,
        JSON.stringify(connectionMapEntry),
      ),
    ),
  );
}
