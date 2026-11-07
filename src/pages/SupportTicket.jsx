import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "../components/Header";
import FieldError from "../components/FieldError";
import { useAuth } from "../context/AuthContext";
import {
  useCreateTicket,
  useMyTickets,
  useUpdateTicket,
  useDeleteTicket,
  useLookupTicket,
} from "../hooks/useTickets";
import { guestTicketSchema, ticketLookupSchema, ticketSchema, TICKET_CATEGORIES } from "../schemas";
import { notify } from "../utils/toast";

const PRIORITIES = [
  { id: "LOW", label: "BAIXA", color: "border-slate-400 text-slate-200" },
  { id: "HIGH", label: "ALTA", color: "border-neon-cyan text-neon-cyan" },
  { id: "CRITICAL", label: "CRÍTICA", color: "border-neon-pink text-neon-pink" },
];

const STATUS_STYLE = {
  OPEN: ["[ABERTO]", "border-neon-cyan text-neon-cyan"],
  IN_PROGRESS: ["[EM ANÁLISE]", "border-neon-amber text-neon-amber"],
  CLOSED: ["[FECHADO]", "border-neon-mint text-neon-mint"],
};

const DEFAULTS = { category: "MEDIA_DEFECT", priority: "HIGH", subject: "", description: "", contact_email: "" };
const categoryLabel = (value) => TICKET_CATEGORIES.find((c) => c.value === value)?.label || value;
const priorityLabel = (value) => PRIORITIES.find((p) => p.id === value)?.label || value;
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "";

// Visitante consulta o próprio ticket com o número e o código de acesso recebidos no envio.
// POST /tickets/consulta → { id, subject, category, priority, status, admin_reply, replied_at, created_at, updated_at }.
function TicketLookup() {
  const lookup = useLookupTicket();
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(ticketLookupSchema),
    defaultValues: { id: "", codigo: "" },
  });

  const onSubmit = async (values) => {
    try {
      await lookup.mutateAsync(values);
    } catch (err) {
      if (err.field === "id" || err.field === "codigo") setError(err.field, { message: err.message });
    }
  };

  const ticket = lookup.data;
  const [statusLabel, statusStyle] = ticket ? STATUS_STYLE[ticket.status] || STATUS_STYLE.OPEN : [];
  const showError = lookup.isError && !["id", "codigo"].includes(lookup.error.field);
  const input =
    "w-full bg-noir-950 border-2 border-slate-600 text-slate-100 text-sm font-code px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-neon-cyan";

  return (
    <section aria-label="Consultar ticket" className="bg-noir-900 border-2 border-neon-cyan/50 p-4 chamfer-box space-y-3 text-xs">
      <div>
        <h2 className="text-sm font-bold text-neon-cyan uppercase tracking-wider">// CONSULTAR TICKET</h2>
        <p className="mt-1 text-xs text-slate-400">
          Abriu um ticket sem login? Informe o número e o código de acesso para ver o status e a resposta.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="lookup-id" className="block text-xs text-slate-300 font-bold mb-1">NÚMERO DO TICKET</label>
            <input id="lookup-id" type="text" autoComplete="off" {...register("id")} className={input} />
            <FieldError error={errors.id} />
          </div>
          <div>
            <label htmlFor="lookup-code" className="block text-xs text-slate-300 font-bold mb-1">CÓDIGO DE ACESSO</label>
            <input id="lookup-code" type="text" autoComplete="off" spellCheck={false} {...register("codigo")} className={input} />
            <FieldError error={errors.codigo} />
          </div>
        </div>

        {showError &&
          (lookup.error.status === 429 ? (
            <div role="alert" className="border border-neon-amber/60 bg-noir-950 p-2.5 space-y-1">
              <p className="text-neon-amber font-bold">⚠ MUITAS CONSULTAS SEGUIDAS</p>
              <p className="text-slate-300">{lookup.error.message}</p>
            </div>
          ) : (
            <p role="alert" className="text-neon-pink font-bold">⚠ {lookup.error.message}</p>
          ))}

        <button type="submit" disabled={lookup.isPending}
          className="w-full py-2.5 bg-neon-cyan text-noir-950 text-sm font-black chamfer-tag disabled:opacity-50">
          {lookup.isPending ? "CONSULTANDO…" : "CONSULTAR >>"}
        </button>
      </form>

      {ticket && !lookup.isError && (
        <article role="status" className="bg-noir-950 border border-slate-700 p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-black text-white text-sm break-words">{ticket.subject}</p>
              <p className="text-xs text-slate-400">{ticket.id} // {categoryLabel(ticket.category)}</p>
            </div>
            <span className={`shrink-0 border px-2 py-0.5 text-xs font-bold ${statusStyle}`}>{statusLabel}</span>
          </div>
          <p className="text-xs text-slate-400">
            URGÊNCIA: {priorityLabel(ticket.priority)} · ABERTO EM {formatDateTime(ticket.created_at)}
            {ticket.updated_at ? ` · ATUALIZADO EM ${formatDateTime(ticket.updated_at)}` : ""}
          </p>
          {ticket.admin_reply ? (
            <div className="border border-neon-mint/50 p-2 space-y-1">
              <p className="text-xs font-bold text-neon-mint">
                // RESPOSTA DO SUPORTE{ticket.replied_at ? ` · ${formatDateTime(ticket.replied_at)}` : ""}
              </p>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words">{ticket.admin_reply}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">O suporte ainda não respondeu este ticket.</p>
          )}
        </article>
      )}
    </section>
  );
}

