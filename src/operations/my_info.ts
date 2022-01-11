import {
  makeOperationResponse,
  OperationExecuteFnData,
  Operations,
  SessionStatus,
} from "../util.ts";

// deno-lint-ignore require-await
export async function execute(
  { socket, uuid, connectionMap }: OperationExecuteFnData,
): Promise<void> {
  const connectionMapEntry = connectionMap[uuid];
  if (connectionMapEntry.sessionStatus !== SessionStatus.AUTHENTICATED) {
    socket.send(
      makeOperationResponse(Operations.WHOIS, false, "Must be authenticated"),
    );
    return;
  }
  socket.send(
    makeOperationResponse(
      Operations.WHOIS,
      true,
      JSON.stringify(connectionMapEntry),
    ),
  );
}
