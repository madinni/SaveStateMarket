import React, { useState, useEffect } from "react";
import CrtToggle from "../components/CrtToggle";
import { useSearchParams, Link, Navigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../hooks/useProducts";
import { useProfiles, useReviews, useSaveReview } from "../hooks/useProfiles";
import { reviewSchema, shippingAddressFormSchema } from "../schemas";
import { ordersApi, profilesApi, refundsApi } from "../services/api";
import ShippingAddressFields from "../components/ShippingAddressFields";
import FieldError from "../components/FieldError";
import { EMPTY_SHIPPING_ADDRESS, formatShippingAddress } from "../utils/address";
import { createDemoPixPayload } from "../utils/pix";

const normalize = (v) =>
  v ? decodeURIComponent(String(v)).replace(/[@\s]/g, "").toLowerCase() : "";

const formatBRL = (val) =>
  Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=200&q=80";

const createRefundId = () => `RFD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

function resizeAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 200;
        const size = Math.min(img.width, img.height);
        canvas
          .getContext("2d")
          .drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 200, 200);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function OperativeProfile() {
  const [searchParams] = useSearchParams();
  const { user, login, logout, updateAvatar } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [reviewError, setReviewError] = useState(null);
  const [addressFeedback, setAddressFeedback] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [refundError, setRefundError] = useState("");
  const [refundActionId, setRefundActionId] = useState("");
  const queryClient = useQueryClient();

  const targetHandle = searchParams.get("handle");
  const clean = normalize(targetHandle || user?.handle);
  const isOwnProfile =
    !targetHandle || (user && normalize(user.handle) === normalize(targetHandle));

  const { data: profiles, isLoading: loadingProfiles, isError } = useProfiles();
  const { data: products = [] } = useProducts();
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["orders"],
    queryFn: ordersApi.list,
    enabled: Boolean(isOwnProfile && user?.id),
  });
  const { data: refunds = [], isLoading: loadingRefunds } = useQuery({
    queryKey: ["refunds"],
    queryFn: refundsApi.list,
    enabled: Boolean(isOwnProfile && user?.id),
  });
  const profile = profiles?.find((p) => normalize(p.handle) === clean);
  const { data: reviews = [] } = useReviews(profile?.id);
  const saveReview = useSaveReview(profile?.id);
  const addressForm = useForm({
    resolver: zodResolver(shippingAddressFormSchema),
    defaultValues: { shipping_address: { ...EMPTY_SHIPPING_ADDRESS } },
  });
  const saveAddress = useMutation({
    mutationFn: (shipping_address) => profilesApi.update(user.id, { shipping_address }),
    onSuccess: (updatedProfile) => {
      login(updatedProfile);
      setAddressFeedback("Endereço principal atualizado.");
    },
  });

  // A reputação exibida é a média das avaliações recebidas.
  const reputation = reviews.length
    ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
    : Number(profile?.reputation ?? 5);

  const myReview = user
    ? reviews.find((r) => normalize(r.author_handle) === normalize(user.handle))
    : null;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: { comment: "", rating: 5 },
  });

  // Ao existir uma avaliação do usuário, o formulário entra em modo de edição.
  useEffect(() => {
    reset({ comment: myReview?.comment ?? "", rating: myReview?.rating ?? 5 });
  }, [myReview?.id, myReview?.comment, myReview?.rating, reset]);

  // O aviso de avaliação (ex.: 403) é do perfil visitado; some ao trocar de perfil.
  useEffect(() => setReviewError(null), [profile?.id]);

  useEffect(() => {
    if (!isOwnProfile) return;
    addressForm.reset({
      shipping_address: { ...EMPTY_SHIPPING_ADDRESS, ...user?.shipping_address },
    });
  }, [addressForm.reset, isOwnProfile, user?.id, user?.shipping_address]);

  if (!targetHandle && !user) return <Navigate to="/login" replace />;

  if (loadingProfiles) {
    return <div className="p-10 text-center font-code text-neon-cyan animate-pulse">SYNCING_OPERATIVE_DOSSIER...</div>;
  }
  if (isError) {
    return <div role="alert" className="p-10 text-center font-code text-neon-pink font-bold">⚠ FALHA AO CARREGAR O DOSSIÊ.</div>;
  }
  if (!profile) {
    return (
      <div className="p-10 text-center font-code text-neon-pink space-y-3">
        <p className="font-bold">⚠ OPERADOR NÃO ENCONTRADO.</p>
        <Link to="/" className="text-neon-cyan underline">&lt;&lt; VOLTAR AO FEED</Link>
      </div>
    );
  }

  const userProducts = products.filter((p) => normalize(p.seller_handle) === clean);
  const sellerOrders = orders.filter(
    (order) =>
      order.status === "approved" &&
      order.items?.some((item) => String(item.seller_id) === String(user?.id)),
  );
  const avatarSrc = (isOwnProfile && user?.avatar_url) || profile.avatar_url || DEFAULT_AVATAR;

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatarError("");
      await updateAvatar(await resizeAvatar(file));
    } catch (err) {
      setAvatarError(err.message);
    }
  };

  const onSubmitReview = async (values) => {
    setFeedback("");
    setReviewError(null);
    try {
      await saveReview.mutateAsync({
        id: myReview?.id,
        data: {
          profile_id: profile.id,
          author_handle: user.handle,
          rating: values.rating,
          comment: values.comment,
          badge: myReview ? "[UPDATED_REVIEW]" : "[VERIFIED_TRADE]",
          created_at: new Date().toISOString(),
        },
      });
      setFeedback("Feedback registrado com sucesso.");
    } catch (err) {
      // Erro de campo vai para o campo; o resto (ex.: 403 sem transação concluída) vira aviso no formulário.
      if (err.field === "comment" || err.field === "rating") setError(err.field, { message: err.message });
      else setReviewError(err);
    }
  };

  const startRefund = async (order, sellerItems) => {
    const refundId = createRefundId();
    const amount = sellerItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    if (!amount) {
      setRefundError("Não foi possível calcular o valor dos itens para reembolso.");
      return;
    }

    setRefundError("");
    setRefundActionId(order.id);
    try {
      const updatedProfile = await profilesApi.update(user.id, { account_status: "refund_pending" });
      login(updatedProfile);
      const createdRefund = await refundsApi.create({
        id: refundId,
        order_id: order.id,
        seller_id: user.id,
        seller_handle: user.handle,
        buyer_id: order.buyer_id,
        buyer_handle: order.buyer_handle,
        item_ids: sellerItems.map((item) => item.product_id),
        item_titles: sellerItems.map((item) => item.title),
        amount,
        payment_method: "PIX",
        status: "pending",
        pix_copy_paste: createDemoPixPayload(amount, refundId),
        created_at: new Date().toISOString(),
      });
      queryClient.setQueryData(["refunds"], (currentRefunds = []) => [...currentRefunds, createdRefund]);
      try {
        const deliveryCancellations = [
          ...(order.delivery_cancellations || []).filter((entry) => String(entry.seller_id) !== String(user.id)),
          { seller_id: user.id, refund_id: refundId, status: "cancelled", cancelled_at: new Date().toISOString() },
        ];
        await ordersApi.update(order.id, { delivery_cancellations: deliveryCancellations });
      } catch {
        setRefundError("Reembolso registrado e conta bloqueada, mas o status de entrega não foi atualizado.");
      }
      await queryClient.invalidateQueries({ queryKey: ["refunds"] });
    } catch (error) {
      setRefundError(error.message || "Não foi possível iniciar o reembolso.");
      await queryClient.invalidateQueries({ queryKey: ["refunds"] });
      const currentRefunds = await refundsApi.list().catch(() => refunds);
      queryClient.setQueryData(["refunds"], currentRefunds);
      const hasPendingRefund = currentRefunds.some(
        (refund) => String(refund.seller_id) === String(user.id) && refund.status === "pending",
      );
      if (!hasPendingRefund) {
        try {
          login(await profilesApi.update(user.id, { account_status: "active" }));
        } catch {
          setRefundError("A conta continua bloqueada. Tente novamente ou contate o suporte.");
        }
      }
    } finally {
      setRefundActionId("");
    }
  };

  const simulateRefundPayment = async (refund) => {
    setRefundError("");
    setRefundActionId(refund.id);
    try {
      await refundsApi.update(refund.id, { status: "paid", paid_at: new Date().toISOString() });
      await queryClient.invalidateQueries({ queryKey: ["refunds"] });
      const currentRefunds = await refundsApi.list();
      const hasPendingRefund = currentRefunds.some(
        (entry) => String(entry.seller_id) === String(user.id) && entry.status === "pending",
      );
      if (!hasPendingRefund) {
        login(await profilesApi.update(user.id, { account_status: "active" }));
      }
    } catch (error) {
      setRefundError(error.message || "Não foi possível confirmar o pagamento do reembolso.");
    } finally {
      setRefundActionId("");
    }
  };

  return (
    <div className="min-h-screen pb-24 text-slate-200">
      <header className="sticky top-0 z-40 bg-noir-950/85 backdrop-blur-md border-b border-noir-700/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-neon-mint animate-pulse"></div>
          <div>
            <h1 className="font-pixel text-2xl tracking-widest text-white leading-none">
              DOSSIER<span className="text-neon-cyan">//</span>{normalize(profile.handle).slice(0, 4).toUpperCase()}
            </h1>
            <p className="font-code text-[9px] text-slate-400">OPERATIVE_RECORD // {profile.clearance_level || "LEVEL_3"}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
        <CrtToggle />
        {isOwnProfile ? (
          <button type="button" onClick={logout} className="px-2 py-1 bg-noir-900 border border-noir-700 text-slate-400 hover:text-neon-pink hover:border-neon-pink text-[10px] font-code chamfer-tag">
            [LOGOUT]
          </button>
        ) : (
          <Link to="/" className="px-2 py-1 bg-noir-900 border border-noir-700 text-neon-cyan text-[10px] font-code chamfer-tag">
            &lt;&lt; FEED
          </Link>
        )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <section className="bg-noir-900/90 border border-noir-700 p-4 chamfer-box glow-pink">
          <div className="flex items-center space-x-3.5">
            <div className="relative group">
              <input type="file" id="avatar-input" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <div
                onClick={() => isOwnProfile && document.getElementById("avatar-input").click()}
                className={`w-16 h-16 bg-noir-800 border-2 border-neon-pink p-0.5 overflow-hidden chamfer-tag relative ${isOwnProfile ? "cursor-pointer" : ""}`}
              >
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover grayscale contrast-150" />
                {isOwnProfile && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-noir-950/80 text-[8px] font-code text-neon-cyan font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>[EDIT]</span>
                    <span>PHOTO</span>
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-neon-mint border-2 border-noir-950"></span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white font-code truncate">{profile.handle}</h2>
                <span className="text-[9px] font-code text-neon-cyan bg-noir-950 px-1.5 py-0.5 border border-neon-cyan/40">
                  {isOwnProfile ? "VERIFIED" : "SELLER"}
                </span>
              </div>
              <p className="text-[10px] font-code text-slate-400 mt-0.5">ID: 0x{String(profile.id).slice(0, 8).toUpperCase()}</p>
              <p className="text-[10px] font-code text-neon-mint mt-1">
                REPUTATION: ★ {reputation.toFixed(2)} ({reviews.length} AVALIAÇÕES // {profile.total_transactions || 0} TRANSAÇÕES)
              </p>
            </div>
          </div>
          {avatarError && <p role="alert" className="mt-2 text-[10px] font-bold text-neon-pink">⚠ {avatarError}</p>}

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-noir-800 text-center font-code">
            <div className="bg-noir-950 p-2 border border-noir-800/80">
              <span className="text-[8px] text-slate-500 block">SUCCESS_RATE</span>
              <span className="font-bold text-neon-mint font-pixel text-lg leading-none">{profile.success_rate ?? 100}%</span>
            </div>
            <div className="bg-noir-950 p-2 border border-noir-800/80">
              <span className="text-[8px] text-slate-500 block">ACTIVE_DROPS</span>
              <span className="font-bold text-neon-cyan font-pixel text-lg leading-none">{String(userProducts.length).padStart(2, "0")}</span>
            </div>
            <div className="bg-noir-950 p-2 border border-noir-800/80">
              <span className="text-[8px] text-slate-500 block">VAULT_BALANCE</span>
              <span className="font-bold text-neon-pink font-pixel text-lg leading-none">{formatBRL(profile.vault_balance).split(",")[0]}</span>
            </div>
          </div>
        </section>

        {isOwnProfile && (
          <section className="bg-noir-900 border border-neon-cyan/40 p-3 chamfer-box flex justify-between items-center glow-cyan">
            <div>
              <span className="text-[9px] font-code text-neon-cyan block">NULL_ESCROW // CARTEIRA</span>
              <p className="text-base font-pixel text-white leading-none mt-0.5">
                {formatBRL(profile.vault_balance)} <span className="text-[10px] text-slate-400 font-code font-normal">EM CUSTÓDIA</span>
              </p>
            </div>
            <button type="button" onClick={() => alert("Saque PIX autorizado.")} className="px-3 py-1.5 bg-noir-800 hover:bg-neon-cyan hover:text-noir-950 text-neon-cyan border border-neon-cyan text-[10px] font-code font-bold chamfer-tag">
              [SACAR_SALDO]
            </button>
          </section>
        )}

        {isOwnProfile && (
          <section className="bg-noir-900 border border-noir-700 p-4 chamfer-box space-y-3">
            <div>
              <h2 className="text-xs font-bold text-neon-cyan">ENDEREÇO PRINCIPAL DE ENTREGA</h2>
              <p className="mt-1 text-[10px] text-slate-500">Usado para compras e compartilhado com o vendedor após a aprovação do pagamento.</p>
            </div>
            <p className="border border-slate-800 bg-noir-950 p-3 text-[10px] leading-relaxed text-slate-300">
              {formatShippingAddress(user?.shipping_address)}
            </p>
            <form onSubmit={addressForm.handleSubmit(({ shipping_address }) => saveAddress.mutate(shipping_address))} noValidate className="space-y-3">
              <ShippingAddressFields register={addressForm.register} setValue={addressForm.setValue} watch={addressForm.watch} errors={addressForm.formState.errors} />
              {saveAddress.isError && <p role="alert" className="text-[10px] font-bold text-neon-pink">⚠ {saveAddress.error.message}</p>}
              {addressFeedback && <p role="status" className="text-[10px] font-bold text-neon-mint">{addressFeedback}</p>}
              <button type="submit" disabled={saveAddress.isPending} className="w-full py-2 bg-neon-cyan text-noir-950 text-xs font-bold disabled:opacity-50">
                {saveAddress.isPending ? "SALVANDO..." : "SALVAR ENDEREÇO PRINCIPAL"}
              </button>
            </form>
          </section>
        )}

        {isOwnProfile && (
          <section className="space-y-2">
            <div className="border-b border-noir-800 pb-1 text-xs font-bold text-white">
              VENDAS PAGAS ({sellerOrders.length})
            </div>
            {user.account_status === "refund_pending" && (
              <p role="alert" className="border border-neon-amber/60 bg-noir-900 p-3 text-[10px] text-neon-amber">
                CONTA BLOQUEADA PARA COMPRAS E NOVOS ANÚNCIOS. PAGUE OS REEMBOLSOS PIX PENDENTES E AGUARDE A LIBERAÇÃO DO ADMINISTRADOR: A CONFIRMAÇÃO DO PAGAMENTO, SOZINHA, NÃO DESBLOQUEIA A CONTA.
              </p>
            )}
            {refundError && <p role="alert" className="text-[10px] font-bold text-neon-pink">⚠ {refundError}</p>}
            {loadingOrders ? (
              <div className="bg-noir-900 border border-noir-800 p-4 text-center text-xs text-slate-500">CARREGANDO PEDIDOS...</div>
            ) : sellerOrders.length === 0 ? (
              <div className="bg-noir-900 border border-noir-800 p-4 text-center text-xs text-slate-500">NENHUM PEDIDO PAGO PARA SEUS ANÚNCIOS.</div>
            ) : sellerOrders.map((order) => {
              const sellerItems = order.items.filter((item) => String(item.seller_id) === String(user.id));
              const refund = refunds.find(
                (entry) => String(entry.order_id) === String(order.id) && String(entry.seller_id) === String(user.id),
              );
              const refundAmount = sellerItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
              return (
                <article key={order.id} className="bg-noir-900 border border-neon-mint/50 p-3 chamfer-box space-y-2">
                  <div className="flex justify-between gap-2 text-[10px]">
                    <span className={`font-bold ${refund ? "text-neon-amber" : "text-neon-mint"}`}>
                      {refund ? "ENTREGA CANCELADA" : "PIX APROVADO"}
                    </span>
                    <span className="text-slate-500">{order.id}</span>
                  </div>
                  <p className="text-[10px] text-slate-300">COMPRADOR: {order.buyer_handle || "Operador"}</p>
                  <p className="text-[10px] text-slate-300">
                    {refund ? "Entrega cancelada. Conclua o reembolso PIX ao comprador." : "Pagamento realizado. Prepare o envio para o endereço abaixo."}
                  </p>
                  <ul className="space-y-1 text-[10px] text-slate-300">
                    {sellerItems.map((item) => <li key={item.product_id}>{item.title} · QTD {item.quantity}</li>)}
                  </ul>
                  {!refund && (
                    <div className="border-t border-slate-700 pt-2">
                      <p className="text-[9px] font-bold text-neon-cyan">ENDEREÇO DE ENTREGA</p>
                      <p className="mt-1 text-[10px] leading-relaxed text-slate-300">{formatShippingAddress(order.shipping_address)}</p>
                    </div>
                  )}
                  {refund ? (
                    <div className="border-t border-slate-700 pt-3 space-y-2">
                      <div className="flex justify-between gap-2 text-[10px]">
                        <span className="font-bold text-neon-amber">DEVOLUÇÃO PIX</span>
                        <span className={`text-right ${refund.status === "released" ? "text-neon-mint" : refund.status === "paid" ? "text-neon-cyan" : "text-neon-amber"}`}>
                          {refund.status === "released"
                            ? "LIBERADO"
                            : refund.status === "paid"
                              ? "PAGO — AGUARDANDO LIBERAÇÃO DO ADMIN"
                              : "REEMBOLSO PENDENTE"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300">Devolva {formatBRL(refund.amount)} ao comprador via PIX.</p>
                      {refund.status === "pending" && (
                        <>
                          <div className="flex justify-center bg-white p-3">
                            <QRCodeSVG value={refund.pix_copy_paste} size={180} level="M" includeMargin />
                          </div>
                          <textarea readOnly value={refund.pix_copy_paste} rows={3}
                            aria-label="PIX Copia e Cola do reembolso"
                            className="w-full resize-none break-all bg-noir-950 border border-slate-700 p-2 text-[9px] text-slate-300" />
                          <p className="text-[9px] text-neon-amber">PIX de reembolso simulado. Nenhuma transferência real será feita.</p>
                          <button type="button" onClick={() => simulateRefundPayment(refund)} disabled={refundActionId === refund.id || refundActionId === order.id}
                            className="w-full py-2 bg-neon-amber text-noir-950 text-[10px] font-black disabled:opacity-50">
                            {refundActionId === refund.id ? "PROCESSANDO..." : "SIMULAR PAGAMENTO DO REEMBOLSO"}
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <button type="button" onClick={() => startRefund(order, sellerItems)}
                      disabled={loadingRefunds || refundActionId === order.id || user.account_status === "refund_pending"}
                      className="w-full border border-neon-pink py-2 text-[10px] font-bold text-neon-pink hover:bg-neon-pink/10 disabled:opacity-50">
                      {refundActionId === order.id ? "GERANDO REEMBOLSO..." : `CANCELAR ENTREGA E REEMBOLSAR ${formatBRL(refundAmount)}`}
                    </button>
                  )}
                </article>
              );
            })}
          </section>
        )}

        <section className="space-y-2">
          <div className="flex border-b border-noir-800 pb-1 text-xs font-code text-white font-bold">
            <span>ANÚNCIOS REGISTRADOS ({userProducts.length})</span>
          </div>
          {userProducts.length === 0 ? (
            <div className="bg-noir-900 border border-noir-800 p-4 text-center font-code text-xs text-slate-500">
              NENHUM ITEM PUBLICADO POR ESTE OPERADOR.
            </div>
          ) : (
            userProducts.map((p) => (
              <Link to={`/product/${p.id}`} key={p.id} className="bg-noir-900 border border-noir-800 p-2.5 flex items-center justify-between hover:border-neon-pink transition-colors block">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 bg-noir-800 border border-noir-700 shrink-0 overflow-hidden">
                    <img src={p.image_url} alt="" className="w-full h-full object-cover filter grayscale" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white font-code truncate uppercase">{p.title}</h3>
                    <p className="text-[10px] text-slate-500 font-code">{p.platform} // {p.condition_tag}</p>
                  </div>
                </div>
                <p className="font-pixel text-neon-cyan text-lg">{formatBRL(p.price)}</p>
              </Link>
            ))
          )}
        </section>

        {!isOwnProfile &&
          (user ? (
            <section className="bg-noir-900/90 border border-noir-700 p-3.5 chamfer-box space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-code text-neon-cyan font-bold">
                  {myReview ? "ALTERAR SEU FEEDBACK" : "REGISTRAR FEEDBACK NO DOSSIÊ"}
                </span>
                <span className="text-[9px] font-code text-slate-500">{myReview ? "EDIT_MODE" : "NEW_ENTRY"}</span>
              </div>
              <form onSubmit={handleSubmit(onSubmitReview)} noValidate className="space-y-2">
                <div>
                  <textarea
                    rows="2"
                    aria-label="Comentário"
                    placeholder="Relate a experiência da negociação..."
                    {...register("comment")}
                    className="w-full bg-noir-950 border border-noir-700 px-3 py-2 text-xs font-code text-white placeholder-slate-600 focus:outline-none focus:border-neon-pink resize-none"
                  />
                  <FieldError error={errors.comment} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <label htmlFor="review-rating" className="text-[10px] font-code text-slate-400">NOTA:</label>
                    <select id="review-rating" {...register("rating")} className="bg-noir-950 border border-noir-700 text-neon-mint text-xs font-code px-2 py-1">
                      <option value="5">★ ★ ★ ★ ★ (5.0)</option>
                      <option value="4">★ ★ ★ ★ ☆ (4.0)</option>
                      <option value="3">★ ★ ★ ☆ ☆ (3.0)</option>
                      <option value="2">★ ★ ☆ ☆ ☆ (2.0)</option>
                      <option value="1">★ ☆ ☆ ☆ ☆ (1.0)</option>
                    </select>
                  </div>
                  <button type="submit" disabled={saveReview.isPending} className="py-1.5 px-4 bg-neon-pink text-white font-code text-xs font-bold chamfer-tag glow-pink disabled:opacity-50">
                    {saveReview.isPending ? "GRAVANDO..." : myReview ? "[ATUALIZAR_LOG]" : "[GRAVAR_LOG]"}
                  </button>
                </div>
                {reviewError && (reviewError.status === 403 ? (
                  <div role="alert" className="border border-neon-amber/60 bg-noir-950 p-2.5 space-y-1 font-code">
                    <p className="text-[11px] font-bold text-neon-amber">⚠ AVALIAÇÃO NÃO PERMITIDA</p>
                    <p className="text-[10px] text-slate-300">{reviewError.message}</p>
                  </div>
                ) : (
                  <p role="alert" className="text-[11px] font-bold text-neon-pink">⚠ {reviewError.message}</p>
                ))}
                {feedback && <p role="status" className="text-[11px] font-bold text-neon-mint">✓ {feedback}</p>}
              </form>
            </section>
          ) : (
            <div className="bg-noir-900/90 border border-noir-700 p-4 chamfer-box text-center space-y-2">
              <p className="text-[11px] font-code text-neon-amber font-bold">CLEARANCE_REQUIRED // ACESSO RESTRITO</p>
              <p className="text-[10px] font-code text-slate-400">Faça login para registrar feedback neste dossiê.</p>
              <Link to="/login" className="inline-block px-3 py-1.5 bg-neon-cyan text-noir-950 font-code text-xs font-bold chamfer-tag">
                [AUTORIZAR_ACESSO]
              </Link>
            </div>
          ))}

        <section className="space-y-2">
          <div className="flex justify-between items-center border-b border-noir-800 pb-1 text-xs font-code text-white font-bold">
            <span>REPUTATION_LOGS ({reviews.length})</span>
          </div>
          {reviews.length === 0 ? (
            <div className="bg-noir-900 border border-noir-800 p-4 text-center font-code text-xs text-slate-500">
              NENHUM FEEDBACK REGISTRADO AINDA.
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="bg-noir-900 border border-noir-800 p-3 chamfer-box space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-code">
                  <span className="text-white font-bold">{r.author_handle}</span>
                  <span className="text-neon-mint">{"★".repeat(r.rating || 5)}</span>
                </div>
                <p className="text-xs font-code text-slate-300 bg-noir-950 p-2 border border-noir-800/60 leading-relaxed">
                  "{r.comment}"
                </p>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
