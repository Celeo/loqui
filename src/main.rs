#![deny(unsafe_code)]
#![deny(clippy::all)]

use anyhow::Result;
use args::Args;
use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    extract::Extension,
    response::IntoResponse,
    routing::get,
    AddExtensionLayer, Router,
};
use fern::{
    colors::{Color, ColoredLevelConfig},
    Dispatch,
};
use log::{debug, error, info, warn, LevelFilter};
use std::{io, net::SocketAddr, sync::Arc};

mod db;

struct AppState {
    connections: Vec<WebSocket>,
}

const WELCOME_TEXT: &str = r#"Welcome to the server."#;

/// Set up logging based on whether or not the user wants to see debug logging.
fn setup_logging(debug: bool) -> Result<()> {
    let base_config = if debug {
        Dispatch::new()
            .level(LevelFilter::Debug)
            .level_for("hyper::proto", LevelFilter::Info)
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
    let shared_app_state = Arc::new(AppState {
        connections: Vec::new(),
    });
    let app = Router::new()
        .route("/", get(ws_handler))
        .layer(AddExtensionLayer::new(shared_app_state));
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

// TODO https://github.com/tokio-rs/axum/blob/main/examples/chat/src/main.rs

async fn ws_handler(
    ws: WebSocketUpgrade,
    Extension(state): Extension<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: Arc<AppState>) {
    debug!("Client connected");
    if socket
        .send(Message::Text(String::from(WELCOME_TEXT)))
        .await
        .is_err()
    {
        debug!("Client disconnected");
        return;
    }
    loop {
        if let Some(msg) = socket.recv().await {
            if let Ok(msg) = msg {
                if let Message::Text(content) = msg {
                    debug!("Client says: {:?}", content);
                    // ...
                }
            } else {
                debug!("Client disconnected");
                return;
            }
        }
    }
}
