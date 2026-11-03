import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "../components/Header";
import FieldError from "../components/FieldError";
import OwnerActions from "../components/OwnerActions";
import PriceBenchmark from "../components/PriceBenchmark";
import PriceAlertBox from "../components/PriceAlertBox";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useProduct } from "../hooks/useProducts";
import { useCreateOffer } from "../hooks/useOffers";
import { useCreateReport } from "../hooks/useReports";
import { offerSchema, reportSchema, REPORT_REASONS } from "../schemas";

const REPORT_DEFAULTS = { reason: "", details: "" };

const newId = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isProfileSynced } = useAuth();
  const { addItem } = useCart();

  const { data: product, isLoading, isError, error } = useProduct(id);
  const createOffer = useCreateOffer();
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [actionError, setActionError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(offerSchema),
    defaultValues: { price: "", message: "" },
  });

  // Denúncia do anúncio (UC15): formulário separado do de proposta.
  const createReport = useCreateReport();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportNotice, setReportNotice] = useState("");
  const reportForm = useForm({ resolver: zodResolver(reportSchema), defaultValues: REPORT_DEFAULTS });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-noir-950 text-slate-400 font-code flex items-center justify-center p-8">
        <span className="animate-pulse tracking-widest text-xs">// CARREGANDO_DOSSIÊ_DE_MÍDIA...</span>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-noir-950 font-code p-8 text-center text-xs space-y-4">
        <div role="alert" className="bg-noir-900 border-2 border-neon-pink p-4 chamfer-box text-neon-pink max-w-md mx-auto">
          ⚠ {error?.message || "REGISTRO DE PRODUTO NÃO ENCONTRADO"}
        </div>
        <Link to="/" className="inline-block text-neon-cyan hover:underline font-bold">&lt;&lt; VOLTAR AO CATÁLOGO</Link>
      </div>
    );
  }

  const productPrice = Number(product.price ?? 0);
  const conditionTag = product.condition_tag || null;
  const hasBox = product.has_box ?? false;
  const hasManual = product.has_manual ?? false;
  const isFunctional = product.is_functional ?? true;

  const description = [
    conditionTag ? `ESTADO DE CONSERVAÇÃO: ${conditionTag}` : null,
    hasBox ? "Inclui caixa original do lote" : "Apenas o cartucho/mídia (Loose)",
    hasManual ? "Acompanha manual de instruções impresso" : "Sem manual incluso",
    isFunctional ? "Item 100% testado e funcional" : "Necessita de reparos / manutenção",
  ]
    .filter(Boolean)
    .join(" • ");

  const buyerId = user?.id;
  const isRefundBlocked = user?.account_status === "refund_pending";
  const isOwner =
    Boolean(user) &&
    (String(product.seller_id) === String(user.id) || product.seller_handle === user.handle);

  const buildOffer = (offeredPrice, status) => ({
    id: newId("OFF"),
    product_id: product.id,
    product_title: product.title,
    original_price: productPrice,
    offered_price: Number(offeredPrice),
    buyer_id: buyerId,
    buyer_handle: user.handle,
    seller_id: product.seller_id || null,
    seller_handle: product.seller_handle,
    status,
    last_action_by: buyerId,
    updated_at: new Date().toISOString(),
  });

  const buildMessage = (offerId, text, system = false) => ({
    id: newId(system ? "SYS" : "MSG"),
    offer_id: offerId,
    sender_id: system ? "SYSTEM" : buyerId,
    sender_handle: system ? "PROTOCOL_BOT" : user.handle,
    text,
    timestamp: new Date().toISOString(),
  });

  const requireLogin = () => {
    if (user) return true;
    navigate("/login");
    return false;
  };

  const onSubmitOffer = async ({ price, message }) => {
    if (!isProfileSynced || !requireLogin() || isOwner) return;
    if (isRefundBlocked) {
      setActionError("Conta bloqueada até a quitação do reembolso PIX pendente.");
      return;
    }
    setActionError("");
    const offer = buildOffer(price, "PENDING");
    try {
      await createOffer.mutateAsync({
        offer,
        firstMessage: buildMessage(
          offer.id,
          message?.trim() || `Proposta enviada no valor de R$ ${Number(price).toFixed(2)}`,
        ),
      });
      navigate("/offers");
    } catch (err) {
      setActionError(err.message || "Erro ao iniciar negociação.");
    }
  };

  const handleDirectBuy = () => {
    if (!isProfileSynced || !requireLogin() || isOwner) return;
    if (isRefundBlocked) {
      setActionError("Conta bloqueada até a quitação do reembolso PIX pendente.");
      return;
    }
    addItem(product);
    navigate("/checkout");
  };

  const closeModal = () => {
    setShowOfferModal(false);
    reset({ price: "", message: "" });
  };

  const openReport = () => {
    if (!requireLogin() || isOwner) return;
    setReportError("");
    setShowReportModal(true);
  };

  const closeReport = () => {
    setShowReportModal(false);
    setReportError("");
    reportForm.reset(REPORT_DEFAULTS);
  };

  const onSubmitReport = async ({ reason, details }) => {
    setReportError("");
    try {
      await createReport.mutateAsync({ product_id: String(product.id), reason, ...(details ? { details } : {}) });
      closeReport();
      setReportNotice("Denúncia enviada. A moderação vai analisar este anúncio.");
    } catch (err) {
      // 409: já denunciado; 403: anúncio próprio; 404: anúncio removido. A mensagem vem do servidor.
      if (err.field && err.field in REPORT_DEFAULTS) reportForm.setError(err.field, { message: err.message });
      else setReportError(err.message || "Não foi possível enviar a denúncia.");
    }
  };

  const tag = (active, onClass) =>
    `border text-[10px] px-2 py-1 font-bold bg-noir-950 ${active ? onClass : "border-slate-800 text-slate-500"}`;

  return (
    <div className="min-h-screen pb-28 text-slate-100 bg-noir-950 font-code">
      <Header title="ASSET" titleHighlight="DOSSIER" subtitle="IDENTIFICAÇÃO DE MÍDIA // DOSSIÊ TÉCNICO" backLink="/" backText="<< FEED" />

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        <div className="bg-noir-900 border-2 border-slate-700 p-5 chamfer-box space-y-4 shadow-xl">
          <div className="relative border-2 border-slate-800 bg-noir-950 h-64 flex items-center justify-center overflow-hidden">
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} className="max-h-full object-contain p-2" />
            ) : (
              <span className="text-slate-600 text-xs">// NENHUMA_IMAGEM_DISPONÍVEL</span>
            )}
            <span className="absolute top-2 right-2 bg-noir-900 border border-slate-700 text-neon-cyan text-[10px] px-2.5 py-1 font-bold">
              {product.platform || "RETRO"}
            </span>
          </div>

          <div>
            <div className="flex justify-between items-start gap-2">
              <h1 className="text-lg font-black text-white">{product.title}</h1>
              <span className="text-lg font-extrabold text-neon-mint whitespace-nowrap">R$ {productPrice.toFixed(2)}</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {conditionTag && <span className="bg-noir-950 border border-neon-pink text-neon-pink text-[10px] px-2 py-1 font-bold">{conditionTag}</span>}
              <span className={tag(hasBox, "border-neon-mint text-neon-mint")}>{hasBox ? "[+CAIXA ORIGINAL]" : "[-SEM CAIXA]"}</span>
              <span className={tag(hasManual, "border-neon-mint text-neon-mint")}>{hasManual ? "[+MANUAL]" : "[-SEM MANUAL]"}</span>
              <span className={tag(true, isFunctional ? "border-neon-cyan text-neon-cyan" : "border-neon-pink text-neon-pink")}>
                {isFunctional ? "[100% OPERACIONAL]" : "[REQUER REPARO]"}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed bg-noir-950 p-3 border border-slate-800">{description}</p>
          </div>

          <PriceBenchmark product={product} />

          <div className="bg-noir-950 p-3 border border-slate-800 text-xs flex justify-between items-center">
            <span className="text-slate-400">
              OPERADOR ANUNCIANTE:{" "}
              <Link to={`/profile?handle=${encodeURIComponent(product.seller_handle || "")}`} className="font-bold text-neon-cyan hover:underline">
                {product.seller_handle || "@Operador"}
              </Link>
            </span>
            {isOwner && (
              <span className="bg-neon-pink/20 text-neon-pink border border-neon-pink px-2 py-0.5 text-[9px] font-bold">SEU ANÚNCIO</span>
            )}
          </div>

          {actionError && (
            <p role="alert" className="text-xs font-bold text-neon-pink">⚠ {actionError}</p>
          )}
          {isRefundBlocked && (
            <p role="alert" className="text-xs text-neon-amber">
              Conta bloqueada para compras enquanto houver reembolso pendente. Consulte seu <Link to="/profile" className="text-neon-cyan underline">perfil</Link>.
            </p>
          )}

          {!isOwner && <PriceAlertBox product={product} />}

          <div className="pt-2">
            {isOwner ? (
              <OwnerActions product={product} />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={handleDirectBuy} disabled={!isProfileSynced || createOffer.isPending || isRefundBlocked}
                  className="py-3 bg-neon-mint hover:bg-neon-mint/90 text-noir-950 font-black text-xs uppercase chamfer-box tracking-wider cursor-pointer shadow-md disabled:opacity-50">
                  COMPRAR AGORA
                </button>
                <button type="button" onClick={() => (isProfileSynced && requireLogin() && !isRefundBlocked ? setShowOfferModal(true) : null)} disabled={!isProfileSynced || createOffer.isPending || isRefundBlocked}
                  className="py-3 bg-noir-800 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 font-black text-xs uppercase chamfer-box tracking-wider cursor-pointer disabled:opacity-50">
                  ENVIAR PROPOSTA
                </button>
              </div>
            )}
          </div>

          {!isOwner && (
            <div className="border-t border-slate-800 pt-3 space-y-2">
              {reportNotice && (
                <p role="status" className="text-[11px] font-bold text-neon-mint">✓ {reportNotice}</p>
              )}
              <button type="button" onClick={openReport} disabled={!isProfileSynced}
                className="w-full py-2.5 bg-noir-950 border border-neon-pink/60 text-neon-pink hover:bg-neon-pink/10 text-[10px] font-bold uppercase chamfer-tag tracking-widest disabled:opacity-50">
                ⚑ DENUNCIAR ANÚNCIO
              </button>
            </div>
          )}
        </div>
      </main>

      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-noir-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit(onSubmitOffer)} noValidate
            className="bg-noir-900 border-2 border-neon-cyan p-5 max-w-sm w-full chamfer-box space-y-4 shadow-2xl">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">ABRIR CANAL // {product.title}</h3>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">VALOR DO ANÚNCIO</label>
              <input type="text" disabled value={`R$ ${productPrice.toFixed(2)}`}
                className="w-full bg-noir-950 border border-slate-800 p-2 text-slate-500 text-xs font-bold" />
            </div>

            <div>
              <label htmlFor="offer-price" className="block text-[10px] text-slate-400 mb-1">SUA PROPOSTA (R$)</label>
              <input id="offer-price" type="number" step="0.01" {...register("price")}
                className="w-full bg-noir-950 border-2 border-slate-600 p-2 text-slate-100 text-xs font-bold focus:outline-none focus:border-neon-cyan" />
              <FieldError error={errors.price} />
            </div>

            <div>
              <label htmlFor="offer-message" className="block text-[10px] text-slate-400 mb-1">MENSAGEM INICIAL (OPCIONAL)</label>
              <textarea id="offer-message" rows="2" placeholder="Ex: Aceita entregar em mãos?" {...register("message")}
                className="w-full bg-noir-950 border-2 border-slate-600 p-2 text-slate-100 text-xs focus:outline-none focus:border-neon-cyan resize-none" />
              <FieldError error={errors.message} />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={closeModal} className="flex-1 py-2 bg-noir-800 text-slate-300 border border-slate-600 text-xs font-bold">
                CANCELAR
              </button>
              <button type="submit" disabled={createOffer.isPending} className="flex-1 py-2 bg-neon-cyan text-noir-950 text-xs font-black disabled:opacity-50">
                {createOffer.isPending ? "ENVIANDO..." : "INICIAR CHAT"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-noir-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={reportForm.handleSubmit(onSubmitReport)} noValidate role="dialog" aria-modal="true" aria-labelledby="report-title"
            className="bg-noir-900 border-2 border-neon-pink p-5 max-w-sm w-full chamfer-box glow-pink space-y-4 shadow-2xl">
            <div>
              <h3 id="report-title" className="text-xs font-black text-white uppercase tracking-wider">DENUNCIAR // {product.title}</h3>
              <p className="mt-1 text-[10px] text-slate-400">A denúncia vai para a moderação. O vendedor não vê quem denunciou.</p>
            </div>

            <div>
              <label htmlFor="report-reason" className="block text-[10px] text-slate-400 mb-1">MOTIVO *</label>
              <select id="report-reason" {...reportForm.register("reason")}
                className="w-full h-10 bg-noir-950 border-2 border-slate-600 px-2 text-slate-100 text-xs focus:outline-none focus:border-neon-pink">
                <option value="">Selecione...</option>
                {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <FieldError error={reportForm.formState.errors.reason} />
            </div>

            <div>
              <label htmlFor="report-details" className="block text-[10px] text-slate-400 mb-1">DETALHES (OPCIONAL)</label>
              <textarea id="report-details" rows="3" maxLength={500} placeholder="Ex: as fotos são de outro anúncio."
                {...reportForm.register("details")}
                className="w-full bg-noir-950 border-2 border-slate-600 p-2 text-slate-100 text-xs focus:outline-none focus:border-neon-pink resize-none" />
              <FieldError error={reportForm.formState.errors.details} />
            </div>

            {reportError && <p role="alert" className="text-[11px] font-bold text-neon-pink">⚠ {reportError}</p>}

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={closeReport} className="flex-1 py-2 bg-noir-800 text-slate-300 border border-slate-600 text-xs font-bold">
                CANCELAR
              </button>
              <button type="submit" disabled={createReport.isPending} className="flex-1 py-2 bg-neon-pink text-white text-xs font-black disabled:opacity-50">
                {createReport.isPending ? "ENVIANDO..." : "ENVIAR DENÚNCIA"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}