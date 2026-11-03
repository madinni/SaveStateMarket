// Rotas exclusivas do administrador (UC12, UC13, UC15 e UC16): tickets, reembolsos
// e denúncias de anúncio. Todas passam por exigeAdmin (401 sem token, 403 usuário comum)
// e seguem a ordem 404 → 409.
import { Router } from "express";
import * as store from "./store.js";
import { exigeAdmin } from "./auth.js";
import { fail, parse, sameId, now, applyQuery } from "./http.js";
import { notify } from "./notify.js";
import { exigeItem, removeProductCascade, brl } from "./resources.js";
import * as S from "./schemas.js";

const router = Router();
router.use("/admin", exigeAdmin);

const TICKET_STATUS_LABEL = { OPEN: "aberto", IN_PROGRESS: "em andamento", CLOSED: "fechado" };

// ---------------------------------------------------------------- Tickets
router.get("/admin/tickets", (req, res) => {
  res.json(applyQuery(store.list("tickets"), req.query));
});

router.patch("/admin/tickets/:id", (req, res) => {
  const ticket = exigeItem("tickets", req.params.id, "Ticket");
  const body = parse(S.adminTicketUpdateSchema, req.body);
  if (body.status === undefined && body.admin_reply === undefined) {
    fail(400, "Informe o novo status ou uma resposta.", "status");
  }

  const patch = { ...body, updated_at: now() };
  if (body.admin_reply !== undefined) {
    patch.replied_at = patch.updated_at;
    patch.replied_by = req.user.id;
  }
  const updated = store.update("tickets", ticket.id, patch);

  // Visitante (GUEST_SESSION) não tem conta: o admin usa o contact_email exibido na tela.
  if (ticket.author_id && ticket.author_id !== "GUEST_SESSION") {
    const partes = [];
    if (body.status) partes.push(`Status: ${TICKET_STATUS_LABEL[body.status]}.`);
    if (body.admin_reply) partes.push(`Resposta: ${body.admin_reply}`);
    notify(ticket.author_id, {
      type: "TICKET",
      title: `Ticket ${ticket.id} atualizado`,
      body: `${ticket.subject}. ${partes.join(" ")}`.slice(0, 500),
      link: "/support",
    });
  }
  res.json(updated);
});

// ---------------------------------------------------------------- Reembolsos
router.get("/admin/refunds", (req, res) => {
  res.json(applyQuery(store.list("refunds"), req.query));
});

// Fluxo pending → paid (vendedor confirma) → released (admin libera a conta).
router.patch("/admin/refunds/:id/liberar", (req, res) => {
  const refund = exigeItem("refunds", req.params.id, "Reembolso");
  if (refund.status !== "paid") fail(409, "Só é possível liberar reembolsos já confirmados pelo vendedor.");

  const updated = store.update("refunds", refund.id, {
    status: "released",
    released_at: now(),
    released_by: req.user.id,
  });
  const emAberto = store.find(
    "refunds",
    (r) => sameId(r.seller_id, refund.seller_id) && (r.status === "pending" || r.status === "paid"),
  );
  const seller = store.get("profiles", refund.seller_id);
  if (seller && !emAberto.length) store.update("profiles", seller.id, { account_status: "active" });

  notify(refund.seller_id, {
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
router.get("/admin/reports", (req, res) => {
  const rows = store.list("reports").map((r) => ({ ...r, product_exists: Boolean(store.get("products", r.product_id)) }));
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

router.patch("/admin/reports/:id", (req, res) => {
  const report = exigeItem("reports", req.params.id, "Denúncia");
  parse(S.adminReportUpdateSchema, req.body);
  if (report.status !== "OPEN") fail(409, "Esta denúncia já foi resolvida.");
  res.json(
    store.update("reports", report.id, { status: "DISMISSED", resolved_at: now(), resolved_by: req.user.id }),
  );
});

// UC15: o admin remove o anúncio (cascata de negociações e mensagens) e fecha as denúncias abertas dele.
router.delete("/admin/products/:id", (req, res) => {
  const product = exigeItem("products", req.params.id, "Anúncio");
  removeProductCascade(product.id);

  const resolved_at = now();
  const abertas = store.find("reports", (r) => sameId(r.product_id, product.id) && r.status === "OPEN");
  for (const report of abertas) {
    store.update("reports", report.id, { status: "RESOLVED_REMOVED", resolved_at, resolved_by: req.user.id });
  }

  notify(product.seller_id, {
    type: "MODERATION",
    title: "Anúncio removido",
    body: `Seu anúncio "${product.title}" foi removido pelo administrador por violar as regras do marketplace.`,
    link: "/profile",
  });
  res.json({ resolved_reports: abertas.length });
});

export default router;
