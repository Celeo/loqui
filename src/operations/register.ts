import { createUser, User, usernameRegex } from "../db.ts";
import {
  makeOperationResponse,
  OperationExecuteFnData,
  Operations,
  updateMap,
} from "../util.ts";

export async function execute(
  { operation, socket, uuid, connectionMap }: OperationExecuteFnData,
): Promise<void> {
  const payload = operation.payload as Array<string>;
  const username = payload[0];
  const password = payload[1];
  if (!usernameRegex.test(username)) {
    socket.send(
      makeOperationResponse(
        Operations.REGISTER,
        false,
        `Username must match ${usernameRegex}`,
      ),
    );
    return;
  }
  if (password.length < 8 || password.length > 100) {
    socket.send(
      makeOperationResponse(
        Operations.REGISTER,
        false,
        "Password length must be between 8 and 100 (inclusive)",
      ),
    );
    return;
  }
  if ((await User.where({ username }).count()) > 0) {
    socket.send(
      makeOperationResponse(
        Operations.REGISTER,
        false,
        "A user with that name already exists",
      ),
    );
    return;
  }
  const userInfo = await createUser(username, password);
  await updateMap(uuid, connectionMap, userInfo);
  socket.send(
    makeOperationResponse(
      Operations.REGISTER,
      true,
      `Registered. Welcome, ${username}`,
    ),
  );
}
