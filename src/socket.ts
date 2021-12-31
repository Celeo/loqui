import { makeOperationResponse, parseOperation, UserData } from "./util.ts";
import { OPERATIONS_MAP } from "./operations/index.ts";

/**
 * Handler for socket messages.
 *
 * Takes the socket, user uuid, and connectionMap, and returns
 * an async function to handle messages from the client.
 */
export function socketOnMessage(
  socket: WebSocket,
  uuid: string,
  connectionMap: Record<string, UserData>,
): (event: MessageEvent<string>) => Promise<void> {
  return async function (event: MessageEvent<string>) {
    const operation = parseOperation(event.data);
    if (operation === null) {
      socket.send(
        JSON.stringify(
          makeOperationResponse(-1, false, "No command recognized"),
        ),
      );
      return;
    }
    try {
      await OPERATIONS_MAP[operation.id](
        operation,
        socket,
        uuid,
        connectionMap,
      );
    } catch (e) {
      const username = connectionMap[uuid].userInfo?.username || "*unknown*";
      console.log(
        `Error processing operation ${operation.id} from ${username}: ${e}`,
      );
    }
  };
}
