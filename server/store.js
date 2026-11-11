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

  await ensureReviewUniqueIndex();
  await ensureReportUniqueIndex();
  initialized = true;
}

// Nome do índice único das avaliações (#40): as rotas tratam o 23505 dele como 409.
export const REVIEW_UNIQUE_INDEX = "savestate_profile_reviews_author_profile_uq";

// Uma avaliação por (autor, avaliado). O CREATE UNIQUE INDEX falharia se o banco já tivesse
// duplicatas (criadas pela corrida antiga), então, numa transação com trava exclusiva:
// 1) apaga as duplicatas mantendo a mais antiga (menor sequence = primeira gravada);
// 2) recalcula a reputação dos perfis afetados com a mesma regra de syncReputation
//    (média das notas com 2 casas); 3) cria o índice. Avaliações legadas sem author_id
//    (só author_handle) ficam fora do índice; a checagem da rota continua cobrindo-as.
async function ensureReviewUniqueIndex() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`LOCK TABLE ${recordsTable} IN SHARE ROW EXCLUSIVE MODE`);
    const { rows: removed } = await client.query(
      `DELETE FROM ${recordsTable} r
        USING ${recordsTable} keep
        WHERE r.collection = 'profile_reviews' AND keep.collection = 'profile_reviews'
          AND r.data->>'author_id' IS NOT NULL
          AND r.data->>'author_id' = keep.data->>'author_id'
          AND r.data->>'profile_id' = keep.data->>'profile_id'
          AND keep.sequence < r.sequence
        RETURNING r.data->>'profile_id' AS profile_id`,
    );
    const affected = [...new Set(removed.map((row) => row.profile_id))];
    if (affected.length) {
      await client.query(
        `UPDATE ${recordsTable} p
            SET data = p.data || jsonb_build_object('reputation', avgs.reputation)
           FROM (
             SELECT data->>'profile_id' AS profile_id,
                    round(avg(CASE WHEN data->>'rating' ~ '^[0-9]+(\\.[0-9]+)?$'
                                   THEN (data->>'rating')::numeric ELSE 0 END), 2)::float8 AS reputation
               FROM ${recordsTable}
              WHERE collection = 'profile_reviews' AND data->>'profile_id' = ANY($1::text[])
              GROUP BY data->>'profile_id'
           ) avgs
          WHERE p.collection = 'profiles' AND p.id = avgs.profile_id`,
        [affected],
      );
      console.log(`[store] ${removed.length} avaliação(ões) duplicada(s) removida(s); reputação recalculada.`);
    }
    await client.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS ${REVIEW_UNIQUE_INDEX}
         ON ${recordsTable} ((data->>'author_id'), (data->>'profile_id'))
         WHERE collection = 'profile_reviews' AND data->>'author_id' IS NOT NULL`,
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Nome do índice único parcial das denúncias (#41): POST /reports trata o 23505 dele como 409.
export const REPORT_UNIQUE_INDEX = "savestate_reports_reporter_product_open_uq";

// Uma só denúncia OPEN por (denunciante, anúncio). Denúncias resolvidas (DISMISSED,
// RESOLVED_REMOVED) saem do índice parcial, então quem teve a denúncia descartada pode
// denunciar de novo. Duplicatas antigas (da corrida) não são apagadas, porque o admin precisa
// do histórico: numa transação com trava exclusiva, a OPEN mais antiga (menor sequence) fica
// aberta e as demais viram DISMISSED com resolved_by "SISTEMA" e duplicate_of = id da mantida.
// Depois o índice é criado. Rodar de novo não muda nada (não sobram duplicatas OPEN).
// Exportada só para os testes; a API a chama via initialize().
export async function ensureReportUniqueIndex() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`LOCK TABLE ${recordsTable} IN SHARE ROW EXCLUSIVE MODE`);
    const { rowCount } = await client.query(
      `UPDATE ${recordsTable} r
          SET data = r.data || jsonb_build_object(
                'status', 'DISMISSED',
                'resolved_at', $1::text,
                'resolved_by', 'SISTEMA',
                'duplicate_of', d.keep_id)
         FROM (
           SELECT id,
                  row_number() OVER w AS rn,
                  first_value(id) OVER w AS keep_id
             FROM ${recordsTable}
            WHERE collection = 'reports' AND data->>'status' = 'OPEN'
              AND data->>'reporter_id' IS NOT NULL AND data->>'product_id' IS NOT NULL
           WINDOW w AS (PARTITION BY data->>'reporter_id', data->>'product_id' ORDER BY sequence)
         ) d
        WHERE r.collection = 'reports' AND r.id = d.id AND d.rn > 1`,
      [new Date().toISOString()],
    );
    if (rowCount) console.log(`[store] ${rowCount} denúncia(s) OPEN duplicada(s) marcada(s) como DISMISSED.`);
    await client.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS ${REPORT_UNIQUE_INDEX}
         ON ${recordsTable} ((data->>'reporter_id'), (data->>'product_id'))
         WHERE collection = 'reports' AND data->>'status' = 'OPEN'`,
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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

// Update condicional (#39): só grava se o registro ainda atender às condições, numa única
// instrução (sem janela entre ler e gravar). Devolve o registro atualizado, ou null se ele
// não existe mais ou não atende às condições. Campos e valores vão sempre como parâmetros $n.
// conditions: { campo: { in: [...] } | { notIn: [...] } | { eq: valor } }, comparados como texto
// (data->>'campo'); eq: null exige campo ausente/nulo; notIn aceita campo ausente.
export async function updateWhere(name, id, patch, conditions = {}) {
  assertCollection(name);
  const safePatch = Object.fromEntries(
    Object.entries(patch).filter(([key, value]) => key !== "id" && value !== undefined),
  );
  const params = [name, String(id), JSON.stringify(safePatch)];
  const param = (value) => {
    params.push(value);
    return `$${params.length}`;
  };
  const clauses = [];
  for (const [field, rule] of Object.entries(conditions)) {
    if (!rule || typeof rule !== "object") throw new Error(`Condição inválida para ${field}.`);
    const key = param(field);
    if (Array.isArray(rule.in)) {
      clauses.push(`(data->>(${key}::text)) = ANY(${param(rule.in.map(String))}::text[])`);
    } else if (Array.isArray(rule.notIn)) {
      clauses.push(`((data->>(${key}::text)) IS NULL OR NOT ((data->>(${key}::text)) = ANY(${param(rule.notIn.map(String))}::text[])))`);
    } else if ("eq" in rule) {
      clauses.push(
        rule.eq === null || rule.eq === undefined
          ? `(data->>(${key}::text)) IS NULL`
          : `(data->>(${key}::text)) = ${param(String(rule.eq))}`,
      );
    } else {
      throw new Error(`Condição inválida para ${field}.`);
    }
  }
  const where = clauses.length ? ` AND ${clauses.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `UPDATE ${recordsTable} SET data = data || $3::jsonb WHERE collection = $1 AND id = $2${where} RETURNING data`,
    params,
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
