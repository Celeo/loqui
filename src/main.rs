#![deny(unsafe_code)]
#![deny(clippy::all)]

use anyhow::Result;
use args::Args;
use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
    routing::get,
    Router,
};
use fern::{
    colors::{Color, ColoredLevelConfig},
    Dispatch,
};
use log::{debug, error, info, warn, LevelFilter};
use std::{io, net::SocketAddr};

mod db;

/// Set up logging based on whether or not the user wants to see debug logging.
fn setup_logging(debug: bool) -> Result<()> {
    let base_config = if debug {
        Dispatch::new().level(LevelFilter::Debug)
    } else {
        Dispatch::new().level(LevelFilter::Info)
    };
    let colors = ColoredLevelConfig::new()
        .info(Color::Blue)
        .debug(Color::Green);
    let stdout_config = Dispatch::new()
        .format(move |out, message, record| {
            out.finish(format_args!(
                "{:<5} {}",
                colors.color(record.level()),
                message
            ))
        })
        .chain(io::stdout());
    base_config.chain(stdout_config).apply()?;
    Ok(())
}

#[tokio::main]
async fn main() {
    let mut args = Args::new("loqui", "TBD");
    args.flag("h", "help", "Print the usage menu");
    args.flag("d", "debug", "Enable debug logging");
    args.parse_from_cli()
        .expect("Could not parse command line options");
    if args.value_of("help").unwrap() {
        println!("{}", args.full_usage());
        return;
    }
    setup_logging(args.value_of("debug").unwrap()).expect("Could not set up logging");

    debug!("Setting up db");
    db::create_tables(&db::connect().unwrap()).unwrap();

    debug!("Setting up web server");
    let app = Router::new().route("/", get(ws_handler));
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    info!("Listening on {}", addr);
    if let Err(e) = axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
    {
        error!("Could not start listener: {}", e);
    };
    warn!("Socket server ended");
}

async fn ws_handler(ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
    if let Some(msg) = socket.recv().await {
        if let Ok(msg) = msg {
            debug!("Client says: {:?}", msg);
        } else {
            debug!("Client disconnected");
            return;
        }
    }
    loop {
        if socket
            .send(Message::Text(String::from("Hi!")))
            .await
            .is_err()
        {
            debug!("Client disconnected");
            return;
        }
        tokio::time::sleep(std::time::Duration::from_secs(3)).await;
    }
}
