import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ordersApi, productsApi } from "../services/api";
import { formatShippingAddress, hasShippingAddress } from "../utils/address";
import { createDemoPixPayload } from "../utils/pix";

const formatBRL = (amount) =>
  Number(amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const createOrderId = () => {
  const randomPart = globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 8)
    || Math.random().toString(36).slice(2, 10).toUpperCase();
  return `ORD-${Date.now().toString(36).toUpperCase()}-${randomPart}`;
};

export default function Checkout() {
  const { user, isProfileSynced } = useAuth();
  const { items, removeItem, clearCart } = useCart();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [order, setOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState("pending");
  const [paymentApproved, setPaymentApproved] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isSimulatingApproval, setIsSimulatingApproval] = useState(false);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [actionError, setActionError] = useState("");
  const [pollingError, setPollingError] = useState("");
  const [listingCleanupError, setListingCleanupError] = useState("");

  const total = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0,
  );
  const isRefundBlocked = user?.account_status === "refund_pending";

  useEffect(() => {
    if (!order?.id) return undefined;

    let active = true;
    let requestInFlight = false;
    const intervalId = window.setInterval(async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const latestOrder = await ordersApi.get(order.id);
        if (!active) return;
        setOrderStatus(latestOrder.status);
        setPollingError("");

        if (latestOrder.status === "approved") {
          window.clearInterval(intervalId);
          setPaymentApproved(true);
          clearCart();

          const productIds = [...new Set((latestOrder.items || []).map((item) => item.product_id).filter(Boolean))];
          void Promise.all(productIds.map((productId) => productsApi.remove(productId)))
            .then(() => queryClient.invalidateQueries({ queryKey: ["products"] }))
            .catch(() => setListingCleanupError("Pagamento aprovado, mas alguns anúncios não puderam ser removidos."));
        }
      } catch (error) {
        if (active) setPollingError(error.message || "Falha ao consultar o pedido.");
      } finally {
        requestInFlight = false;
      }
    }, 3000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [order?.id, clearCart, queryClient]);

  const handleCreateOrder = async (event) => {
    event.preventDefault();
    if (!user || !isProfileSynced || items.length === 0 || paymentMethod !== "PIX") return;
    if (isRefundBlocked) {
      setActionError("Conta bloqueada até a quitação do reembolso PIX pendente.");
      return;
    }
    if (!hasShippingAddress(user.shipping_address)) {
      setActionError("Cadastre um endereço de entrega no perfil para continuar.");
      return;
    }

    setActionError("");
    setIsCreatingOrder(true);
    const id = createOrderId();
    const orderItems = items.map((item) => {
      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(item.price || 0);
      return {
        product_id: item.id,
        title: item.title,
        platform: item.platform,
        image_url: item.image_url,
        seller_id: item.seller_id || null,
        seller_handle: item.seller_handle || null,
        quantity,
        unit_price: unitPrice,
        subtotal: unitPrice * quantity,
      };
    });
    const orderData = {
      id,
      items: orderItems,
      total,
      payment_method: "PIX",
      status: "pending",
      pix_copy_paste: createDemoPixPayload(total, id),
      buyer_id: user.id,
      buyer_handle: user.handle,
      shipping_address: { ...user.shipping_address },
      created_at: new Date().toISOString(),
    };

    try {
      const createdOrder = await ordersApi.create(orderData);
      setOrder(createdOrder);
      setOrderStatus(createdOrder.status);
    } catch (error) {
      setActionError(error.message || "Não foi possível registrar o pedido.");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleCopyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(order.pix_copy_paste);
      setIsCodeCopied(true);
      window.setTimeout(() => setIsCodeCopied(false), 2000);
    } catch {
      setActionError("Não foi possível copiar o código neste navegador.");
    }
  };

  const handleSimulateApproval = async () => {
    setActionError("");
    setIsSimulatingApproval(true);
    try {
      await ordersApi.update(order.id, {
        status: "approved",
        approved_at: new Date().toISOString(),
      });
    } catch (error) {
      setActionError(error.message || "Não foi possível simular a aprovação.");
    } finally {
      setIsSimulatingApproval(false);
    }
  };

  if (user && !isProfileSynced) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-xs text-neon-cyan animate-pulse">
        SINCRONIZANDO_STATUS_DA_CONTA...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pb-28 text-slate-100 bg-noir-950 font-code">
        <Header title="PIX" titleHighlight="CHECKOUT" subtitle="AUTENTICAÇÃO NECESSÁRIA" backLink="/" backText="<< FEED" />
        <main className="max-w-md mx-auto px-4 pt-6 text-center space-y-4">
          <p className="text-xs text-slate-300">Entre na sua conta para continuar com o pagamento.</p>
          <Link to="/login" className="inline-block px-4 py-2 bg-neon-cyan text-noir-950 text-xs font-black">ENTRAR</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 text-slate-100 bg-noir-950 font-code">
      <Header title="PIX" titleHighlight="CHECKOUT" subtitle="FINALIZAÇÃO DE PEDIDO // AMBIENTE DEMONSTRATIVO" backLink="/" backText="<< FEED" />

      <main className="max-w-xl mx-auto px-4 pt-5 space-y-4">
        {paymentApproved ? (
          <section role="status" className="bg-noir-900 border-2 border-neon-mint p-5 chamfer-box space-y-4 text-center">
            <p className="text-[10px] font-bold text-neon-mint">PEDIDO {order.id}</p>
            <h1 className="text-lg font-black text-white">PAGAMENTO APROVADO</h1>
            <p className="text-xs text-slate-300">Pagamento realizado com sucesso! O carrinho foi esvaziado e os anúncios foram removidos do catálogo.</p>
            <p className="font-pixel text-xl text-neon-mint">{formatBRL(order.total)}</p>
            {listingCleanupError && <p role="alert" className="text-xs text-neon-amber">{listingCleanupError}</p>}
            <Link to="/" className="inline-block px-4 py-2 bg-neon-mint text-noir-950 text-xs font-black">VOLTAR AO CATÁLOGO</Link>
          </section>
        ) : order ? (
          <section className="bg-noir-900 border-2 border-neon-cyan p-5 chamfer-box space-y-4">
            <div className="flex justify-between items-start gap-3 border-b border-slate-700 pb-3">
              <div>
                <p className="text-[10px] font-bold text-neon-cyan">PEDIDO {order.id}</p>
                <h1 className="mt-1 text-sm font-black text-white">PAGUE COM PIX</h1>
              </div>
              <span className="font-pixel text-lg text-neon-mint whitespace-nowrap">{formatBRL(order.total)}</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-3">
                <QRCodeSVG value={order.pix_copy_paste} size={220} level="M" includeMargin />
              </div>
              <p className="text-center text-[10px] leading-relaxed text-neon-amber">
                PIX SIMULADO // este código é fictício e não pode receber pagamentos reais.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="pix-copy-paste" className="block text-[10px] font-bold text-slate-300">PIX COPIA E COLA</label>
              <textarea id="pix-copy-paste" readOnly value={order.pix_copy_paste} rows={3}
                className="w-full resize-none break-all bg-noir-950 border border-slate-700 p-3 text-[10px] text-slate-300 focus:outline-none" />
              <button type="button" onClick={handleCopyPixCode}
                className="w-full py-2 border border-neon-cyan text-neon-cyan text-xs font-bold hover:bg-neon-cyan/10">
                {isCodeCopied ? "CÓDIGO COPIADO" : "COPIAR CÓDIGO PIX"}
              </button>
            </div>

            <div className="border border-slate-700 bg-noir-950 p-3 text-center space-y-2">
              <p className="text-[10px] text-slate-300">STATUS DO PEDIDO: <span className="font-bold text-neon-amber">{orderStatus.toUpperCase()}</span></p>
              <p className="text-[10px] text-slate-500">Verificando o servidor a cada 3 segundos...</p>
              {pollingError && <p role="alert" className="text-[10px] text-neon-pink">{pollingError}</p>}
              <button type="button" onClick={handleSimulateApproval}
                disabled={isSimulatingApproval || orderStatus !== "pending"}
                className="w-full py-2 bg-neon-mint text-noir-950 text-xs font-black disabled:opacity-50">
                {isSimulatingApproval ? "ENVIANDO APROVAÇÃO..." : "Simular Aprovação do PIX"}
              </button>
            </div>
            {actionError && <p role="alert" className="text-xs font-bold text-neon-pink">⚠ {actionError}</p>}
          </section>
        ) : items.length === 0 ? (
          <section className="bg-noir-900 border border-slate-700 p-5 chamfer-box text-center space-y-3">
            <h1 className="text-sm font-black text-white">CARRINHO VAZIO</h1>
            <p className="text-xs text-slate-400">Adicione um anúncio ao carrinho para iniciar o checkout.</p>
            <Link to="/" className="inline-block px-4 py-2 bg-neon-cyan text-noir-950 text-xs font-black">EXPLORAR CATÁLOGO</Link>
          </section>
        ) : (
          <form onSubmit={handleCreateOrder} className="bg-noir-900 border-2 border-slate-700 p-5 chamfer-box space-y-5">
            <section className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <h1 className="text-xs font-black text-white">RESUMO DO PEDIDO</h1>
                <Link to="/" className="text-[10px] text-neon-cyan hover:underline">CONTINUAR COMPRANDO</Link>
              </div>
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start gap-3 border-b border-slate-800 pb-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">{item.title}</p>
                    <p className="mt-1 text-[10px] text-slate-500">{item.platform} · QTD {item.quantity || 1}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-neon-mint">{formatBRL(Number(item.price || 0) * Number(item.quantity || 1))}</p>
                    <button type="button" onClick={() => removeItem(item.id)} className="mt-1 text-[9px] text-neon-pink hover:underline">REMOVER</button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-bold text-slate-300">TOTAL</span>
                <span className="font-pixel text-xl text-neon-mint">{formatBRL(total)}</span>
              </div>
              <div className="border border-slate-700 bg-noir-950 p-3">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-[10px] font-bold text-slate-300">ENDEREÇO DE ENTREGA</p>
                  <Link to="/profile" className="text-[9px] text-neon-cyan hover:underline">EDITAR PERFIL</Link>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{formatShippingAddress(user.shipping_address)}</p>
              </div>
            </section>

            <fieldset className="space-y-2">
              <legend className="text-xs font-black text-white">FORMA DE PAGAMENTO</legend>
              <label className="flex items-center gap-3 border-2 border-neon-mint bg-noir-950 p-3 cursor-pointer">
                <input type="radio" name="payment-method" value="PIX" checked={paymentMethod === "PIX"}
                  onChange={() => setPaymentMethod("PIX")} className="accent-emerald-400" />
                <span>
                  <span className="block text-xs font-bold text-neon-mint">PIX</span>
                  <span className="block mt-1 text-[10px] text-slate-400">Pagamento instantâneo simulado</span>
                </span>
              </label>
            </fieldset>

            {actionError && <p role="alert" className="text-xs font-bold text-neon-pink">⚠ {actionError}</p>}

            {!hasShippingAddress(user.shipping_address) && (
              <p role="alert" className="text-xs text-neon-amber">
                Cadastre seu endereço principal no <Link to="/profile" className="text-neon-cyan underline">perfil</Link> para continuar.
              </p>
            )}
            {isRefundBlocked && (
              <p role="alert" className="text-xs text-neon-amber">
                Conta bloqueada para compras até a quitação do reembolso PIX. Acompanhe no <Link to="/profile" className="text-neon-cyan underline">perfil</Link>.
              </p>
            )}
            <button type="submit" disabled={!isProfileSynced || isCreatingOrder || total <= 0 || !hasShippingAddress(user.shipping_address) || isRefundBlocked}
              className="w-full py-3 bg-neon-mint text-noir-950 text-xs font-black disabled:opacity-50">
              {isCreatingOrder ? "REGISTRANDO PEDIDO..." : "CONFIRMAR COMPRA COM PIX"}
            </button>
            <p className="text-center text-[9px] leading-relaxed text-slate-500">Ambiente demonstrativo. Nenhum pagamento real será efetuado.</p>
          </form>
        )}
      </main>
    </div>
  );
}