import { assertEquals } from "./test_deps.ts";
import { makeOperationResponse, parseOperation } from "../src/util.ts";

Deno.test("parseOperation fails for empty input", () => {
  assertEquals(parseOperation(""), null);
});

Deno.test("parseOperation fails for missing number", () => {
  assertEquals(parseOperation("foobar"), null);
});

Deno.test("parseOperation fails for invalid number", () => {
  assertEquals(parseOperation("99false"), null);
});

Deno.test("parseOperation fails for invalid JSON payload", () => {
  assertEquals(parseOperation("99abc"), null);
});

Deno.test("parseOperation works for valid input", () => {
  assertEquals(parseOperation(`01["foo","bar"]`), {
    id: 1,
    payload: [
      "foo",
      "bar",
    ],
  });
});

Deno.test("makeOperationResponse", () => {
  assertEquals(
    makeOperationResponse(1, true, "foobar"),
    JSON.stringify({
      type: "event",
      trigger: "operation",
      payload: {
        succeeded: true,
        operation_id: 1,
        message: "foobar",
      },
    }),
  );
});
