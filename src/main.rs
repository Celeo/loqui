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
use std::{
    collections::HashSet,
    io,
    net::SocketAddr,
    sync::{Arc, Mutex},
};
use tokio::sync::broadcast;

mod db;

struct AppState {
    user_set: Mutex<HashSet<String>>,
    tx: broadcast::Sender<String>,
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

    debug!("Setting up state");
    let user_set = Mutex::new(HashSet::new());
    let (tx, _rx) = broadcast::channel(100);
    let app_state = Arc::new(AppState { user_set, tx });

    debug!("Setting up server");
    let app = Router::new()
        .route("/", get(websocket_handler))
        .layer(AddExtensionLayer::new(app_state));
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

async fn websocket_handler(
    ws: WebSocketUpgrade,
    Extension(state): Extension<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| websocket(socket, state))
}

async fn websocket(mut socket: WebSocket, _state: Arc<AppState>) {
    debug!("Client connected");
    if socket
        .send(Message::Text(String::from(WELCOME_TEXT)))
        .await
        .is_err()
    {
        debug!("Client disconnected");
        return;
    }
    debug!("Interaction loop with client");
    // https://github.com/tokio-rs/axum/blob/main/examples/chat/src/main.rs#L59
}
