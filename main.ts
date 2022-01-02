import { main } from "./src/index.ts";

if (import.meta.main) {
  await main("127.0.0.1", 8080);
}
