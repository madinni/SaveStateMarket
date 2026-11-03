import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "../components/Header";
import AdminTabs from "../components/AdminTabs";
import FieldError from "../components/FieldError";
import { useAdminTickets, useAdminUpdateTicket } from "../hooks/useAdmin";
import { adminTicketSchema, TICKET_CATEGORIES, TICKET_STATUSES } from "../schemas";

const STATUS_STYLE = {
  OPEN: "border-neon-cyan text-neon-cyan",
  IN_PROGRESS: "border-neon-amber text-neon-amber",
  CLOSED: "border-neon-mint text-neon-mint",
};
const PRIORITY_LABEL = { LOW: "BAIXA", HIGH: "ALTA", CRITICAL: "CRÍTICA" };
const FILTERS = [{ value: "ALL", label: "TODOS" }, ...TICKET_STATUSES];

const categoryLabel = (value) => TICKET_CATEGORIES.find((c) => c.value === value)?.label || value;
const statusLabel = (value) => TICKET_STATUSES.find((s) => s.value === value)?.label || value;
const when = (iso) => (iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—");
const field =
  "w-full bg-noir-950 border-2 border-slate-600 p-2 text-slate-100 text-xs focus:outline-none focus:border-neon-cyan";

function TicketCard({ ticket }) {
  const updateTicket = useAdminUpdateTicket();
  const [notice, setNotice] = useState("");
  const [submitError, setSubmitError] = useState("");
  const isGuest = ticket.author_id === "GUEST_SESSION";

  const { register, handleSubmit, setError, formState: { errors, isDirty }, reset } = useForm({
    resolver: zodResolver(adminTicketSchema),
    defaultValues: { status: ticket.status, admin_reply: ticket.admin_reply || "" },
  });

  const onSubmit = async ({ status, admin_reply }) => {
    setNotice("");
    setSubmitError("");
    // A resposta só vai quando muda, para não regravar replied_at à toa.
    const data = { status };
    if (admin_reply && admin_reply !== (ticket.admin_reply || "")) data.admin_reply = admin_reply;
    try {
      const updated = await updateTicket.mutateAsync({ id: ticket.id, data });
      reset({ status: updated?.status ?? status, admin_reply: updated?.admin_reply ?? admin_reply });
      setNotice(isGuest ? "Ticket atualizado. Responda o visitante pelo e-mail de contato." : "Ticket atualizado. O autor foi notificado.");
    } catch (err) {
      if (err.field) setError(err.field, { message: err.message });
      else setSubmitError(err.message);
    }
  };

  return (
    <article className="bg-noir-900 border border-slate-700 p-3 chamfer-box space-y-2 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-black text-white break-words">{ticket.subject}</p>
          <p className="text-[10px] text-slate-400">{ticket.id} // {categoryLabel(ticket.category)}</p>
        </div>
        <span className={`shrink-0 border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[ticket.status] || STATUS_STYLE.OPEN}`}>
          [{statusLabel(ticket.status)}]
        </span>
      </div>

      <div className="text-[10px] text-slate-400 space-y-0.5">
        <p>
          AUTOR: <span className="text-neon-cyan font-bold">{ticket.author_handle || "—"}</span>
          {" · "}SEVERIDADE: {PRIORITY_LABEL[ticket.priority] || ticket.priority}
          {" · "}{when(ticket.created_at)}
        </p>
        {isGuest && (
          <p>
            CONTATO DO VISITANTE:{" "}
            {ticket.contact_email ? (
              <a href={`mailto:${ticket.contact_email}`} className="text-neon-amber underline break-all">{ticket.contact_email}</a>
            ) : (
              <span className="text-neon-pink">não informado</span>
            )}
          </p>
        )}
      </div>

      <p className="text-[11px] text-slate-300 bg-noir-950 border border-slate-800 p-2 leading-relaxed whitespace-pre-wrap break-words">
        {ticket.description}
      </p>

      {ticket.admin_reply && (
        <p className="text-[10px] text-slate-500">ÚLTIMA RESPOSTA EM {when(ticket.replied_at)}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2 border-t border-slate-800 pt-2">
        <div>
          <label htmlFor={`reply-${ticket.id}`} className="block text-[10px] text-slate-400 mb-1">// RESPOSTA DO ADMINISTRADOR</label>
          <textarea id={`reply-${ticket.id}`} rows="3" maxLength={3000} {...register("admin_reply")}
            placeholder="Escreva a resposta para o autor do ticket..." className={`${field} resize-none`} />
          <FieldError error={errors.admin_reply} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={`status-${ticket.id}`} className="sr-only">Status do ticket</label>
            <select id={`status-${ticket.id}`} {...register("status")} className={`${field} h-10`}>
              {TICKET_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <FieldError error={errors.status} />
          </div>
          <button type="submit" disabled={updateTicket.isPending || !isDirty}
            className="h-10 bg-neon-cyan text-noir-950 font-black chamfer-tag text-[10px] tracking-wider disabled:opacity-40">
            {updateTicket.isPending ? "SALVANDO..." : "SALVAR >>"}
          </button>
        </div>
        {submitError && <p role="alert" className="text-[10px] font-bold text-neon-pink">⚠ {submitError}</p>}
        {notice && <p role="status" className="text-[10px] font-bold text-neon-mint">✓ {notice}</p>}
      </form>
    </article>
  );
}

export default function AdminTickets() {
  const { data: tickets = [], isLoading, isError, error } = useAdminTickets();
  const [filter, setFilter] = useState("OPEN");
  const visible = filter === "ALL" ? tickets : tickets.filter((t) => t.status === filter);
  const countOf = (value) => (value === "ALL" ? tickets.length : tickets.filter((t) => t.status === value).length);

  return (
    <div className="min-h-screen pb-28 text-slate-100 bg-noir-950 font-code">
      <Header title="NULL" titleHighlight="TICKETS" subtitle="CONSOLE DO ADMINISTRADOR // SUPORTE" backLink="/admin" badgeText="ROOT" badgeType="pink" />
      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <AdminTabs />

        <div role="radiogroup" aria-label="Filtrar por status" className="grid grid-cols-4 gap-1">
          {FILTERS.map((f) => (
            <button key={f.value} type="button" role="radio" aria-checked={filter === f.value} onClick={() => setFilter(f.value)}
              className={`py-2 chamfer-tag border text-[9px] font-bold ${
                filter === f.value ? "bg-noir-800 border-neon-cyan text-neon-cyan" : "bg-noir-950 border-slate-700 text-slate-400"
              }`}>
              {f.label} ({countOf(f.value)})
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-xs text-neon-cyan animate-pulse">CARREGANDO_TICKETS...</p>
        ) : isError ? (
          <p role="alert" className="text-xs font-bold text-neon-pink">⚠ {error.message}</p>
        ) : visible.length === 0 ? (
          <p className="text-xs text-slate-500 bg-noir-900/40 border border-dashed border-noir-800 p-4 text-center">
            NENHUM TICKET NESTE FILTRO.
          </p>
        ) : (
          visible.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
        )}
      </main>
    </div>
  );
}
