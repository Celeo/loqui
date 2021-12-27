#![allow(unused)] // TODO remove

use anyhow::Result;
use bcrypt::{hash, verify, DEFAULT_COST};
use rusqlite::{params, Connection, Result as DatabaseResult, Row};
use uuid::Uuid;

#[derive(Debug)]
pub struct User {
    pub id: String,
    pub username: String,
    pub password_hash: String,
    pub joined: chrono::DateTime<chrono::Utc>,
    pub banned: bool,
}

impl User {
    pub fn from_db(row: &Row) -> DatabaseResult<Self> {
        Ok(Self {
            id: row.get(0)?,
            username: row.get(1)?,
            password_hash: row.get(2)?,
            joined: row.get(3)?,
            banned: row.get(4)?,
        })
    }
}

const SQL_CREATE_TABLES: &str = r#"
BEGIN;
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    joined TEXT NOT NULL,
    banned INTEGER
);
COMMIT;
"#;
const SQL_FETCH_USER: &str =
    "SELECT id, username, password, joined, banned FROM users WHERE username = ?1 LIMIT 1";
const SQL_STORE_USER: &str = "INSERT INTO USERS VALUES (?1, ?2, ?3, ?4, ?5)";

pub fn connect() -> Result<Connection> {
    Ok(Connection::open("data.db")?)
}

pub fn create_tables(connection: &Connection) -> Result<()> {
    connection.execute_batch(SQL_CREATE_TABLES)?;
    Ok(())
}

pub fn verify_user_pass(connection: &Connection, username: &str, password: &str) -> Result<bool> {
    let mut statement = connection.prepare(SQL_FETCH_USER)?;
    let iter = statement.query_map(params![username], User::from_db)?;
    for user in iter.into_iter().flatten() {
        if verify(password, &user.password_hash)? {
            return Ok(true);
        };
    }
    Ok(false)
}

pub fn store_new_user(connection: &Connection, username: &str, password: &str) -> Result<()> {
    connection.execute(
        SQL_STORE_USER,
        params![
            Uuid::new_v4(),
            username,
            hash(password, DEFAULT_COST)?,
            chrono::Utc::now(),
            false
        ],
    )?;
    Ok(())
}
