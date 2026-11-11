import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const DB_PATH = path.resolve(process.env.DB_PATH || "db.json");
const DB_SCHEMA = process.env.DB_SCHEMA || "public";
const schemaName = `"${DB_SCHEMA.replaceAll('"', '""')}"`;
const recordsTable = `${schemaName}.savestate_records`;
const metadataTable = `${schemaName}.savestate_metadata`;

const COLLECTIONS = [
  "profiles",
  "products",
  "games",
  "price_references",
  "profile_reviews",
  "offers",
  "messages",
  "tickets",
  "notifications",
  "price_alerts",
  "orders",
  "refunds",
  "reports",
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let initialized = false;

const assertCollection = (name) => {
  if (!COLLECTIONS.includes(name)) throw new Error(`Coleção desconhecida: ${name}`);
};

export const newId = (prefix = "") =>
  `${prefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

export async function initialize() {
  if (initialized) return;
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não definido. Configure a conexão com PostgreSQL no ambiente.");
  }
  if (!/^[a-z_][a-z0-9_]*$/i.test(DB_SCHEMA)) {
    throw new Error("DB_SCHEMA deve conter apenas letras, números e sublinhados.");
  }

  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${recordsTable} (
      sequence bigserial NOT NULL,
      collection text NOT NULL,
      id text NOT NULL,
      data jsonb NOT NULL,
      PRIMARY KEY (collection, id)
    );
    ALTER TABLE ${recordsTable} ADD COLUMN IF NOT EXISTS sequence bigserial;
    CREATE TABLE IF NOT EXISTS ${metadataTable} (
      key text PRIMARY KEY,
      value text NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS savestate_profiles_email_uq
      ON ${recordsTable} (lower(data->>'email'))
      WHERE collection = 'profiles' AND data->>'email' IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS savestate_profiles_handle_uq
      ON ${recordsTable} (lower(data->>'handle'))
      WHERE collection = 'profiles' AND data->>'handle' IS NOT NULL
  `);

  const { rows } = await pool.query(
    `SELECT value FROM ${metadataTable} WHERE key = $1`,
    ["legacy_json_imported"],
  );
  if (!rows.length) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const imported = await fs.readFile(DB_PATH, "utf8").then((text) => JSON.parse(text)).catch((error) => {
        if (error.code === "ENOENT") return {};
        throw error;
      });
      if (!imported || typeof imported !== "object" || Array.isArray(imported)) {
        throw new Error("O JSON legado deve conter um objeto de coleções.");
      }
      for (const collection of COLLECTIONS) {
        const records = Array.isArray(imported[collection]) ? imported[collection] : [];
        for (const record of records) {
          if (!record || typeof record !== "object" || Array.isArray(record)) continue;
          const importedRecord = { ...record, id: record.id ?? newId() };
          await client.query(
            `INSERT INTO ${recordsTable} (collection, id, data) VALUES ($1, $2, $3::jsonb) ON CONFLICT (collection, id) DO NOTHING`,
            [collection, String(importedRecord.id), JSON.stringify(importedRecord)],
          );
        }
      }
      await client.query(
        `INSERT INTO ${metadataTable} (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        ["legacy_json_imported", new Date().toISOString()],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  initialized = true;
}

export async function list(name) {
  assertCollection(name);
  const { rows } = await pool.query(
    `SELECT data FROM ${recordsTable} WHERE collection = $1 ORDER BY sequence`,
    [name],
  );
  return rows.map(({ data }) => data);
}

export async function find(name, predicate) {
  return (await list(name)).filter(predicate);
}

export async function get(name, id) {
  assertCollection(name);
  const { rows } = await pool.query(
    `SELECT data FROM ${recordsTable} WHERE collection = $1 AND id = $2`,
    [name, String(id)],
  );
  return rows[0]?.data ?? null;
}

export async function insert(name, row) {
  assertCollection(name);
  const record = { ...row, id: row.id ?? newId() };
  await pool.query(
    `INSERT INTO ${recordsTable} (collection, id, data) VALUES ($1, $2, $3::jsonb)`,
    [name, String(record.id), JSON.stringify(record)],
  );
  return record;
}

export async function update(name, id, patch) {
  assertCollection(name);
  const safePatch = Object.fromEntries(
    Object.entries(patch).filter(([key, value]) => key !== "id" && value !== undefined),
  );
  const { rows } = await pool.query(
    `UPDATE ${recordsTable} SET data = data || $3::jsonb WHERE collection = $1 AND id = $2 RETURNING data`,
    [name, String(id), JSON.stringify(safePatch)],
  );
  return rows[0]?.data ?? null;
}

export async function remove(name, id) {
  assertCollection(name);
  const { rowCount } = await pool.query(
    `DELETE FROM ${recordsTable} WHERE collection = $1 AND id = $2`,
    [name, String(id)],
  );
  return rowCount > 0;
}

export async function removeWhere(name, predicate) {
  const rows = await find(name, predicate);
  if (!rows.length) return 0;
  const ids = rows.map((row) => String(row.id));
  const { rowCount } = await pool.query(
    `DELETE FROM ${recordsTable} WHERE collection = $1 AND id = ANY($2::text[])`,
    [name, ids],
  );
  return rowCount;
}

export async function reset(initial = {}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM ${recordsTable}`);
    for (const name of COLLECTIONS) {
      const records = Array.isArray(initial[name]) ? initial[name] : [];
      for (const row of records) {
        const record = { ...row, id: row.id ?? newId() };
        await client.query(
          `INSERT INTO ${recordsTable} (collection, id, data) VALUES ($1, $2, $3::jsonb)`,
          [name, String(record.id), JSON.stringify(record)],
        );
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function close({ dropSchema = false } = {}) {
  if (dropSchema) {
    if (process.env.NODE_ENV !== "test") throw new Error("A remoção do schema só é permitida em testes.");
    if (initialized) await pool.query(`DROP SCHEMA ${schemaName} CASCADE`);
  }
  await pool.end();
}
