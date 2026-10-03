// src/pages/SupportTicket.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useAuth, API_URL } from "../context/AuthContext";

export default function SupportTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados do Formulário
  const [category, setCategory] = useState("MEDIA_DEFECT");
  const [priority, setPriority] = useState("HIGH");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  // Estados de Interface e Feedback
  const [status, setStatus] = useState("idle"); // 'idle' | 'submitting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [validationError, setValidationError] = useState("");
  const [createdTicket, setCreatedTicket] = useState(null);

  const categories = [
    { value: "MEDIA_DEFECT", label: "Mídia com Defeito / Leitura Falhou" },
    { value: "ESCROW_LOCK", label: "Retenção de Saldo / Custódia Presa" },
    { value: "PRICE_DISCREPANCY", label: "Divergência de Valor no Anúncio" },
    { value: "FRAUD_REPORT", label: "Suspeita de Fraude / Conduta Imprópria" },
    { value: "SYSTEM_BUG", label: "Anomalia na Interface / Bug Técnico" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");
    setErrorMessage("");

    // Validações explícitas com feedback direto ao usuário
    if (subject.trim().length < 5) {
      setValidationError("O assunto deve ter pelo menos 5 caracteres.");
      return;
    }

    if (description.trim().length < 15) {
      setValidationError(
        "O relatório detalhado deve ter pelo menos 15 caracteres.",
      );
      return;
    }

    setStatus("submitting");

    const ticketPayload = {
      id: `TCK-${Date.now().toString(36).toUpperCase()}`,
      author_id: user?.id || "GUEST_SESSION",
      author_handle: user?.handle || "@Visitante_Anonimo",
      category,
      priority,
      subject: subject.trim(),
      description: description.trim(),
      status: "OPEN",
      created_at: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ticketPayload),
      });

      if (!response.ok) {
        throw new Error(`Falha no servidor REST (HTTP ${response.status})`);
      }

      const data = await response.json();
      setCreatedTicket(data);
      setStatus("success");
    } catch (err) {
      console.error("[TICKET_DISPATCH_ERROR]:", err);
      setErrorMessage(
        err.message || "Erro ao conectar com o banco de dados do distrito.",
      );
      setStatus("error");
    }
  };

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
        {/* IDENTIFICAÇÃO DO OPERADOR - ALTO CONTRASTE */}
        <section className="bg-noir-900 border-2 border-slate-700 p-3 chamfer-box flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-neon-pink animate-pulse rounded-full"></span>
            <span className="text-slate-300 font-bold">OPERADOR:</span>
            <span className="text-neon-cyan font-extrabold text-sm">
              {user ? user.handle : "@Visitante_Anônimo"}
            </span>
          </div>
          <span className="text-[10px] text-slate-200 bg-noir-950 px-2 py-1 border border-slate-600 font-bold">
            {user ? "AUTENTICADO" : "MODO_VISITANTE"}
          </span>
        </section>

        {/* ALERTA DE ERRO DE VALIDAÇÃO OU CONEXÃO */}
        {(validationError || status === "error") && (
          <div className="bg-noir-900 border-2 border-neon-pink p-3.5 chamfer-box text-xs space-y-1 glow-pink">
            <p className="text-neon-pink font-bold uppercase text-sm">
              ⚠ ATENÇÃO / FALHA NO ENVIO
            </p>
            <p className="text-slate-200 text-xs font-bold">
              {validationError || errorMessage}
            </p>
          </div>
        )}

        {/* FORMULÁRIO PRINCIPAL */}
        <form
          onSubmit={handleSubmit}
          className="bg-noir-900 border-2 border-slate-700 p-5 chamfer-box space-y-5 text-xs shadow-xl"
        >
          {/* CATEGORIA */}
          <div className="space-y-1.5">
            <label
              htmlFor="ticket-category"
              className="block text-xs text-slate-200 font-bold uppercase tracking-wider"
            >
              // [01] CATEGORIA DO INCIDENTE
            </label>
            <select
              id="ticket-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-noir-950 border-2 border-slate-600 p-3 text-slate-100 font-code text-xs focus:outline-none focus:border-neon-pink transition-all"
            >
              {categories.map((cat) => (
                <option
                  key={cat.value}
                  value={cat.value}
                  className="bg-noir-900 text-slate-100"
                >
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* NIVEL DE SEVERIDADE */}
          <div className="space-y-1.5">
            <label className="block text-xs text-slate-200 font-bold uppercase tracking-wider">
              // [02] NIVEL DE SEVERIDADE
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: "LOW",
                  label: "BAIXA",
                  color: "border-slate-400 text-slate-200",
                },
                {
                  id: "HIGH",
                  label: "ALTA",
                  color: "border-neon-cyan text-neon-cyan",
                },
                {
                  id: "CRITICAL",
                  label: "CRÍTICA",
                  color: "border-neon-pink text-neon-pink",
                },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`py-2 font-extrabold border-2 chamfer-tag text-xs transition-all ${
                    priority === p.id
                      ? "bg-noir-800 " + p.color + " glow-pink"
                      : "bg-noir-950 border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  [{p.label}]
                </button>
              ))}
            </div>
          </div>

          {/* ASSUNTO / TÍTULO */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label
                htmlFor="ticket-subject"
                className="text-xs text-slate-200 font-bold uppercase tracking-wider"
              >
                // [03] ASSUNTO SINTÉTICO
              </label>
              <span
                className={`text-[10px] font-bold ${subject.trim().length >= 5 ? "text-neon-mint" : "text-slate-400"}`}
              >
                {subject.trim().length}/5 MÍNIMO
              </span>
            </div>
            <input
              id="ticket-subject"
              type="text"
              maxLength={80}
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (validationError) setValidationError("");
              }}
              placeholder="Ex: Cartucho SNES não reconhecido no Leitor"
              className="w-full bg-noir-950 border-2 border-slate-600 px-3.5 py-2.5 text-slate-100 text-xs font-code placeholder-slate-400 focus:outline-none focus:border-neon-cyan transition-all"
            />
          </div>

          {/* DETALHAMENTO */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label
                htmlFor="ticket-description"
                className="text-xs text-slate-200 font-bold uppercase tracking-wider"
              >
                // [04] RELATÓRIO DE DIAGNÓSTICO
              </label>
              <span
                className={`text-[10px] font-bold ${description.trim().length >= 15 ? "text-neon-mint" : "text-slate-400"}`}
              >
                {description.trim().length}/15 MÍNIMO
              </span>
            </div>
            <textarea
              id="ticket-description"
              rows="4"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (validationError) setValidationError("");
              }}
              placeholder="Descreva o ocorrido detalhadamente, incluindo código do produto ou número do pedido..."
              className="w-full bg-noir-950 border-2 border-slate-600 p-3 text-slate-100 text-xs font-code placeholder-slate-400 focus:outline-none focus:border-neon-pink resize-none transition-all"
            />
          </div>

          {/* BOTÃO DE SUBMISSÃO - SEMPRE VISÍVEL E CLICÁVEL */}
          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full py-3.5 font-black text-sm uppercase chamfer-box tracking-widest bg-neon-pink hover:bg-neon-pink/90 text-slate-950 shadow-lg glow-pink cursor-pointer transition-all active:scale-[0.99]"
          >
            {status === "submitting"
              ? "TRANSMITINDO_DADOS..."
              : "ENVIAR TICKET DE AJUDA >>"}
          </button>
        </form>
      </main>

      {/* MODAL DE SUCESSO */}
      {status === "success" && createdTicket && (
        <div className="fixed inset-0 z-50 bg-noir-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-noir-900 border-2 border-neon-mint p-5 max-w-sm w-full chamfer-box glow-mint text-center space-y-4 font-code">
            <div className="w-3.5 h-3.5 bg-neon-mint mx-auto animate-ping rounded-full"></div>

            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                TICKET REGISTRADO COM SUCESSO
              </h3>
              <p className="text-xs text-neon-mint font-bold mt-1">
                PROTOCOLO: {createdTicket.id}
              </p>
            </div>

            <p className="text-xs text-slate-200 bg-noir-950 p-3 border border-slate-700 text-left leading-relaxed">
              O relatório foi salvo no banco de dados (
              <code className="text-neon-cyan">db.json</code>). A equipe
              responderá em até 24 horas.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setStatus("idle");
                  setSubject("");
                  setDescription("");
                  setValidationError("");
                }}
                className="py-2.5 bg-noir-800 text-slate-200 font-bold border border-slate-600 chamfer-tag text-xs hover:text-white"
              >
                [NOVO TICKET]
              </button>
              <button
                onClick={() => navigate("/")}
                className="py-2.5 bg-neon-mint text-noir-950 font-black chamfer-tag text-xs"
              >
                [INÍCIO]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
