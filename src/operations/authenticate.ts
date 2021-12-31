import { getUser, usernameRegex, validatePassword } from "../db.ts";
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
          Operations.AUTHENTICATE,
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
          Operations.AUTHENTICATE,
          false,
          "Password length must be between 8 and 100 (inclusive)",
        ),
      ),
    );
    return;
  }
  const dbUser = getUser(username);
  if (dbUser === null) {
    socket.send(
      JSON.stringify(
        makeOperationResponse(
          Operations.AUTHENTICATE,
          false,
          "Incorrect login information",
        ),
      ),
    );
    return;
  }
  if (!(await validatePassword(dbUser, password))) {
    socket.send(
      JSON.stringify(
        makeOperationResponse(
          Operations.AUTHENTICATE,
          false,
          "Incorrect login information",
        ),
      ),
    );
    return;
  }
  updateMap(uuid, connectionMap, dbUser);
  socket.send(
    JSON.stringify(
      makeOperationResponse(
        Operations.AUTHENTICATE,
        true,
        `Authenticated. Welcome, ${username}`,
      ),
    ),
  );
}
