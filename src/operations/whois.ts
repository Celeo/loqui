import { Operation, UserData } from "../util.ts";

export async function execute(
  operation: Operation,
  socket: WebSocket,
  uuid: string,
  connectionMap: Record<string, UserData>,
): Promise<void> {
  //  TODO
}
