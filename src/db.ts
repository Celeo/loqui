// TODO may want to switch to https://github.com/eveningkid/denodb

import { bcrypt, DB } from "./deps.ts";

/**
 * User from DB.
 */
export interface User {
  id: number;
  username: string;
  passwordHash: string;
  joined: Date;
}

/**
 * Channel from DB.
 */
export interface Channel {
  id: number;
  name: string;
  requiresInvite: boolean;
  creatorId: number | null;
}

const SQL_CREATE_TABLE_USERS = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    joined INTEGER NOT NULL,
    UNIQUE(username)
)`;
const SQL_CREATE_TABLE_CHANNELS = `
CREATE TABLE IF NOT EXISTS channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  requiresInvite BOOLEAN NOT NULL DEFAULT 0,
  creatorId INTEGER,
  FOREIGN KEY(creatorId) REFERENCES users(id),
  UNIQUE(name)
)`;
const SQL_CREATE_TABLE_CHANNEL_MEMBERSHIPS = `
CREATE TABLE IF NOT EXISTS channel_memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  channelId INTEGER NOT NULL,
  FOREIGN KEY(userId) REFERENCES users(id)
  FOREIGN KEY(channelId) REFERENCES channels(id)
)`;
const SQL_INSERT_GENERAL_CHANNEL =
  "INSERT OR IGNORE INTO channels (name, requiresInvite) VALUES ('general', 0)";
const SQL_FETCH_USER = "SELECT * FROM users WHERE username = ?1 LIMIT 1";
const SQL_STORE_USER =
  "INSERT INTO users (username, passwordHash, joined) VALUES (?1, ?2, ?3)";
const SQL_ADD_GENERAL_CHANNEL_MEMBERSHIP =
  "INSERT INTO channel_memberships (userId, channelId) VALUES (?1, 1)";
const SQL_FETCH_ALL_CHANNELS = "SELECT * FROM channels";
const SQL_FETCH_USER_CHANNEL_MEMBERSHIPS = `SELECT channels.id, channels.name
FROM channel_memberships LEFT JOIN channels ON channel_memberships.channelId = channels.id
WHERE userId = ?1`;

/**
 * Username requirements.
 */
export const usernameRegex = /^[a-z0-9][a-z0-9_-]{2,14}$/;

/**
 * Create DB tables.
 */
export function createTables(): void {
  const db = new DB("data.db", { mode: "create" });
  db.query(SQL_CREATE_TABLE_USERS);
  db.query(SQL_CREATE_TABLE_CHANNELS);
  db.query(SQL_CREATE_TABLE_CHANNEL_MEMBERSHIPS);
  db.query(SQL_INSERT_GENERAL_CHANNEL);
  db.close();
}

/**
 * Retrieve a user from the database.
 */
export function getUser(username: string): User | null {
  const db = new DB("data.db", { mode: "read" });
  for (const row of db.query(SQL_FETCH_USER, [username])) {
    db.close();
    return {
      id: row[0] as number,
      username: row[1] as string,
      passwordHash: row[2] as string,
      joined: new Date(row[3] as number),
    };
  }
  db.close();
  return null;
}

/**
 * Check if the user exists in the database by name.
 */
export function userExists(username: string): boolean {
  return getUser(username) !== null;
}

/**
 * Return true if the supplied password matches what's in the DB entry.
 */
export async function validatePassword(
  user: User,
  password: string,
): Promise<boolean> {
  return await bcrypt.compare(password, user.passwordHash);
}

/**
 * Store a new user in the database.
 */
export async function storeNewUser(
  username: string,
  password: string,
): Promise<User> {
  const db = new DB("data.db", { mode: "write" });
  const hashed = await bcrypt.hash(password, await bcrypt.genSalt(8));
  db.query(SQL_STORE_USER, [username, hashed, new Date().getTime()]);
  const createdUser = getUser(username) as User;
  db.query(SQL_ADD_GENERAL_CHANNEL_MEMBERSHIP, [createdUser.id]);
  db.close();
  return createdUser;
}

export function getAllChannels(): Array<Channel> {
  const db = new DB("data.db", { mode: "read" });
  const ret: Array<Channel> = db
    .query(SQL_FETCH_ALL_CHANNELS)
    .map((row) => ({
      id: row[0] as number,
      name: row[1] as string,
      requiresInvite: row[2] === 1,
      creatorId: row[3] === null ? null : row[3] as number,
    }));
  db.close();
  return ret;
}

/**
 * Retrieve the channels the user is a member of.
 */
export function getUserChannelMemberships(
  userId: number,
): Array<[number, string]> {
  const db = new DB("data.db", { mode: "read" });
  const ret: Array<[number, string]> = db
    .query(SQL_FETCH_USER_CHANNEL_MEMBERSHIPS, [userId])
    .map((row) => [row[0] as number, row[1] as string]);
  db.close();
  return ret;
}
