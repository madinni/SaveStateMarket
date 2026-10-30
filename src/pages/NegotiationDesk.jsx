import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "../components/Header";
import FieldError from "../components/FieldError";
import { useAuth } from "../context/AuthContext";
import { useOffers, useMessages, useSendMessage, useUpdateOffer } from "../hooks/useOffers";
import { chatSchema, priceSchema } from "../schemas";

const newId = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;

const BADGES = {
  ACCEPTED: ["[ACEITO]", "text-neon-mint bg-neon-mint/10 border-neon-mint"],
  REJECTED: ["[RECUSADO]", "text-neon-pink bg-neon-pink/10 border-neon-pink"],
  COUNTER_OFFER: ["[CONTRAPROPOSTA]", "text-neon-cyan bg-neon-cyan/10 border-neon-cyan"],
  PENDING: ["[PENDENTE]", "text-yellow-400 bg-yellow-400/10 border-yellow-400"],
};

function StatusBadge({ status }) {
  const [label, style] = BADGES[status] || BADGES.PENDING;
  return <span className={`border px-2 py-0.5 text-[10px] font-bold ${style}`}>{label}</span>;
}

export default function NegotiationDesk() {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [actionError, setActionError] = useState("");
  const chatEndRef = useRef(null);

  const { data: allOffers = [], isLoading, isError } = useOffers();
  const sendMessage = useSendMessage();
  const updateOffer = useUpdateOffer();

  // Cada usuário só enxerga as negociações em que participa.
  const offers = user
    ? allOffers.filter((o) => o.buyer_id === user.id || o.seller_id === user.id)
    : [];
  const selectedOffer = offers.find((o) => o.id === selectedId) || offers[0] || null;
  const { data: messages = [] } = useMessages(selectedOffer?.id);

  const chatForm = useForm({ resolver: zodResolver(chatSchema), defaultValues: { text: "" } });
  const counterForm = useForm({ resolver: zodResolver(priceSchema), defaultValues: { price: "" } });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) return <Navigate to="/login" replace />;

  const isClosed = selectedOffer?.status === "ACCEPTED" || selectedOffer?.status === "REJECTED";
  const isMyLastAction = selectedOffer?.last_action_by === user.id;
  const canAccept = !isClosed && !isMyLastAction; // impede o auto-aceite

  const onSendMessage = async ({ text }) => {
    if (!selectedOffer || isClosed) return;
    setActionError("");
    try {
      await sendMessage.mutateAsync({
        id: newId("MSG"),
        offer_id: selectedOffer.id,
        sender_id: user.id,
        sender_handle: user.handle,
        text,
        timestamp: new Date().toISOString(),
      });
      chatForm.reset();
    } catch (err) {
      setActionError(err.message || "Não foi possível enviar a mensagem.");
    }
  };

  const changeOffer = async (status, newPrice = null) => {
    if (!selectedOffer || isClosed) return;
    setActionError("");

    const note = newPrice
      ? `[SISTEMA]: Contraproposta enviada no valor de R$ ${Number(newPrice).toFixed(2)}`
      : `[SISTEMA]: Proposta ${status === "ACCEPTED" ? "ACEITA" : "RECUSADA"} por ${user.handle}`;

    try {
      await updateOffer.mutateAsync({
        id: selectedOffer.id,
        patch: {
          status,
          last_action_by: user.id,
          updated_at: new Date().toISOString(),
          ...(newPrice ? { offered_price: Number(newPrice) } : {}),
        },
        systemMessage: {
          id: newId("SYS"),
          offer_id: selectedOffer.id,
          sender_id: "SYSTEM",
          sender_handle: "PROTOCOL_BOT",
          text: note,
          timestamp: new Date().toISOString(),
        },
      });
      setShowCounterModal(false);
      counterForm.reset();
    } catch (err) {
      setActionError(err.message || "Erro ao atualizar estado da negociação.");
    }
  };

  const actionBtn = (enabled, enabledClass) =>
    `font-bold text-[10px] px-3 py-1.5 chamfer-tag transition-all ${
      enabled ? enabledClass : "bg-noir-950 border border-slate-800 text-slate-600 cursor-not-allowed"
    }`;

  return (
    <div className="min-h-screen pb-28 text-slate-100 bg-noir-950 font-code">
      <Header
        title="NEGOTIATION"
        titleHighlight="DESK"
        subtitle="MESA DE NEGOCIAÇÃO P2P // CANAL DE PROPOSTAS"
        backLink="/"
        backText="<< FEED"
        badgeText="SESSÃO_ATIVA"
        badgeType="cyan"
      />

      <main className="max-w-5xl mx-auto px-4 pt-4">
        {(isError || actionError) && (
          <div role="alert" className="mb-4 bg-noir-900 border-2 border-neon-pink p-3 chamfer-box text-xs text-neon-pink font-bold">
            ⚠ {actionError || "Falha ao carregar a central de negociações."}
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs tracking-widest animate-pulse">
            CARREGANDO_PROTOCOLOS_DE_NEGOCIAÇÃO...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <section className="bg-noir-900 border-2 border-slate-700 p-3 chamfer-box space-y-3">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-700 pb-2">
                // SALAS DE NEGOCIAÇÃO ({offers.length})
              </h2>

              {offers.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Nenhuma negociação em aberto.</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {offers.map((off) => (
                    <div
                      key={off.id}
                      onClick={() => setSelectedId(off.id)}
                      className={`p-3 border-2 transition-all cursor-pointer chamfer-box ${
                        selectedOffer?.id === off.id ? "bg-noir-800 border-neon-cyan shadow-md" : "bg-noir-950 border-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-black text-slate-100 truncate max-w-[140px]">{off.product_title}</span>
                        <StatusBadge status={off.status} />
                      </div>
                      <div className="text-[11px] text-slate-400 flex justify-between items-center mt-2">
                        <span>OFERTA: <strong className="text-neon-mint">R$ {off.offered_price}</strong></span>
                        <span className="text-[9px] text-slate-500">{off.buyer_handle}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="md:col-span-2 bg-noir-900 border-2 border-slate-700 p-4 chamfer-box flex flex-col h-[580px]">
              {selectedOffer ? (
                <>
                  <div className="border-b border-slate-700 pb-3 mb-3 flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-extrabold text-white">{selectedOffer.product_title}</h3>
                        <StatusBadge status={selectedOffer.status} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        VALOR DE ANÚNCIO: <span className="line-through text-slate-500">R$ {selectedOffer.original_price}</span>{" "}
                        | PROPOSTA: <strong className="text-neon-cyan">R$ {selectedOffer.offered_price}</strong>
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button type="button" onClick={() => changeOffer("ACCEPTED")} disabled={updateOffer.isPending || !canAccept}
                        title={isMyLastAction ? "Você não pode aceitar a própria proposta" : ""}
                        className={actionBtn(canAccept, "bg-neon-mint hover:bg-neon-mint/90 text-noir-950 shadow-md cursor-pointer font-black")}>
                        ACEITAR
                      </button>
                      <button type="button" onClick={() => setShowCounterModal(true)} disabled={updateOffer.isPending || isClosed}
                        className={actionBtn(!isClosed, "bg-noir-800 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 cursor-pointer")}>
                        CONTRAPROPOSTA
                      </button>
                      <button type="button" onClick={() => changeOffer("REJECTED")} disabled={updateOffer.isPending || isClosed}
                        className={actionBtn(!isClosed, "bg-noir-800 border border-neon-pink text-neon-pink hover:bg-neon-pink/10 cursor-pointer")}>
                        RECUSAR
                      </button>
                    </div>
                  </div>

                  {isMyLastAction && !isClosed && (
                    <div className="mb-2 bg-noir-950 border border-neon-cyan/50 px-3 py-1 text-[11px] text-neon-cyan">
                      ℹ Você enviou a última proposta/alteração. Aguardando a resposta da outra parte.
                    </div>
                  )}

                  {isClosed && (
                    <div className={`mb-2 bg-noir-950 border px-3 py-1 text-[11px] font-bold ${selectedOffer.status === "ACCEPTED" ? "border-neon-mint text-neon-mint" : "border-neon-pink text-neon-pink"}`}>
                      🔒 NEGOCIAÇÃO ENCERRADA [{selectedOffer.status === "ACCEPTED" ? "OFERTA ACEITA" : "OFERTA RECUSADA"}]. O CHAT ESTÁ EM MODO SOMENTE LEITURA.
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-noir-950 border border-slate-800 mb-3">
                    {messages.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">Nenhuma mensagem registrada.</p>
                    ) : (
                      messages.map((msg) => {
                        if (msg.sender_id === "SYSTEM") {
                          return (
                            <div key={msg.id} className="text-center py-1">
                              <span className="text-[10px] bg-noir-800 border border-slate-700 text-slate-300 px-2.5 py-0.5 font-bold">{msg.text}</span>
                            </div>
                          );
                        }
                        const isMe = msg.sender_id === user.id;
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <span className="text-[9px] text-slate-400 mb-0.5">{msg.sender_handle}</span>
                            <div className={`p-2.5 text-xs max-w-[80%] leading-relaxed ${isMe ? "bg-neon-cyan/20 border border-neon-cyan text-slate-100" : "bg-noir-800 border border-slate-700 text-slate-200"}`}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={chatForm.handleSubmit(onSendMessage)} noValidate className="flex gap-2">
                    <input
                      type="text"
                      aria-label="Mensagem"
                      disabled={isClosed}
                      placeholder={isClosed ? "Negociação encerrada..." : "Digite sua mensagem de negociação..."}
                      {...chatForm.register("text")}
                      className="flex-1 bg-noir-950 border-2 border-slate-600 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button type="submit" disabled={sendMessage.isPending || isClosed}
                      className="bg-neon-cyan hover:bg-neon-cyan/90 text-noir-950 font-extrabold text-xs px-4 py-2 chamfer-box transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      {sendMessage.isPending ? "ENVIANDO..." : "ENVIAR >>"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-xs text-center">
                  NENHUMA NEGOCIAÇÃO SELECIONADA. ENVIE UMA PROPOSTA EM UM ANÚNCIO PARA ABRIR UM CANAL.
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {showCounterModal && selectedOffer && (
        <div className="fixed inset-0 z-50 bg-noir-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={counterForm.handleSubmit(({ price }) => changeOffer("COUNTER_OFFER", price))} noValidate
            className="bg-noir-900 border-2 border-neon-cyan p-5 max-w-xs w-full chamfer-box space-y-4 shadow-2xl">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">NOVA CONTRAPROPOSTA</h3>
            <p className="text-[11px] text-slate-300">Valor de anúncio: R$ {selectedOffer.original_price}</p>
            <div>
              <label htmlFor="counter-price" className="block text-[10px] text-slate-400 mb-1">NOVO VALOR PROPOSTO (R$)</label>
              <input id="counter-price" type="number" step="0.01" placeholder="Ex: 280.00" {...counterForm.register("price")}
                className="w-full bg-noir-950 border-2 border-slate-600 p-2 text-slate-100 text-xs focus:outline-none focus:border-neon-cyan" />
              <FieldError error={counterForm.formState.errors.price} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowCounterModal(false); counterForm.reset(); }}
                className="flex-1 py-2 bg-noir-800 text-slate-300 border border-slate-600 text-xs font-bold">
                CANCELAR
              </button>
              <button type="submit" disabled={updateOffer.isPending} className="flex-1 py-2 bg-neon-cyan text-noir-950 text-xs font-black disabled:opacity-50">
                ENVIAR
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
