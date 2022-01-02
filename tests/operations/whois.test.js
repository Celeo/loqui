import { assertEquals, sinon } from "../test_deps.ts";
import { execute } from "../../src/operations/whois.ts";

Deno.test("operation - whois - cannot be anon", async () => {
  const connectionMap = {
    abc: {
      sessionStatus: 0,
    },
  };
  const fake = sinon.fake();
  const socket = { send: fake };
  await execute({
    socket,
    uuid: "abc",
    connectionMap,
    operation: { payload: "" },
  });
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
    }),
  );
});

Deno.test("operation - whois - no filter - no others - works", async () => {
  const connectionMap = {
    abc: {
      sessionStatus: 1,
    },
  };
  const fake = sinon.fake();
  const socket = { send: fake };
  await execute({
    socket,
    uuid: "abc",
    connectionMap,
    operation: { payload: "" },
  });
  assertEquals(fake.callCount, 1);
  assertEquals(
    fake.getCall(0).firstArg,
    JSON.stringify({
      type: "event",
      trigger: "operation",
      payload: {
        succeeded: true,
        operation_id: 4,
        message: "[]",
      },
    }),
  );
});

Deno.test("operation - whois - no filter - others - works", async () => {
  const connectionMap = {
    abc: {
      sessionStatus: 1,
    },
    def: {
      sessionStatus: 1,
      userInfo: {
        username: "john",
      },
    },
  };
  const fake = sinon.fake();
  const socket = { send: fake };
  await execute({
    socket,
    uuid: "abc",
    connectionMap,
    operation: { payload: "" },
  });
  assertEquals(fake.callCount, 1);
  assertEquals(
    fake.getCall(0).firstArg,
    JSON.stringify({
      type: "event",
      trigger: "operation",
      payload: {
        succeeded: true,
        operation_id: 4,
        message: '["john"]',
      },
    }),
  );
});

Deno.test("operation - whois - filter - works", async () => {
  const connectionMap = {
    abc: {
      sessionStatus: 1,
    },
    def: {
      sessionStatus: 1,
      userInfo: {
        username: "john",
      },
    },
  };
  const fake = sinon.fake();
  const socket = { send: fake };
  await execute({
    socket,
    uuid: "abc",
    connectionMap,
    operation: { payload: "^a" },
  });
  assertEquals(fake.callCount, 1);
  assertEquals(
    fake.getCall(0).firstArg,
    JSON.stringify({
      type: "event",
      trigger: "operation",
      payload: {
        succeeded: true,
        operation_id: 4,
        message: "[]",
      },
    }),
  );
});
