#!/bin/bash
deno run --allow-net=127.0.0.1,deno.land --allow-read=data.db,data.db-journal --allow-write=data.db,data.db-journal --unstable main.ts
