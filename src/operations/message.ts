import {
  makeOperationResponse,
  OperationExecuteFnData,
  Operations,
  SessionStatus,
} from "../util.ts";

// deno-lint-ignore require-await
export async function execute(
  { operation, socket, uuid, connectionMap, channels }: OperationExecuteFnData,
): Promise<void> {
  const deny = (message: string) => {
    socket.send(
      JSON.stringify(makeOperationResponse(Operations.MESSAGE, false, message)),
    );
  };

  const connectionMapEntry = connectionMap[uuid];
  if (connectionMapEntry.sessionStatus === SessionStatus.ANONYMOUS) {
    deny("Must be authenticated");
    return;
  }
  const { target, message } = operation.payload as Record<string, string>;
  const matchingChannel = channels.find((channel) => channel.name === target);
  if (matchingChannel === null) {
    deny("No matching channel found");
    return;
  }
  if (
    !connectionMapEntry.channelMemberships.includes(target)
  ) {
    deny("Not a member of that channel");
    return;
  }
  socket.send(
    JSON.stringify(
      makeOperationResponse(Operations.MESSAGE, true, ""),
    ),
  );
  Object.values(connectionMap).forEach((entry) => {
    if (entry.channelMemberships.includes(target)) {
      entry.socket.send(JSON.stringify({
        type: "event",
        trigger: "chat",
        payload: {
          user: connectionMapEntry.userInfo?.username,
          channel: target,
          message,
        },
      }));
    }
  });
}
