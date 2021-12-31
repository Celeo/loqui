import { sinon, assertEquals } from "../test_deps.ts";
import { execute } from "../../src/operations/my_info.ts";

Deno.test("operation - my_info - cannot be anon", async () => {
  const connectionMap = {
    abc: {
      sessionStatus: 0,
    },
  };
  const fake = sinon.fake();
  const socket = { send: fake };
  await execute({ socket, uuid: "abc", connectionMap });
  assertEquals(fake.callCount, 1);
  assertEquals(
    fake.getCall(0).firstArg,
    JSON.stringify({
      type: "event",
      trigger: "operation",
      payload: {
        succeeded: false,
        operation_id: 4,
        message: "Must be authenticated",
      },
    })
  );
});

Deno.test("operation - my_info - works", async () => {
  const connectionMap = {
    abc: {
      sessionStatus: 1,
      foo: "bar",
    },
  };
  const fake = sinon.fake();
  const socket = { send: fake };
  await execute({ socket, uuid: "abc", connectionMap });
  assertEquals(fake.callCount, 1);
  assertEquals(
    fake.getCall(0).firstArg,
    JSON.stringify({
      type: "event",
      trigger: "operation",
      payload: {
        succeeded: true,
        operation_id: 4,
        message: '{"sessionStatus":1,"foo":"bar"}',
      },
    })
  );
});
