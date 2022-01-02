# loqui

[![CI](https://github.com/Celeo/loqui/workflows/CI/badge.svg?branch=master)](https://github.com/Celeo/loqui/actions?query=workflow%3ACI)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Runtime](https://img.shields.io/badge/runtime-Deno-orange)](https://deno.land/)

Simple JSON chat server over websockets.

Not intended for anything serious.

## Get and build

1. Install [Deno](https://deno.land/)
1. Clone the repo
1. Run the command under the "run" target in the Justfile (or install
   [just](https://github.com/casey/just) and run `just`)

### Permissions

As Deno uses permissions, the following permissions are required:

- Network
  - 127.0.0.1, to run the websocket server
- Reading files
  - data.db and data.db-journal to read the sqlite DB
- Writing files
  - data.db and data.db-journal to read the sqlite DB
- Unstable
  - To [run bcrypt](https://github.com/JamesBroadberry/deno-bcrypt/issues/18)

The justfile includes these as part of the commands.

## Use

Running the program will listen on http://127.0.0.1:8080 for HTTP connections, and will upgrade connections made to /ws to websocket. You can write a client or
use something like [websocat](https://github.com/vi/websocat) to communicate on the command line.

See the repository's wiki for more information.

## License

[MIT](LICENSE)

## Contributing

Please feel free to contribute. Please open an issue first (or comment on an existing one) so that I know that you want to add/change something.

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you shall be licensed as above, without any additional terms or conditions.
