import { assertEquals } from "https://deno.land/std@0.119.0/testing/asserts.ts";
import { parseOperation } from "../src/operations.ts";

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
