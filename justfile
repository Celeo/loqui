default: run

setup:
    -mv data.db data.bak.db
    @echo "import { databaseSetup } from './src/db.ts'; await databaseSetup(); 'Done'" | deno --unstable

run:
    @deno run --allow-net=127.0.0.1,deno.land --allow-read=data.db,data.db-journal --allow-write=data.db,data.db-journal --unstable main.ts

test:
    @deno test --allow-all --unstable

client:
    @websocat ws://127.0.0.1:8080/ws
