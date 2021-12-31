import { storeNewUser, userExists, usernameRegex } from "../db.ts";
import {
  makeOperationResponse,
  Operation,
  Operations,
  updateMap,
  UserData,
} from "../util.ts";

export async function execute(
  operation: Operation,
  socket: WebSocket,
  uuid: string,
  connectionMap: Record<string, UserData>,
): Promise<void> {
  const payload = operation.payload as Array<string>;
  const username = payload[0];
  const password = payload[1];
  if (!usernameRegex.test(username)) {
    socket.send(
      JSON.stringify(
        makeOperationResponse(
          Operations.REGISTER,
          false,
          `Username must match ${usernameRegex}`,
        ),
      ),
    );
    return;
  }
  if (password.length < 8 || password.length > 100) {
    socket.send(
      JSON.stringify(
        makeOperationResponse(
          Operations.REGISTER,
          false,
          "Password length must be between 8 and 100 (inclusive)",
        ),
      ),
    );
    return;
  }
  if (userExists(username)) {
    socket.send(
      JSON.stringify(
        makeOperationResponse(
          Operations.REGISTER,
          false,
          "A user with that name already exists",
        ),
      ),
    );
    return;
  }
  const userInfo = await storeNewUser(username, password);
  updateMap(uuid, connectionMap, userInfo);
  socket.send(
    JSON.stringify(
      makeOperationResponse(
        Operations.REGISTER,
        true,
        `Registered. Welcome, ${username}`,
      ),
    ),
  );
}
