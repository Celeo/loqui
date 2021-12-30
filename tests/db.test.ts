import { assert } from "https://deno.land/std@0.119.0/testing/asserts.ts";
import { bcrypt } from "../src/deps.ts";
import { validatePassword } from "../src/db.ts";

Deno.test("validatePassword", async () => {
  const passwordHash = await bcrypt.hash("password", await bcrypt.genSalt(4));
  assert(
    await validatePassword({
      id: 1,
      username: "",
      passwordHash,
      joined: new Date(),
    }, "password"),
  );
});