export default function SupportTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isGuest = !user;

  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [listError, setListError] = useState("");
  const [submitError, setSubmitError] = useState(null);

  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();
  const { data: myTickets = [], isLoading: loadingTickets } = useMyTickets(user?.id);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
    // Visitante precisa informar contact_email; logado, o contato é a própria conta.
  } = useForm({ resolver: zodResolver(isGuest ? guestTicketSchema : ticketSchema), defaultValues: DEFAULTS });

  const priority = watch("priority");
  const subjectLen = watch("subject").trim().length;
  const descriptionLen = watch("description").trim().length;
  const isEditing = Boolean(editingId);
  const submitting = createTicket.isPending || updateTicket.isPending;

  const startEdit = (ticket) => {
    setNotice("");
    setEditingId(ticket.id);
    reset({
      category: ticket.category,
      priority: ticket.priority,
      subject: ticket.subject,
      description: ticket.description,
      contact_email: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSubmitError(null);
    reset(DEFAULTS);
  };

  // Erro com campo (ApiError.field) vai para o próprio campo; os demais aparecem no bloco de falha.
  const showApiError = (err) => {
    if (err.field && err.field in DEFAULTS) setError(err.field, { message: err.message });
    else setSubmitError(err);
  };

  // Id, autor, status e datas são definidos pelo servidor; o cliente manda só o formulário.
  const onSubmit = async (values) => {
    setNotice("");
    setSubmitError(null);
    try {
      if (isEditing) {
        await updateTicket.mutateAsync({ id: editingId, data: values });
        setEditingId(null);
        reset(DEFAULTS);
        setNotice("Ticket atualizado com sucesso.");
        notify.success("Ticket atualizado.");
      } else {
        const created = await createTicket.mutateAsync(values);
        notify.success(`Ticket ${created?.id ?? ""} enviado.`);
      }
    } catch (err) {
      showApiError(err);
    }
  };

  const onDelete = async (ticket) => {
    if (!window.confirm(`Cancelar o ticket ${ticket.id}? Esta ação não pode ser desfeita.`)) return;
    setListError("");
    setNotice("");
    try {
      await deleteTicket.mutateAsync(ticket.id);
      if (editingId === ticket.id) cancelEdit();
      setNotice("Ticket cancelado.");
      notify.info("Ticket cancelado.");
    } catch (err) {
      setListError(err.message || "Não foi possível cancelar o ticket.");
    }
  };

  const copyAccess = (ticket) =>
    navigator.clipboard
      ?.writeText(`Ticket: ${ticket.id} | Código: ${ticket.access_code}`)
      .then(() => notify.info("Número e código copiados."))
      .catch(() => notify.error("Não foi possível copiar. Anote o código."));

  const createdTicket = createTicket.data;
  const field = "w-full bg-noir-950 border-2 border-slate-600 text-slate-100 text-sm font-code placeholder-slate-400 focus:outline-none transition-all";
  const fieldLabel = "text-xs text-slate-200 font-bold uppercase tracking-wider";

  return (
    <div className="min-h-screen pb-nav text-slate-100 bg-noir-950 font-code">
      <Header
        title="SUPORTE"
        titleHighlight="TICKET"
        subtitle="CENTRAL DE AJUDA E MEDIAÇÃO"
        backLink="/help"
        backText="<< AJUDA"
        badgeText={user ? "LOGADO" : "VISITANTE"}
        badgeType={user ? "mint" : "cyan"}
      />

      <main className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-4 pt-4 space-y-4">
        <section className="bg-noir-900 border-2 border-slate-700 p-3 chamfer-box flex flex-wrap gap-2 items-center justify-between text-xs">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="w-2.5 h-2.5 bg-neon-pink animate-pulse rounded-full shrink-0"></span>
            <span className="text-slate-300 font-bold">USUÁRIO:</span>
            <span className="text-neon-cyan font-extrabold text-sm truncate">{user ? user.handle : "Visitante"}</span>
          </div>
          <span className="text-xs text-slate-200 bg-noir-950 px-2 py-1 border border-slate-600 font-bold">
            {user ? "CONTA CONECTADA" : "SEM LOGIN"}
          </span>
        </section>

        {notice && (
          <div role="status" className="bg-noir-900 border-2 border-neon-mint p-3 chamfer-box text-xs text-neon-mint font-bold">
            ✓ {notice}
          </div>
        )}

        {submitError && (
          <div role="alert" className="bg-noir-900 border-2 border-neon-pink p-3.5 chamfer-box text-xs space-y-1 glow-pink">
            <p className="text-neon-pink font-bold uppercase text-sm">⚠ FALHA NO ENVIO</p>
            <p className="text-slate-200 text-xs font-bold">{submitError.message}</p>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-6 lg:items-start space-y-4 lg:space-y-0">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-noir-900 border-2 border-slate-700 p-5 chamfer-box space-y-5 text-xs shadow-xl">
            {isEditing && (
              <p className="text-neon-amber font-bold">✎ EDITANDO O TICKET {editingId}</p>
            )}

            <div className="space-y-1.5">
              <label htmlFor="ticket-category" className={`block ${fieldLabel}`}>
                // [01] TIPO DO PROBLEMA
              </label>
              <select id="ticket-category" {...register("category")} className={`${field} p-3 focus:border-neon-pink`}>
                {TICKET_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-noir-900 text-slate-100">{cat.label}</option>
                ))}
              </select>
              <FieldError error={errors.category} />
            </div>

            <div className="space-y-1.5">
              <span className={`block ${fieldLabel}`}>// [02] URGÊNCIA</span>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Urgência">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={priority === p.id}
                    onClick={() => setValue("priority", p.id)}
                    className={`py-2.5 font-extrabold border-2 chamfer-tag text-xs transition-all ${
                      priority === p.id ? `bg-noir-800 ${p.color} glow-pink` : "bg-noir-950 border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    [{p.label}]
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="ticket-subject" className={fieldLabel}>// [03] ASSUNTO</label>
                <span className={`text-xs font-bold ${subjectLen >= 5 ? "text-neon-mint" : "text-slate-400"}`}>{subjectLen}/5 MÍNIMO</span>
              </div>
              <input id="ticket-subject" type="text" maxLength={80} placeholder="Ex: Cartucho de SNES não funciona no console"
                {...register("subject")} className={`${field} px-3.5 py-2.5 focus:border-neon-cyan`} />
              <FieldError error={errors.subject} />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="ticket-description" className={fieldLabel}>// [04] DESCRIÇÃO DO PROBLEMA</label>
                <span className={`text-xs font-bold ${descriptionLen >= 15 ? "text-neon-mint" : "text-slate-400"}`}>{descriptionLen}/15 MÍNIMO</span>
              </div>
              <textarea id="ticket-description" rows="5" placeholder="Conte o que aconteceu. Se puder, informe o anúncio ou o número do pedido."
                {...register("description")} className={`${field} p-3 resize-none focus:border-neon-pink`} />
              <FieldError error={errors.description} />
            </div>

            {isGuest && (
              <div className="space-y-1.5">
                <label htmlFor="ticket-contact-email" className={`block ${fieldLabel}`}>
                  // [05] E-MAIL PARA CONTATO *
                </label>
                <input id="ticket-contact-email" type="email" autoComplete="email" maxLength={120} placeholder="voce@exemplo.com"
                  {...register("contact_email")} className={`${field} px-3.5 py-2.5 focus:border-neon-cyan`} />
                <p className="text-xs text-slate-400">
                  Você está sem login: ao enviar, recebe um código para consultar a resposta nesta página.
                </p>
                <FieldError error={errors.contact_email} />
              </div>
            )}

            <div className={isEditing ? "grid grid-cols-2 gap-2" : ""}>
              {isEditing && (
                <button type="button" onClick={cancelEdit}
                  className="py-3.5 font-bold text-xs uppercase chamfer-box tracking-widest bg-noir-800 text-slate-200 border border-slate-600">
                  CANCELAR EDIÇÃO
                </button>
              )}
              <button type="submit" disabled={submitting}
                className="w-full py-3.5 font-black text-sm uppercase chamfer-box tracking-widest bg-neon-pink hover:bg-neon-pink/90 text-slate-950 shadow-lg glow-pink cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50">
                {submitting ? "ENVIANDO…" : isEditing ? "SALVAR ALTERAÇÕES >>" : "ENVIAR TICKET >>"}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {isGuest && <TicketLookup />}

            <section className="space-y-3" aria-label="Meus tickets">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-700 pb-2">
                // MEUS TICKETS {user ? `(${myTickets.length})` : ""}
              </h2>

              {listError && <p role="alert" className="text-xs font-bold text-neon-pink">⚠ {listError}</p>}

              {!user ? (
                <p className="text-xs text-slate-400 bg-noir-900 border border-slate-800 p-3">
                  <Link to="/entrar" className="text-neon-cyan underline font-bold">Faça login</Link>{" "}
                  para acompanhar, editar e cancelar seus tickets.
                </p>
              ) : loadingTickets ? (
                <p className="text-xs text-neon-cyan animate-pulse">CARREGANDO TICKETS...</p>
              ) : myTickets.length === 0 ? (
                <p className="text-xs text-slate-400 bg-noir-900/40 border border-dashed border-noir-800 p-4 text-center">
                  VOCÊ AINDA NÃO ABRIU NENHUM TICKET.
                </p>
              ) : (
                myTickets.map((t) => {
                  const [label, style] = STATUS_STYLE[t.status] || STATUS_STYLE.OPEN;
                  const editable = t.status === "OPEN";
                  return (
                    <article key={t.id} className="bg-noir-900 border border-slate-700 p-3 chamfer-box space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-black text-white text-sm truncate">{t.subject}</p>
                          <p className="text-xs text-slate-400">{t.id} // {categoryLabel(t.category)}</p>
                        </div>
                        <span className={`shrink-0 border px-2 py-0.5 text-xs font-bold ${style}`}>{label}</span>
                      </div>
                      <p className="text-xs text-slate-300 bg-noir-950 border border-slate-800 p-2 leading-relaxed whitespace-pre-wrap">{t.description}</p>
                      {t.admin_reply && (
                        <div className="border border-neon-mint/50 bg-noir-950 p-2 space-y-1">
                          <p className="text-xs font-bold text-neon-mint">
                            // RESPOSTA DO SUPORTE{t.replied_at ? ` · ${formatDateTime(t.replied_at)}` : ""}
                          </p>
                          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap break-words">{t.admin_reply}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                        <span>
                          URGÊNCIA: {priorityLabel(t.priority)} ·{" "}
                          {new Date(t.created_at).toLocaleDateString("pt-BR")}
                        </span>
                        {editable ? (
                          <span className="flex gap-2">
                            <button type="button" onClick={() => startEdit(t)} className="px-2.5 py-1.5 border border-neon-cyan text-neon-cyan font-bold">EDITAR</button>
                            <button type="button" onClick={() => onDelete(t)} disabled={deleteTicket.isPending}
                              className="px-2.5 py-1.5 border border-neon-pink text-neon-pink font-bold disabled:opacity-50">
                              CANCELAR
                            </button>
                          </span>
                        ) : (
                          <span>Apenas tickets abertos podem ser alterados.</span>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          </div>
        </div>
      </main>

      {createTicket.isSuccess && createdTicket && (
        <div className="fixed inset-0 z-50 bg-noir-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="ticket-created-title"
            className="bg-noir-900 border-2 border-neon-mint p-5 max-w-sm w-full chamfer-box glow-mint text-center space-y-4 font-code">
            <div className="w-3.5 h-3.5 bg-neon-mint mx-auto animate-ping rounded-full"></div>
            <div>
              <h3 id="ticket-created-title" className="text-base font-black text-white uppercase tracking-wider">TICKET ENVIADO</h3>
              <p className="text-sm text-neon-mint font-bold mt-1">
                NÚMERO DO TICKET: <span className="select-all break-all">{createdTicket.id}</span>
              </p>
            </div>

            {createdTicket.access_code ? (
              // Visitante: o código só vem nesta resposta (o servidor guarda apenas o hash).
              <div className="bg-noir-950 border-2 border-neon-amber p-3 text-left space-y-2">
                <p className="text-sm font-bold text-neon-amber">⚠ GUARDE ESTE CÓDIGO</p>
                <p className="font-pixel text-3xl text-white tracking-widest text-center break-all select-all">
                  {createdTicket.access_code}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ele aparece só agora. Com o número do ticket e este código você consulta o status e a
                  resposta em "Consultar ticket", nesta página.
                </p>
                <button type="button" onClick={() => copyAccess(createdTicket)}
                  className="w-full py-2 border border-neon-amber text-neon-amber text-xs font-bold chamfer-tag hover:bg-neon-amber/10">
                  [COPIAR NÚMERO E CÓDIGO]
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-200 bg-noir-950 p-3 border border-slate-700 text-left leading-relaxed">
                Acompanhe o status e a resposta da equipe em "Meus tickets", nesta página.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button type="button" onClick={() => { createTicket.reset(); reset(DEFAULTS); }}
                className="py-2.5 bg-noir-800 text-slate-200 font-bold border border-slate-600 chamfer-tag text-xs hover:text-white">
                {createdTicket.access_code ? "[JÁ ANOTEI]" : "[NOVO TICKET]"}
              </button>
              <button type="button" onClick={() => navigate("/")} className="py-2.5 bg-neon-mint text-noir-950 font-black chamfer-tag text-xs">
                [INÍCIO]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
