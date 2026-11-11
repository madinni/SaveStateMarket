// Rotas exclusivas do administrador (UC12, UC13, UC15 e UC16): tickets, reembolsos
// e denúncias de anúncio. Todas passam por exigeAdmin (401 sem token, 403 usuário comum)
// e seguem a ordem 404 → 409.
import { Router } from "express";
import * as store from "./store.js";
import { exigeAdmin } from "./auth.js";
import { fail, parse, sameId, now, applyQuery, exigeGravado } from "./http.js";
import { notify } from "./notify.js";
import { exigeItem, removeProductCascade, brl, semSegredoTicket } from "./resources.js";
import * as S from "./schemas.js";

const router = Router();
router.use("/admin", exigeAdmin);

const TICKET_STATUS_LABEL = { OPEN: "aberto", IN_PROGRESS: "em andamento", CLOSED: "fechado" };

// ---------------------------------------------------------------- Tickets
router.get("/admin/tickets", async (req, res) => {
  // O hash do código de consulta do visitante nunca é exposto, nem ao admin.
  res.json(applyQuery(await store.list("tickets"), req.query).map(semSegredoTicket));
});

router.patch("/admin/tickets/:id", async (req, res) => {
  const ticket = await exigeItem("tickets", req.params.id, "Ticket");
  const body = parse(S.adminTicketUpdateSchema, req.body);
  if (body.status === undefined && body.admin_reply === undefined) {
    fail(400, "Informe o novo status ou uma resposta.", "status");
  }

  const patch = { ...body, updated_at: now() };
  if (body.admin_reply !== undefined) {
    patch.replied_at = patch.updated_at;
    patch.replied_by = req.user.id;
  }
  const updated = semSegredoTicket(exigeGravado(await store.update("tickets", ticket.id, patch), "Ticket"));

  // Visitante (GUEST_SESSION) não tem conta: o admin usa o contact_email exibido na tela.
  if (ticket.author_id && ticket.author_id !== "GUEST_SESSION") {
    const partes = [];
    if (body.status) partes.push(`Status: ${TICKET_STATUS_LABEL[body.status]}.`);
    if (body.admin_reply) partes.push(`Resposta: ${body.admin_reply}`);
    await notify(ticket.author_id, {
      type: "TICKET",
      title: `Ticket ${ticket.id} atualizado`,
      body: `${ticket.subject}. ${partes.join(" ")}`.slice(0, 500),
      link: "/support",
    });
  }
  res.json(updated);
});

// ---------------------------------------------------------------- Reembolsos
router.get("/admin/refunds", async (req, res) => {
  res.json(applyQuery(await store.list("refunds"), req.query));
});

// Fluxo pending → paid (vendedor confirma) → released (admin libera a conta).
router.patch("/admin/refunds/:id/liberar", async (req, res) => {
  const refund = await exigeItem("refunds", req.params.id, "Reembolso");
  if (refund.status !== "paid") fail(409, "Só é possível liberar reembolsos já confirmados pelo vendedor.");

  const updated = exigeGravado(
    await store.update("refunds", refund.id, { status: "released", released_at: now(), released_by: req.user.id }),
    "Reembolso",
  );
  const emAberto = await store.find(
    "refunds",
    (r) => sameId(r.seller_id, refund.seller_id) && (r.status === "pending" || r.status === "paid"),
  );
  const seller = await store.get("profiles", refund.seller_id);
  if (seller && !emAberto.length) await store.update("profiles", seller.id, { account_status: "active" });

  await notify(refund.seller_id, {
    type: "REFUND",
    title: "Reembolso liberado",
    body: emAberto.length
      ? `O administrador liberou o reembolso ${refund.id} (${brl(refund.amount)}). Ainda há reembolso(s) em aberto na sua conta.`
      : `O administrador liberou o reembolso ${refund.id} (${brl(refund.amount)}). Sua conta foi desbloqueada.`,
    link: "/profile",
  });
  res.json(updated);
});

// ---------------------------------------------------------------- Denúncias
// Abertas primeiro (e, dentro de cada grupo, as mais recentes). Com _sort, vale o pedido.
router.get("/admin/reports", async (req, res) => {
  const products = await store.list("products");
  const productIds = new Set(products.map((p) => String(p.id)));
  const rows = (await store.list("reports")).map((r) => ({ ...r, product_exists: productIds.has(String(r.product_id)) }));
  let result = applyQuery(rows, req.query);
  if (!req.query._sort) {
    result = [...result].sort((a, b) => {
      const aberto = Number(b.status === "OPEN") - Number(a.status === "OPEN");
      if (aberto) return aberto;
      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    });
  }
  res.json(result);
});

router.patch("/admin/reports/:id", async (req, res) => {
  const report = await exigeItem("reports", req.params.id, "Denúncia");
  parse(S.adminReportUpdateSchema, req.body);
  if (report.status !== "OPEN") fail(409, "Esta denúncia já foi resolvida.");
  const updated = await store.update("reports", report.id, { status: "DISMISSED", resolved_at: now(), resolved_by: req.user.id });
  res.json(exigeGravado(updated, "Denúncia"));
});

// UC15: o admin remove o anúncio (cascata de negociações e mensagens) e fecha as denúncias abertas dele.
router.delete("/admin/products/:id", async (req, res) => {
  const product = await exigeItem("products", req.params.id, "Anúncio");
  await removeProductCascade(product.id);

  const resolved_at = now();
  const abertas = await store.find("reports", (r) => sameId(r.product_id, product.id) && r.status === "OPEN");
  for (const report of abertas) {
    await store.update("reports", report.id, { status: "RESOLVED_REMOVED", resolved_at, resolved_by: req.user.id });
  }

  await notify(product.seller_id, {
    type: "MODERATION",
    title: "Anúncio removido",
    body: `Seu anúncio "${product.title}" foi removido pelo administrador por violar as regras do marketplace.`,
    link: "/profile",
  });
  res.json({ resolved_reports: abertas.length });
});

export default router;
