// Ajusta o db.json herdado do json-server na primeira execução do servidor:
// - senhas em texto puro viram hash bcrypt (a aula pede senhaHash, nunca a senha);
// - perfis sem account_status ficam "active";
// - alertas antigos (por anúncio) passam a ser alertas por título.
import bcrypt from "bcryptjs";
import * as store from "./store.js";

const isBcrypt = (value) => /^\$2[aby]\$\d{2}\$/.test(String(value || ""));

export async function migrate() {
  let changed = 0;

  for (const profile of store.list("profiles")) {
    const patch = {};
    if (profile.password_hash && !isBcrypt(profile.password_hash)) {
      patch.password_hash = await bcrypt.hash(String(profile.password_hash), 10);
    }
    if (!profile.account_status) patch.account_status = "active";
    if (Object.keys(patch).length) {
      store.update("profiles", profile.id, patch);
      changed += 1;
    }
  }

  for (const alert of store.list("price_alerts")) {
    if (alert.title) continue;
    const product = alert.product_id ? store.get("products", alert.product_id) : null;
    store.update("price_alerts", alert.id, {
      title: alert.product_title || product?.title || "Título desconhecido",
      platform: product?.platform ?? null,
    });
    changed += 1;
  }

  if (changed) console.log(`[migrate] ${changed} registro(s) atualizados no db.json.`);
}
