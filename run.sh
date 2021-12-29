#!/bin/bash
deno run --allow-net --allow-read=data.db,data.db-journal --allow-write=data.db,data.db-journal --unstable main.ts
