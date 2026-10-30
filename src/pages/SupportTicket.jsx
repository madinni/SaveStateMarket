import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "../components/Header";
import FieldError from "../components/FieldError";
import { useAuth } from "../context/AuthContext";
import { useCreateTicket } from "../hooks/useTickets";
import { ticketSchema, TICKET_CATEGORIES } from "../schemas";

const PRIORITIES = [
  { id: "LOW", label: "BAIXA", color: "border-slate-400 text-slate-200" },
  { id: "HIGH", label: "ALTA", color: "border-neon-cyan text-neon-cyan" },
  { id: "CRITICAL", label: "CRÍTICA", color: "border-neon-pink text-neon-pink" },
];

const DEFAULTS = { category: "MEDIA_DEFECT", priority: "HIGH", subject: "", description: "" };

export default function SupportTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createTicket = useCreateTicket();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(ticketSchema), defaultValues: DEFAULTS });

  const priority = watch("priority");
  const subjectLen = watch("subject").trim().length;
  const descriptionLen = watch("description").trim().length;

  const onSubmit = (values) => {
    createTicket.mutate({
      id: `TCK-${Date.now().toString(36).toUpperCase()}`,
      author_id: user?.id || "GUEST_SESSION",
      author_handle: user?.handle || "@Visitante_Anonimo",
      ...values,
      status: "OPEN",
      created_at: new Date().toISOString(),
    });
  };

  const createdTicket = createTicket.data;
  const field = "w-full bg-noir-950 border-2 border-slate-600 text-slate-100 text-xs font-code placeholder-slate-400 focus:outline-none transition-all";

  return (
    <div className="min-h-screen pb-28 text-slate-100 bg-noir-950 font-code">
      <Header
        title="DISPATCH"
        titleHighlight="TICKET"
        subtitle="DISPATCH_CENTER // MEDIATION_PROTOCOL"
        backLink="/help"
        backText="<< HELP_LOG"
        badgeText="HIGH_PRIORITY"
        badgeType="pink"
      />

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <section className="bg-noir-900 border-2 border-slate-700 p-3 chamfer-box flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-neon-pink animate-pulse rounded-full"></span>
            <span className="text-slate-300 font-bold">OPERADOR:</span>
            <span className="text-neon-cyan font-extrabold text-sm">{user ? user.handle : "@Visitante_Anônimo"}</span>
          </div>
          <span className="text-[10px] text-slate-200 bg-noir-950 px-2 py-1 border border-slate-600 font-bold">
            {user ? "AUTENTICADO" : "MODO_VISITANTE"}
          </span>
        </section>

        {createTicket.isError && (
          <div role="alert" className="bg-noir-900 border-2 border-neon-pink p-3.5 chamfer-box text-xs space-y-1 glow-pink">
            <p className="text-neon-pink font-bold uppercase text-sm">⚠ FALHA NO ENVIO</p>
            <p className="text-slate-200 text-xs font-bold">{createTicket.error.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-noir-900 border-2 border-slate-700 p-5 chamfer-box space-y-5 text-xs shadow-xl">
          <div className="space-y-1.5">
            <label htmlFor="ticket-category" className="block text-xs text-slate-200 font-bold uppercase tracking-wider">
              // [01] CATEGORIA DO INCIDENTE
            </label>
            <select id="ticket-category" {...register("category")} className={`${field} p-3 focus:border-neon-pink`}>
              {TICKET_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-noir-900 text-slate-100">{cat.label}</option>
              ))}
            </select>
            <FieldError error={errors.category} />
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs text-slate-200 font-bold uppercase tracking-wider">// [02] NIVEL DE SEVERIDADE</span>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Nível de severidade">
              {PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={priority === p.id}
                  onClick={() => setValue("priority", p.id)}
                  className={`py-2 font-extrabold border-2 chamfer-tag text-xs transition-all ${
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
              <label htmlFor="ticket-subject" className="text-xs text-slate-200 font-bold uppercase tracking-wider">// [03] ASSUNTO SINTÉTICO</label>
              <span className={`text-[10px] font-bold ${subjectLen >= 5 ? "text-neon-mint" : "text-slate-400"}`}>{subjectLen}/5 MÍNIMO</span>
            </div>
            <input id="ticket-subject" type="text" maxLength={80} placeholder="Ex: Cartucho SNES não reconhecido no Leitor"
              {...register("subject")} className={`${field} px-3.5 py-2.5 focus:border-neon-cyan`} />
            <FieldError error={errors.subject} />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="ticket-description" className="text-xs text-slate-200 font-bold uppercase tracking-wider">// [04] RELATÓRIO DE DIAGNÓSTICO</label>
              <span className={`text-[10px] font-bold ${descriptionLen >= 15 ? "text-neon-mint" : "text-slate-400"}`}>{descriptionLen}/15 MÍNIMO</span>
            </div>
            <textarea id="ticket-description" rows="4" placeholder="Descreva o ocorrido detalhadamente, incluindo código do produto ou número do pedido..."
              {...register("description")} className={`${field} p-3 resize-none focus:border-neon-pink`} />
            <FieldError error={errors.description} />
          </div>

          <button type="submit" disabled={createTicket.isPending}
            className="w-full py-3.5 font-black text-sm uppercase chamfer-box tracking-widest bg-neon-pink hover:bg-neon-pink/90 text-slate-950 shadow-lg glow-pink cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50">
            {createTicket.isPending ? "TRANSMITINDO_DADOS..." : "ENVIAR TICKET DE AJUDA >>"}
          </button>
        </form>
      </main>

      {createTicket.isSuccess && createdTicket && (
        <div className="fixed inset-0 z-50 bg-noir-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-noir-900 border-2 border-neon-mint p-5 max-w-sm w-full chamfer-box glow-mint text-center space-y-4 font-code">
            <div className="w-3.5 h-3.5 bg-neon-mint mx-auto animate-ping rounded-full"></div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">TICKET REGISTRADO COM SUCESSO</h3>
              <p className="text-xs text-neon-mint font-bold mt-1">PROTOCOLO: {createdTicket.id}</p>
            </div>
            <p className="text-xs text-slate-200 bg-noir-950 p-3 border border-slate-700 text-left leading-relaxed">
              O relatório foi salvo no banco de dados (<code className="text-neon-cyan">db.json</code>). A equipe responderá em até 24 horas.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button type="button" onClick={() => { createTicket.reset(); reset(DEFAULTS); }}
                className="py-2.5 bg-noir-800 text-slate-200 font-bold border border-slate-600 chamfer-tag text-xs hover:text-white">
                [NOVO TICKET]
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
