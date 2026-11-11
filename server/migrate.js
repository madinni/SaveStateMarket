// Ajusta os registros (incluindo os importados do antigo db.json) na primeira execução:
// - senhas em texto puro viram hash bcrypt (a aula pede senhaHash, nunca a senha);
// - perfis sem account_status ficam "active";
// - alertas antigos (por anúncio) passam a ser alertas por título;
// - reembolsos antigos "paid" (que já desbloqueavam a conta) passam a "released";
// - garante a conta inicial do administrador (garantirAdmin): login "admin" / senha "admin" (demo).
// Tudo é idempotente: rodar de novo não altera nada.
import bcrypt from "bcryptjs";
import * as store from "./store.js";
import { now } from "./http.js";

const ADMIN_EMAIL = "admin";
// Credencial de DEMONSTRAÇÃO (login "admin" / senha "admin"), fraca e pública, só para a
// apresentação acadêmica. Decisão pendente com o grupo; a senha pode ser trocada depois em
// PATCH /usuarios/me/senha.
const ADMIN_SENHA_DEMO = "admin";

// Cria o perfil do administrador (senha "admin") se ainda não houver nenhum com role "admin".
// Devolve true quando criou/ajustou algo. O cliente nunca define role (só este código).
// Se já existe admin, não mexe em nada (nem na senha).
export async function garantirAdmin() {
  const profiles = await store.list("profiles");
  if (profiles.some((p) => p.role === "admin")) return false;

  const password_hash = await bcrypt.hash(ADMIN_SENHA_DEMO, 10);
  // O e-mail "admin" não passa no cadastro (exige formato de e-mail); se existir, é reservado.
  const reservado = profiles.find((p) => String(p.email).toLowerCase() === ADMIN_EMAIL);
  if (reservado) {
    await store.update("profiles", reservado.id, { role: "admin", account_status: "active", password_hash });
    return true;
  }

  const handleEmUso = (h) => profiles.some((p) => String(p.handle).toLowerCase() === h.toLowerCase());
  const handle = handleEmUso("@admin") ? `@admin_${store.newId().slice(0, 4)}` : "@admin";
  await store.insert("profiles", {
    id: crypto.randomUUID(),
    handle,
    email: ADMIN_EMAIL,
    password_hash,
    shipping_address: null,
    role: "admin",
    account_status: "active",
    reputation: 5,
    total_transactions: 0,
    success_rate: 100,
    vault_balance: 0,
    clearance_level: "LEVEL_3",
    created_at: now(),
  });
  return true;
}

const isBcrypt = (value) => /^\$2[aby]\$\d{2}\$/.test(String(value || ""));

export async function migrate() {
  let changed = 0;

  for (const profile of await store.list("profiles")) {
    const patch = {};
    if (profile.password_hash && !isBcrypt(profile.password_hash)) {
      patch.password_hash = await bcrypt.hash(String(profile.password_hash), 10);
    }
    if (!profile.account_status) patch.account_status = "active";
    if (Object.keys(patch).length) {
      await store.update("profiles", profile.id, patch);
      changed += 1;
    }
  }

  for (const alert of await store.list("price_alerts")) {
    if (alert.title) continue;
    const product = alert.product_id ? await store.get("products", alert.product_id) : null;
    await store.update("price_alerts", alert.id, {
      title: alert.product_title || product?.title || "Título desconhecido",
      platform: product?.platform ?? null,
    });
    changed += 1;
  }

  // Antes, "paid" já desbloqueava a conta. No fluxo novo (pending → paid → released) o
  // vendedor com reembolso "paid" continua refund_pending até o admin liberar. Por isso só
  // migra "paid" de vendedor que NÃO está bloqueado: é o legado, e rodar de novo não muda nada.
  for (const refund of await store.list("refunds")) {
    if (refund.status !== "paid") continue;
    const seller = await store.get("profiles", refund.seller_id);
    if (seller?.account_status === "refund_pending") continue;
    await store.update("refunds", refund.id, {
      status: "released",
      released_at: refund.paid_at || now(),
      released_by: "MIGRACAO",
    });
    changed += 1;
  }

  if (await garantirAdmin()) changed += 1;

  if (changed) console.log(`[migrate] ${changed} registro(s) atualizados no PostgreSQL.`);
}
