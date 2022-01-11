import { User, usernameRegex } from "../db.ts";
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
        Operations.AUTHENTICATE,
        false,
        `Username must match ${usernameRegex}`,
      ),
    );
    return;
  }
  if (password.length < 8 || password.length > 100) {
    socket.send(
      makeOperationResponse(
        Operations.AUTHENTICATE,
        false,
        "Password length must be between 8 and 100 (inclusive)",
      ),
    );
    return;
  }
  const dbUser = await User.where({ username }).first();
  if (dbUser === undefined) {
    socket.send(
      makeOperationResponse(
        Operations.AUTHENTICATE,
        false,
        "Incorrect login information",
      ),
    );
    return;
  }
  const dbUserValid = dbUser as User;
  if (!(await dbUserValid.validatePassword(password))) {
    socket.send(
      makeOperationResponse(
        Operations.AUTHENTICATE,
        false,
        "Incorrect login information",
      ),
    );
    return;
  }
  await updateMap(uuid, connectionMap, dbUserValid);
  socket.send(
    makeOperationResponse(
      Operations.AUTHENTICATE,
      true,
      `Authenticated. Welcome, ${username}`,
    ),
  );
}
