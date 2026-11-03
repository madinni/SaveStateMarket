// Camada de dados. Hoje grava no db.json; para trocar de banco (ex.: Supabase),
// basta reescrever este arquivo mantendo as mesmas funções.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DB_PATH = path.resolve(process.env.DB_PATH || "db.json");

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

let data = null;

function load() {
  if (data) return data;
  const raw = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH, "utf8") : "{}";
  data = JSON.parse(raw || "{}");
  for (const name of COLLECTIONS) if (!Array.isArray(data[name])) data[name] = [];
  return data;
}

// Gravação atômica: escreve num arquivo temporário e troca pelo definitivo com rename,
// assim uma queda no meio da escrita não deixa o db.json pela metade.
export function save() {
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(load(), null, 2) + "\n");
  fs.renameSync(tmp, DB_PATH);
}

const table = (name) => {
  const db = load();
  if (!Array.isArray(db[name])) db[name] = [];
  return db[name];
};

const sameId = (a, b) => String(a) === String(b);

export const newId = (prefix = "") =>
  `${prefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

export const list = (name) => [...table(name)];

export const find = (name, predicate) => table(name).filter(predicate);

export const get = (name, id) => table(name).find((row) => sameId(row.id, id)) || null;

export function insert(name, row) {
  const record = { ...row, id: row.id ?? newId() };
  table(name).push(record);
  save();
  return record;
}

export function update(name, id, patch) {
  const row = get(name, id);
  if (!row) return null;
  for (const [key, value] of Object.entries(patch)) {
    if (key !== "id" && value !== undefined) row[key] = value;
  }
  save();
  return row;
}

export function remove(name, id) {
  const rows = table(name);
  const index = rows.findIndex((row) => sameId(row.id, id));
  if (index === -1) return false;
  rows.splice(index, 1);
  save();
  return true;
}

export function removeWhere(name, predicate) {
  const db = load();
  const before = table(name).length;
  db[name] = table(name).filter((row) => !predicate(row));
  const removed = before - db[name].length;
  if (removed) save();
  return removed;
}

// Usado só pelos testes, para começar de um banco limpo.
export function reset(initial = {}) {
  data = JSON.parse(JSON.stringify(initial));
  for (const name of COLLECTIONS) if (!Array.isArray(data[name])) data[name] = [];
  save();
}
