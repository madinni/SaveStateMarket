// src/pages/ProductDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import { useAuth, API_URL } from "../context/AuthContext";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados dos Modais de Negociação / Compra
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [initialMsg, setInitialMsg] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        let response = await fetch(`${API_URL}/products/${id}`);

        if (!response.ok) {
          const listRes = await fetch(`${API_URL}/products`);
          if (!listRes.ok)
            throw new Error("Falha ao conectar com o banco de dados.");
          const allProducts = await listRes.json();
          const found = allProducts.find((p) => String(p.id) === String(id));

          if (!found) throw new Error(`Produto #${id} não localizado.`);
          setProduct(found);
          setOfferPrice(found.price || found.preco || "");
          return;
        }

        const data = await response.json();
        setProduct(data);
        setOfferPrice(data.price || data.preco || "");
      } catch (err) {
        console.error("[PRODUCT_FETCH_ERROR]:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  // Mapeamento defensivo do produto
  const productTitle = product?.title || product?.name || "Mídia Retrô";
  const productPrice = product?.price ?? 0;
  const productImage = product?.image_url || product?.image || "";
  const productPlatform = product?.platform || "RETRO";
  const sellerHandle = product?.seller_handle || "@Operador";
  const sellerId = product?.seller_id || "USER-1";

  // Extração de propriedades técnicas retrô (presentes no db.json)
  const conditionTag = product?.condition_tag || null;
  const hasBox = product?.has_box ?? false;
  const hasManual = product?.has_manual ?? false;
  const isFunctional = product?.is_functional ?? true;

  // Descrição dinâmica caso o campo 'description' não exista no JSON
  const dynamicDescription =
    product?.description ||
    product?.descricao ||
    [
      conditionTag ? `ESTADO DE CONSERVAÇÃO: ${conditionTag}` : null,
      hasBox
        ? "Inclui caixa original do lote"
        : "Apenas o cartucho/mídia (Loose)",
      hasManual
        ? "Acompanha manual de instruções impresso"
        : "Sem manual incluso",
      isFunctional
        ? "Item 100% testado e funcional"
        : "Necessita de reparos / manutenção",
    ]
      .filter(Boolean)
      .join(" • ");

  const currentUserId = user?.id || "GUEST_USER";
  const isOwner =
    product &&
    (String(sellerId) === String(currentUserId) ||
      sellerHandle === user?.handle);

  // Criar Proposta
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (isOwner || processing || !offerPrice) return;

    setProcessing(true);
    const offerId = `OFF-${Date.now().toString(36).toUpperCase()}`;

    const offerPayload = {
      id: offerId,
      product_id: product.id,
      product_title: productTitle,
      original_price: Number(productPrice),
      offered_price: Number(offerPrice),
      buyer_id: currentUserId,
      buyer_handle: user?.handle || "@Visitante",
      seller_id: sellerId,
      status: "PENDING",
      last_action_by: currentUserId,
      updated_at: new Date().toISOString(),
    };

    try {
      const resOffer = await fetch(`${API_URL}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offerPayload),
      });
      if (!resOffer.ok) throw new Error("Falha ao registrar proposta");

      const initialText =
        initialMsg.trim() ||
        `Proposta enviada no valor de R$ ${Number(offerPrice).toFixed(2)}`;
      await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `MSG-${Date.now().toString(36).toUpperCase()}`,
          offer_id: offerId,
          sender_id: currentUserId,
          sender_handle: user?.handle || "@Visitante",
          text: initialText,
          timestamp: new Date().toISOString(),
        }),
      });

      navigate("/offers");
    } catch (err) {
      console.error("[CREATE_OFFER_ERROR]:", err);
      alert("Erro ao iniciar negociação.");
    } finally {
      setProcessing(false);
    }
  };

  // Compra Direta
  const handleDirectBuy = async () => {
    if (isOwner || processing) return;

    if (
      !window.confirm(
        `Confirmar compra imediata de "${productTitle}" por R$ ${productPrice}?`,
      )
    )
      return;

    setProcessing(true);
    const offerId = `OFF-${Date.now().toString(36).toUpperCase()}`;

    const offerPayload = {
      id: offerId,
      product_id: product.id,
      product_title: productTitle,
      original_price: Number(productPrice),
      offered_price: Number(productPrice),
      buyer_id: currentUserId,
      buyer_handle: user?.handle || "@Visitante",
      seller_id: sellerId,
      status: "ACCEPTED",
      last_action_by: currentUserId,
      updated_at: new Date().toISOString(),
    };

    try {
      await fetch(`${API_URL}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offerPayload),
      });

      await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `SYS-${Date.now().toString(36).toUpperCase()}`,
          offer_id: offerId,
          sender_id: "SYSTEM",
          sender_handle: "PROTOCOL_BOT",
          text: `[SISTEMA]: Compra direta confirmada no valor de R$ ${productPrice}.`,
          timestamp: new Date().toISOString(),
        }),
      });

      navigate("/offers");
    } catch (err) {
      console.error("[DIRECT_BUY_ERROR]:", err);
      alert("Erro ao processar compra direta.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-noir-950 text-slate-400 font-code flex items-center justify-center p-8">
        <span className="animate-pulse tracking-widest text-xs">
          // CARREGANDO_DOSSIÊ_DE_MÍDIA...
        </span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-noir-950 font-code p-8 text-center text-xs space-y-4">
        <div className="bg-noir-900 border-2 border-neon-pink p-4 chamfer-box text-neon-pink max-w-md mx-auto">
          ⚠ {error || "REGISTRO DE PRODUTO NÃO ENCONTRADO"}
        </div>
        <Link
          to="/"
          className="inline-block text-neon-cyan hover:underline font-bold"
        >
          &lt;&lt; VOLTAR AO CATÁLOGO
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 text-slate-100 bg-noir-950 font-code">
      <Header
        title="ASSET"
        titleHighlight="DOSSIER"
        subtitle="IDENTIFICAÇÃO DE MÍDIA // DOSSIÊ TÉCNICO"
        backLink="/"
        backText="<< FEED"
      />

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        <div className="bg-noir-900 border-2 border-slate-700 p-5 chamfer-box space-y-4 shadow-xl">
          {/* EXIBIÇÃO DE IMAGEM */}
          <div className="relative border-2 border-slate-800 bg-noir-950 h-64 flex items-center justify-center overflow-hidden">
            {productImage ? (
              <img
                src={productImage}
                alt={productTitle}
                className="max-h-full object-contain p-2"
              />
            ) : (
              <span className="text-slate-600 text-xs">
                // NENHUMA_IMAGEM_DISPONÍVEL
              </span>
            )}
            <span className="absolute top-2 right-2 bg-noir-900 border border-slate-700 text-neon-cyan text-[10px] px-2.5 py-1 font-bold">
              {productPlatform}
            </span>
          </div>

          {/* TÍTULO E PREÇO */}
          <div>
            <div className="flex justify-between items-start gap-2">
              <h1 className="text-lg font-black text-white">{productTitle}</h1>
              <span className="text-lg font-extrabold text-neon-mint whitespace-nowrap">
                R$ {Number(productPrice).toFixed(2)}
              </span>
            </div>

            {/* PAINEL DE METADADOS RETRÔ (TAGS TÉCNICAS) */}
            <div className="flex flex-wrap gap-2 mt-3">
              {conditionTag && (
                <span className="bg-noir-950 border border-neon-pink text-neon-pink text-[10px] px-2 py-1 font-bold">
                  {conditionTag}
                </span>
              )}
              <span
                className={`border text-[10px] px-2 py-1 font-bold ${
                  hasBox
                    ? "bg-noir-950 border-neon-mint text-neon-mint"
                    : "bg-noir-950 border-slate-800 text-slate-500"
                }`}
              >
                {hasBox ? "[+CAIXA ORIGINAL]" : "[-SEM CAIXA]"}
              </span>
              <span
                className={`border text-[10px] px-2 py-1 font-bold ${
                  hasManual
                    ? "bg-noir-950 border-neon-mint text-neon-mint"
                    : "bg-noir-950 border-slate-800 text-slate-500"
                }`}
              >
                {hasManual ? "[+MANUAL]" : "[-SEM MANUAL]"}
              </span>
              <span
                className={`border text-[10px] px-2 py-1 font-bold ${
                  isFunctional
                    ? "bg-noir-950 border-neon-cyan text-neon-cyan"
                    : "bg-noir-950 border-neon-pink text-neon-pink"
                }`}
              >
                {isFunctional ? "[100% OPERACIONAL]" : "[REQUER REPARO]"}
              </span>
            </div>

            {/* RELATÓRIO / DESCRIÇÃO DEDUZIDA */}
            <p className="text-xs text-slate-300 mt-3 leading-relaxed bg-noir-950 p-3 border border-slate-800">
              {dynamicDescription}
            </p>
          </div>

          {/* VENDEDOR */}
          <div className="bg-noir-950 p-3 border border-slate-800 text-xs flex justify-between items-center">
            <span className="text-slate-400">
              OPERADOR ANUNCIANTE:{" "}
              <strong className="text-neon-cyan">{sellerHandle}</strong>
            </span>
            {isOwner && (
              <span className="bg-neon-pink/20 text-neon-pink border border-neon-pink px-2 py-0.5 text-[9px] font-bold">
                SEU ANÚNCIO
              </span>
            )}
          </div>

          {/* AÇÕES */}
          <div className="pt-2">
            {isOwner ? (
              <div className="bg-noir-950 border border-slate-800 p-3 text-center text-xs text-slate-500 font-bold">
                ⚠ VOCÊ É O PROPRIETÁRIO DESTE ANÚNCIO. AÇÕES DE COMPRA
                BLOQUEADAS.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDirectBuy}
                  disabled={processing}
                  className="py-3 bg-neon-mint hover:bg-neon-mint/90 text-noir-950 font-black text-xs uppercase chamfer-box tracking-wider cursor-pointer shadow-md disabled:opacity-50"
                >
                  {processing ? "PROCESSANDO..." : "COMPRA DIRETA"}
                </button>

                <button
                  onClick={() => setShowOfferModal(true)}
                  disabled={processing}
                  className="py-3 bg-noir-800 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 font-black text-xs uppercase chamfer-box tracking-wider cursor-pointer disabled:opacity-50"
                >
                  ENVIAR PROPOSTA
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL DE PROPOSTA */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-noir-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateOffer}
            className="bg-noir-900 border-2 border-neon-cyan p-5 max-w-sm w-full chamfer-box space-y-4 shadow-2xl"
          >
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              ABRIR CANAL // {productTitle}
            </h3>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                VALOR DO ANÚNCIO
              </label>
              <input
                type="text"
                disabled
                value={`R$ ${Number(productPrice).toFixed(2)}`}
                className="w-full bg-noir-950 border border-slate-800 p-2 text-slate-500 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                SUA PROPOSTA (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="w-full bg-noir-950 border-2 border-slate-600 p-2 text-slate-100 text-xs font-bold focus:outline-none focus:border-neon-cyan"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                MENSAGEM INICIAL (OPCIONAL)
              </label>
              <textarea
                rows="2"
                value={initialMsg}
                onChange={(e) => setInitialMsg(e.target.value)}
                placeholder="Ex: Aceita entregar em mãos?"
                className="w-full bg-noir-950 border-2 border-slate-600 p-2 text-slate-100 text-xs focus:outline-none focus:border-neon-cyan resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="flex-1 py-2 bg-noir-800 text-slate-300 border border-slate-600 text-xs font-bold"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={processing || !offerPrice}
                className="flex-1 py-2 bg-neon-cyan text-noir-950 text-xs font-black disabled:opacity-50"
              >
                {processing ? "ENVIANDO..." : "INICIAR CHAT"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
