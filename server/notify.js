// Só o servidor cria notificações (o cliente recebe 403 em POST /notifications).
import * as store from "./store.js";
import { now } from "./http.js";

export async function notify(userId, { type, title, body, link = null }) {
  if (!userId || userId === "SYSTEM") return null;
  return store.insert("notifications", {
    id: store.newId("NTF-"),
    user_id: String(userId),
    type,
    title,
    body,
    link,
    read: false,
    created_at: now(),
  });
}
