import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Directorio para la base de datos
const DATA_DIR = resolve('.data');
const DB_FILE = resolve(DATA_DIR, 'mp.db');

// Crear directorio si no existe
if (!existsSync(DATA_DIR)) {
	mkdirSync(DATA_DIR, { recursive: true });
}

// Inicializar SQLite
export const db = new Database(DB_FILE);

// Configurar WAL mode para mejor performance
db.pragma('journal_mode = WAL');

// Crear tabla de sellers
db.exec(`
CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT,
  scope TEXT,
  expires_at INTEGER,
  mp_user_id TEXT NOT NULL,
  nickname TEXT,
  email TEXT,
  updated_at INTEGER NOT NULL
);
`);

console.log('✅ SQLite database initialized at:', DB_FILE);
