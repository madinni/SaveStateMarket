// src/pages/NegotiationDesk.jsx
import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import { useAuth, API_URL } from "../context/AuthContext";

export default function NegotiationDesk() {
  const { user } = useAuth();
  const currentUserId = user?.id || "GUEST_USER";

  // Estados
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [counterPriceInput, setCounterPriceInput] = useState("");
  const [showCounterModal, setShowCounterModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [updatingOffer, setUpdatingOffer] = useState(false);
  const [error, setError] = useState(null);

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/offers`);
      if (!response.ok)
        throw new Error(`Erro ao buscar ofertas (HTTP ${response.status})`);
      const data = await response.json();

      setOffers(data);
      if (data.length > 0 && !selectedOffer) {
        setSelectedOffer(data[0]);
      }
    } catch (err) {
      console.error("[OFFERS_FETCH_ERROR]:", err);
      setError("Falha ao carregar a central de negociações.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (offerId) => {
    if (!offerId) return;
    try {
      const response = await fetch(`${API_URL}/messages?offer_id=${offerId}`);
      if (!response.ok)
        throw new Error(`Erro ao buscar mensagens (HTTP ${response.status})`);
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      console.error("[MESSAGES_FETCH_ERROR]:", err);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    if (selectedOffer) {
      fetchMessages(selectedOffer.id);
    }
  }, [selectedOffer]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Regras de Negócio / Permissões do Usuário
  const isClosed =
    selectedOffer?.status === "ACCEPTED" ||
    selectedOffer?.status === "REJECTED";
  const isMyLastAction = selectedOffer?.last_action_by === currentUserId;
  const canAccept = !isClosed && !isMyLastAction; // Impedir auto-aceite
  const canCounter = !isClosed;
  const canReject = !isClosed;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedOffer || sendingMsg || isClosed) return;

    setSendingMsg(true);
    const newMsgPayload = {
      id: `MSG-${Date.now().toString(36).toUpperCase()}`,
      offer_id: selectedOffer.id,
      sender_id: currentUserId,
      sender_handle: user?.handle || "@Visitante",
      text: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsgPayload),
      });

      if (!response.ok) throw new Error("Falha ao registrar mensagem");
      const savedMsg = await response.json();

      setMessages((prev) => [...prev, savedMsg]);
      setChatInput("");
    } catch (err) {
      console.error("[SEND_MSG_ERROR]:", err);
      alert("Não foi possível enviar a mensagem.");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleUpdateOfferStatus = async (newStatus, newPrice = null) => {
    if (!selectedOffer || updatingOffer || isClosed) return;

    setUpdatingOffer(true);
    const updatePayload = {
      status: newStatus,
      last_action_by: currentUserId,
      updated_at: new Date().toISOString(),
    };

    if (newPrice) {
      updatePayload.offered_price = Number(newPrice);
    }

    try {
      const response = await fetch(`${API_URL}/offers/${selectedOffer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) throw new Error("Erro ao atualizar estado");
      const updatedData = await response.json();

      setSelectedOffer(updatedData);
      setOffers((prev) =>
        prev.map((off) => (off.id === updatedData.id ? updatedData : off)),
      );

      let systemNote = `[SISTEMA]: Proposta ${newStatus === "ACCEPTED" ? "ACEITA" : "RECUSADA"} por ${user?.handle || "@Operador"}`;
      if (newPrice)
        systemNote = `[SISTEMA]: Nova contraproposta registrada no valor de R$ ${Number(newPrice).toFixed(2)}`;

      await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `SYS-${Date.now().toString(36).toUpperCase()}`,
          offer_id: selectedOffer.id,
          sender_id: "SYSTEM",
          sender_handle: "PROTOCOL_BOT",
          text: systemNote,
          timestamp: new Date().toISOString(),
        }),
      });

      fetchMessages(selectedOffer.id);
      setShowCounterModal(false);
      setCounterPriceInput("");
    } catch (err) {
      console.error("[UPDATE_OFFER_ERROR]:", err);
      alert("Erro ao atualizar estado da negociação.");
    } finally {
      setUpdatingOffer(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="text-neon-mint bg-neon-mint/10 border border-neon-mint px-2 py-0.5 text-[10px] font-bold">
            [ACEITO]
          </span>
        );
      case "REJECTED":
        return (
          <span className="text-neon-pink bg-neon-pink/10 border border-neon-pink px-2 py-0.5 text-[10px] font-bold">
            [RECUSADO]
          </span>
        );
      case "COUNTER_OFFER":
        return (
          <span className="text-neon-cyan bg-neon-cyan/10 border border-neon-cyan px-2 py-0.5 text-[10px] font-bold">
            [CONTRAPROPOSTA]
          </span>
        );
      default:
        return (
          <span className="text-yellow-400 bg-yellow-400/10 border border-yellow-400 px-2 py-0.5 text-[10px] font-bold">
            [PENDENTE]
          </span>
        );
    }
  };

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
        {error && (
          <div className="mb-4 bg-noir-900 border-2 border-neon-pink p-3 chamfer-box text-xs text-neon-pink font-bold">
            ⚠ {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs tracking-widest animate-pulse">
            CARREGANDO_PROTOCOLOS_DE_NEGOCIAÇÃO...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* LISTA DE OFERTAS */}
            <section className="bg-noir-900 border-2 border-slate-700 p-3 chamfer-box space-y-3">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-700 pb-2">
                // SALAS DE NEGOCIAÇÃO ({offers.length})
              </h2>

              {offers.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Nenhuma negociação em aberto.
                </p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {offers.map((off) => {
                    const isSelected = selectedOffer?.id === off.id;
                    return (
                      <div
                        key={off.id}
                        onClick={() => setSelectedOffer(off)}
                        className={`p-3 border-2 transition-all cursor-pointer chamfer-box ${
                          isSelected
                            ? "bg-noir-800 border-neon-cyan shadow-md"
                            : "bg-noir-950 border-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-black text-slate-100 truncate max-w-[140px]">
                            {off.product_title}
                          </span>
                          {getStatusBadge(off.status)}
                        </div>
                        <div className="text-[11px] text-slate-400 flex justify-between items-center mt-2">
                          <span>
                            OFERTA:{" "}
                            <strong className="text-neon-mint">
                              R$ {off.offered_price}
                            </strong>
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {off.buyer_handle}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* CHAT & AÇÕES */}
            <section className="md:col-span-2 bg-noir-900 border-2 border-slate-700 p-4 chamfer-box flex flex-col h-[580px]">
              {selectedOffer ? (
                <>
                  {/* HEADER DO DETALHE DA OFERTA */}
                  <div className="border-b border-slate-700 pb-3 mb-3 flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-extrabold text-white">
                          {selectedOffer.product_title}
                        </h3>
                        {getStatusBadge(selectedOffer.status)}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        VALOR DE ANÚNCIO:{" "}
                        <span className="line-through text-slate-500">
                          R$ {selectedOffer.original_price}
                        </span>{" "}
                        | PROPOSTA:{" "}
                        <strong className="text-neon-cyan">
                          R$ {selectedOffer.offered_price}
                        </strong>
                      </p>
                    </div>

                    {/* PAINEL DE BOTÕES DE AÇÃO */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateOfferStatus("ACCEPTED")}
                        disabled={updatingOffer || !canAccept}
                        title={
                          isMyLastAction
                            ? "Você não pode aceitar a própria proposta"
                            : ""
                        }
                        className={`font-black text-[10px] px-3 py-1.5 chamfer-tag transition-all ${
                          canAccept
                            ? "bg-neon-mint hover:bg-neon-mint/90 text-noir-950 shadow-md cursor-pointer"
                            : "bg-noir-950 border border-slate-800 text-slate-600 cursor-not-allowed"
                        }`}
                      >
                        ACEITAR
                      </button>

                      <button
                        onClick={() => setShowCounterModal(true)}
                        disabled={updatingOffer || !canCounter}
                        className={`font-bold text-[10px] px-3 py-1.5 chamfer-tag transition-all ${
                          canCounter
                            ? "bg-noir-800 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 cursor-pointer"
                            : "bg-noir-950 border border-slate-800 text-slate-600 cursor-not-allowed"
                        }`}
                      >
                        CONTRAPROPOSTA
                      </button>

                      <button
                        onClick={() => handleUpdateOfferStatus("REJECTED")}
                        disabled={updatingOffer || !canReject}
                        className={`font-bold text-[10px] px-3 py-1.5 chamfer-tag transition-all ${
                          canReject
                            ? "bg-noir-800 border border-neon-pink text-neon-pink hover:bg-neon-pink/10 cursor-pointer"
                            : "bg-noir-950 border border-slate-800 text-slate-600 cursor-not-allowed"
                        }`}
                      >
                        RECUSAR
                      </button>
                    </div>
                  </div>

                  {/* AVISO DE ESTADO / REGRAS DA NEGOCIAÇÃO */}
                  {isMyLastAction && !isClosed && (
                    <div className="mb-2 bg-noir-950 border border-neon-cyan/50 px-3 py-1 text-[11px] text-neon-cyan">
                      ℹ Você enviou a última proposta/alteração. Aguardando a
                      resposta da outra parte.
                    </div>
                  )}

                  {isClosed && (
                    <div
                      className={`mb-2 bg-noir-950 border px-3 py-1 text-[11px] font-bold ${
                        selectedOffer.status === "ACCEPTED"
                          ? "border-neon-mint text-neon-mint"
                          : "border-neon-pink text-neon-pink"
                      }`}
                    >
                      🔒 NEGOCIAÇÃO ENCERRADA [
                      {selectedOffer.status === "ACCEPTED"
                        ? "OFERTA ACEITA"
                        : "OFERTA RECUSADA"}
                      ]. O CHAT ESTÁ EM MODO SOMENTE LEITURA.
                    </div>
                  )}

                  {/* MENSAGENS DO CHAT */}
                  <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-noir-950 border border-slate-800 mb-3">
                    {messages.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">
                        Nenhuma mensagem registrada.
                      </p>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender_id === currentUserId;
                        const isSystem = msg.sender_id === "SYSTEM";

                        if (isSystem) {
                          return (
                            <div key={msg.id} className="text-center py-1">
                              <span className="text-[10px] bg-noir-800 border border-slate-700 text-slate-300 px-2.5 py-0.5 font-bold">
                                {msg.text}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <span className="text-[9px] text-slate-400 mb-0.5">
                              {msg.sender_handle}
                            </span>
                            <div
                              className={`p-2.5 text-xs max-w-[80%] leading-relaxed ${
                                isMe
                                  ? "bg-neon-cyan/20 border border-neon-cyan text-slate-100"
                                  : "bg-noir-800 border border-slate-700 text-slate-200"
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* FORMULÁRIO DE ENVIO */}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      disabled={isClosed}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={
                        isClosed
                          ? "Negociação encerrada..."
                          : "Digite sua mensagem de negociação..."
                      }
                      className="flex-1 bg-noir-950 border-2 border-slate-600 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={sendingMsg || !chatInput.trim() || isClosed}
                      className="bg-neon-cyan hover:bg-neon-cyan/90 text-noir-950 font-extrabold text-xs px-4 py-2 chamfer-box transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {sendingMsg ? "ENVIANDO..." : "ENVIAR >>"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                  SELECIONE UMA NEGOCIAÇÃO À ESQUERDA PARA ABRIR O CANAL.
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* MODAL DE CONTRAPROPOSTA */}
      {showCounterModal && selectedOffer && (
        <div className="fixed inset-0 z-50 bg-noir-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-noir-900 border-2 border-neon-cyan p-5 max-w-xs w-full chamfer-box space-y-4 shadow-2xl">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              NOVA CONTRAPROPOSTA
            </h3>
            <p className="text-[11px] text-slate-300">
              Valor de anúncio: R$ {selectedOffer.original_price}
            </p>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                NOVO VALOR PROPOSTO (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={counterPriceInput}
                onChange={(e) => setCounterPriceInput(e.target.value)}
                placeholder="Ex: 280.00"
                className="w-full bg-noir-950 border-2 border-slate-600 p-2 text-slate-100 text-xs focus:outline-none focus:border-neon-cyan"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCounterModal(false)}
                className="flex-1 py-2 bg-noir-800 text-slate-300 border border-slate-600 text-xs font-bold"
              >
                CANCELAR
              </button>
              <button
                onClick={() =>
                  handleUpdateOfferStatus("COUNTER_OFFER", counterPriceInput)
                }
                disabled={!counterPriceInput || updatingOffer}
                className="flex-1 py-2 bg-neon-cyan text-noir-950 text-xs font-black disabled:opacity-50"
              >
                ENVIAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
