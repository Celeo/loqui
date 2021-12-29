import { bcrypt, DB } from "./deps.ts";

export interface User {
  id: number;
  username: string;
  passwordHash: string;
  joined: Date;
}

const SQL_CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    joined INTEGER NOT NULL
);
`;
const SQL_FETCH_USER =
  "SELECT id, username, passwordHash, joined FROM users WHERE username = ?1 LIMIT 1";
const SQL_STORE_USER =
  "INSERT INTO users (username, passwordHash, joined) VALUES (?1, ?2, ?3)";

/**
 * Create DB tables.
 */
export function createTables(): void {
  const db = new DB("data.db");
  db.query(SQL_CREATE_TABLES);
  db.close();
}

/**
 * Retrieve a user from the database.
 */
export function getUser(username: string): User | null {
  const db = new DB("data.db");
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
): Promise<void> {
  const db = new DB("data.db");
  const hashed = await bcrypt.hash(password, await bcrypt.genSalt(8));
  db.query(SQL_STORE_USER, [username, hashed, new Date().getTime()]);
  db.close();
}
