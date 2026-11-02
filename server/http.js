export class HttpError extends Error {
  constructor(status, message, field) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

export const fail = (status, message, field) => {
  throw new HttpError(status, message, field);
};

// Valida o corpo com Zod; o primeiro erro vira 400 com a mensagem e o campo.
export function parse(schema, body) {
  const result = schema.safeParse(body ?? {});
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  fail(400, issue?.message || "Dados inválidos.", issue?.path?.join("."));
}

export const sameId = (a, b) => a != null && b != null && String(a) === String(b);

export const now = () => new Date().toISOString();

// Perfil devolvido ao próprio usuário: tudo, menos o hash da senha.
export function privateProfile(profile) {
  if (!profile) return null;
  const { password_hash, ...safe } = profile; // eslint-disable-line no-unused-vars
  return safe;
}

// Perfil público: sem e-mail, hash, endereço e status da conta.
export function publicProfile(profile) {
  if (!profile) return null;
  const { password_hash, email, shipping_address, account_status, ...safe } = profile; // eslint-disable-line no-unused-vars
  return safe;
}

// Aplica ?campo=valor, _sort, _order e _limit (mesma sintaxe usada pelo json-server).
export function applyQuery(rows, query = {}) {
  let result = rows;
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith("_")) continue;
    result = result.filter((row) => String(row[key]) === String(value));
  }
  if (query._sort) {
    const dir = String(query._order).toLowerCase() === "desc" ? -1 : 1;
    const key = query._sort;
    result = [...result].sort((a, b) => {
      if (a[key] === b[key]) return 0;
      if (a[key] === undefined) return 1;
      if (b[key] === undefined) return -1;
      return a[key] > b[key] ? dir : -dir;
    });
  }
  if (query._limit) result = result.slice(0, Number(query._limit));
  return result;
}
