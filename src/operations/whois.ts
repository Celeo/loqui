import {
  makeOperationResponse,
  OperationExecuteFnData,
  Operations,
  SessionStatus,
} from "../util.ts";

// deno-lint-ignore require-await
export async function execute(
  { operation, socket, uuid, connectionMap }: OperationExecuteFnData,
): Promise<void> {
  if (connectionMap[uuid].sessionStatus !== SessionStatus.AUTHENTICATED) {
    socket.send(
      JSON.stringify(
        makeOperationResponse(Operations.WHOIS, false, "Must be authenticated"),
      ),
    );
    return;
  }
  const users = Object.keys(connectionMap)
    .filter((key) => key !== uuid)
    .map((key) => connectionMap[key].userInfo?.username)
    .filter((name) => name !== undefined)
    .map((name) => name as string);
  const payload = operation.payload;
  let usersFiltered = [];
  if (payload) {
    const filter = new RegExp(payload as string);
    usersFiltered = users.filter((name) => filter.test(name));
  } else {
    usersFiltered = users;
  }
  socket.send(
    JSON.stringify(
      makeOperationResponse(
        Operations.WHOIS,
        true,
        JSON.stringify(usersFiltered),
      ),
    ),
  );
}
