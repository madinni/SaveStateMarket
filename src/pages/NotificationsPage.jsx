import React, { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "../components/Header";
import FieldError from "../components/FieldError";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../hooks/useProducts";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotifications,
  useMyAlerts,
  useCreateAlert,
  useUpdateAlert,
  useDeleteAlert,
} from "../hooks/useNotifications";
import { makeAlertSchema, makeNewAlertSchema } from "../schemas";

const TYPE_ICON = { OFFER: "◈", PRICE_ALERT: "▼", REVIEW: "★" };
const TYPE_COLOR = {
  OFFER: "text-neon-cyan",
  PRICE_ALERT: "text-neon-amber",
  REVIEW: "text-neon-mint",
};

const brl = (v) => `R$ ${Number(v).toFixed(2)}`;
const when = (iso) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function AlertRow({ alert, product, busy, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const currentPrice = Number(product?.price ?? alert.price_at_creation);
  const schema = useMemo(() => makeAlertSchema(currentPrice), [currentPrice]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { target_price: alert.target_price } });

  const submit = async ({ target_price }) => {
    // Alterar o alvo de um alerta já disparado o reativa.
    await onUpdate(alert.id, { target_price, active: true, triggered_at: null, triggered_price: null });
    setEditing(false);
  };

  return (
    <div className="bg-noir-900 border border-noir-800 p-3 chamfer-box space-y-2 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {product ? (
            <Link to={`/product/${product.id}`} className="font-bold text-white hover:text-neon-pink truncate block">
              {alert.product_title}
            </Link>
          ) : (
            <span className="font-bold text-slate-500 line-through">{alert.product_title}</span>
          )}
          <p className="text-[10px] text-slate-400 mt-0.5">
            ALVO: <strong className="text-neon-mint">{brl(alert.target_price)}</strong> | PREÇO ATUAL:{" "}
            {product ? brl(product.price) : "anúncio removido"}
          </p>
        </div>
        <span className={`shrink-0 border px-2 py-0.5 text-[10px] font-bold ${alert.active ? "border-neon-amber text-neon-amber" : "border-neon-mint text-neon-mint"}`}>
          {alert.active ? "[ATIVO]" : "[DISPARADO]"}
        </span>
      </div>

      {!alert.active && alert.triggered_at && (
        <p className="text-[10px] text-slate-400">
          Disparado em {when(alert.triggered_at)} com o preço em {brl(alert.triggered_price)}.
        </p>
      )}

      {editing ? (
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-2">
          <input type="number" step="0.01" aria-label="Novo alvo" {...register("target_price")}
            className="w-full bg-noir-950 border-2 border-slate-600 p-2 text-slate-100 text-xs focus:outline-none focus:border-neon-amber" />
          <FieldError error={errors.target_price} />
          <div className="flex gap-2">
            <button type="button" onClick={() => { setEditing(false); reset({ target_price: alert.target_price }); }}
              className="flex-1 py-1.5 bg-noir-800 text-slate-300 border border-slate-600 text-[11px] font-bold">
              CANCELAR
            </button>
            <button type="submit" disabled={busy} className="flex-1 py-1.5 bg-neon-amber text-noir-950 text-[11px] font-black disabled:opacity-50">
              SALVAR
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-2">
          {product && (
            <button type="button" onClick={() => setEditing(true)}
              className="px-2.5 py-1 border border-neon-cyan text-neon-cyan text-[10px] font-bold">
              {alert.active ? "ALTERAR ALVO" : "REATIVAR"}
            </button>
          )}
          <button type="button" onClick={() => onDelete(alert.id)} disabled={busy}
            className="px-2.5 py-1 border border-neon-pink text-neon-pink text-[10px] font-bold disabled:opacity-50">
            REMOVER
          </button>
        </div>
      )}
    </div>
  );
}

function NewAlertForm({ user, products, alerts }) {
  const createAlert = useCreateAlert();
  const [error, setError] = useState("");
  const [created, setCreated] = useState("");

  // Só entram anúncios de outros vendedores que ainda não têm alerta ativo.
  const eligible = useMemo(
    () =>
      products.filter(
        (p) =>
          p.seller_id !== user.id &&
          p.seller_handle !== user.handle &&
          !alerts.some((a) => a.product_id === p.id && a.active),
      ),
    [products, alerts, user],
  );
  const schema = useMemo(() => makeNewAlertSchema(eligible), [eligible]);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { product_id: "", target_price: "" } });

  const selected = eligible.find((p) => String(p.id) === watch("product_id"));

  const onSubmit = async ({ product_id, target_price }) => {
    setError("");
    setCreated("");
    const product = eligible.find((p) => String(p.id) === product_id);
    try {
      await createAlert.mutateAsync({
        user_id: user.id,
        product_id: product.id,
        product_title: product.title,
        target_price,
        price_at_creation: Number(product.price),
        active: true,
        created_at: new Date().toISOString(),
      });
      setCreated(`Alerta criado para "${product.title}".`);
      reset({ product_id: "", target_price: "" });
    } catch (err) {
      setError(err.message || "Não foi possível criar o alerta.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate
      className="bg-noir-900 border border-neon-amber/50 p-3 chamfer-box space-y-3 text-xs">
      <p className="text-neon-amber font-bold">▼ NOVO ALERTA DE PREÇO</p>

      {eligible.length === 0 ? (
        <p className="text-slate-400">
          Não há anúncios disponíveis para novos alertas: você já acompanha todos os anúncios de outros vendedores.
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="new-alert-product" className="block text-[10px] text-slate-400 mb-1">ANÚNCIO</label>
            <select id="new-alert-product" {...register("product_id")}
              className="w-full bg-noir-950 border-2 border-slate-600 p-2 text-slate-100 text-xs focus:outline-none focus:border-neon-amber">
              <option value="">Selecione um anúncio...</option>
              {eligible.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.title} — {brl(p.price)}
                </option>
              ))}
            </select>
            <FieldError error={errors.product_id} />
          </div>

          <div>
            <label htmlFor="new-alert-target" className="block text-[10px] text-slate-400 mb-1">
              ME AVISE QUANDO O PREÇO CHEGAR A (R$){selected ? ` — ATUAL: ${brl(selected.price)}` : ""}
            </label>
            <input id="new-alert-target" type="number" step="0.01" {...register("target_price")}
              className="w-full bg-noir-950 border-2 border-slate-600 p-2 text-slate-100 text-xs focus:outline-none focus:border-neon-amber" />
            <FieldError error={errors.target_price} />
          </div>

          <button type="submit" disabled={createAlert.isPending}
            className="w-full py-2 bg-neon-amber text-noir-950 text-[11px] font-black disabled:opacity-50">
            {createAlert.isPending ? "CRIANDO..." : "ATIVAR ALERTA"}
          </button>
        </>
      )}

      {error && <p role="alert" className="text-[11px] font-bold text-neon-pink">⚠ {error}</p>}
      {created && <p role="status" className="text-[11px] font-bold text-neon-mint">✓ {created}</p>}
    </form>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("notifications");
  const [error, setError] = useState("");

  const { data: notifications = [], isLoading, isError } = useNotifications(user?.id);
  const { data: alerts = [] } = useMyAlerts(user?.id);
  const { data: products = [] } = useProducts();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const deleteNotifications = useDeleteNotifications();
  const updateAlert = useUpdateAlert();
  const deleteAlert = useDeleteAlert();

  if (!user) return <Navigate to="/login" replace />;

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);
  const productById = (id) => products.find((p) => String(p.id) === String(id));

  const run = async (action) => {
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.message || "Não foi possível concluir a ação.");
    }
  };

  const openNotification = (n) =>
    run(async () => {
      if (!n.read) await markRead.mutateAsync(n.id);
      if (n.link) navigate(n.link);
    });

  const tabClass = (name) =>
    `py-2 chamfer-tag font-bold ${tab === name ? "bg-neon-pink text-white glow-pink" : "text-slate-400"}`;

  return (
    <div className="min-h-screen pb-28 text-slate-100 bg-noir-950 font-code">
      <Header
        title="NOTIFICATION"
        titleHighlight="CENTER"
        subtitle="CAIXA DE ENTRADA // ALERTAS DE PREÇO"
        backLink="/"
        backText="<< FEED"
        badgeText={unread.length > 0 ? `${unread.length} NOVAS` : "EM DIA"}
        badgeType={unread.length > 0 ? "pink" : "mint"}
      />

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-1 bg-noir-900 p-1 border border-noir-700 text-xs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "notifications"} onClick={() => setTab("notifications")} className={tabClass("notifications")}>
            [NOTIFICAÇÕES]
          </button>
          <button type="button" role="tab" aria-selected={tab === "alerts"} onClick={() => setTab("alerts")} className={tabClass("alerts")}>
            [ALERTAS DE PREÇO ({alerts.length})]
          </button>
        </div>

        {(isError || error) && (
          <div role="alert" className="bg-noir-900 border-2 border-neon-pink p-3 chamfer-box text-xs text-neon-pink font-bold">
            ⚠ {error || "Falha ao carregar as notificações."}
          </div>
        )}

        {tab === "notifications" ? (
          <section className="space-y-3">
            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              <button type="button" disabled={unread.length === 0 || markAllRead.isPending}
                onClick={() => run(() => markAllRead.mutateAsync(unread.map((n) => n.id)))}
                className="px-2.5 py-1 border border-neon-cyan text-neon-cyan disabled:opacity-40">
                MARCAR TODAS COMO LIDAS
              </button>
              <button type="button" disabled={read.length === 0 || deleteNotifications.isPending}
                onClick={() => run(() => deleteNotifications.mutateAsync(read.map((n) => n.id)))}
                className="px-2.5 py-1 border border-slate-600 text-slate-300 disabled:opacity-40">
                LIMPAR LIDAS
              </button>
            </div>

            {isLoading ? (
              <div className="py-10 text-center text-xs text-neon-cyan animate-pulse">CARREGANDO_NOTIFICAÇÕES...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 bg-noir-900/40 border border-dashed border-noir-800 text-xs text-slate-500">
                NENHUMA NOTIFICAÇÃO POR AQUI.
              </div>
            ) : (
              notifications.map((n) => (
                <article key={n.id}
                  className={`border p-3 chamfer-box flex gap-3 ${n.read ? "bg-noir-900 border-noir-800" : "bg-noir-800 border-neon-pink/60"}`}>
                  <span className={`font-pixel text-2xl leading-none ${TYPE_COLOR[n.type] || "text-slate-400"}`} aria-hidden="true">
                    {TYPE_ICON[n.type] || "●"}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1">
                    <button type="button" onClick={() => openNotification(n)} className="text-left w-full">
                      <p className={`text-xs ${n.read ? "text-slate-300" : "text-white font-black"}`}>
                        {!n.read && <span className="inline-block w-1.5 h-1.5 bg-neon-pink rounded-full mr-1.5 align-middle"></span>}
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{n.body}</p>
                    </button>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{when(n.created_at)}</span>
                      <button type="button" onClick={() => run(() => deleteNotifications.mutateAsync([n.id]))}
                        className="text-slate-400 hover:text-neon-pink font-bold">
                        EXCLUIR
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        ) : (
          <section className="space-y-3">
            <p className="text-[11px] text-slate-400">
              Crie alertas na página de um anúncio. Quando o vendedor baixar o preço até o seu alvo,
              você recebe uma notificação aqui. Também é possível criar um alerta pelo formulário abaixo.
            </p>
            <NewAlertForm user={user} products={products} alerts={alerts} />
            {alerts.length === 0 ? (
              <div className="text-center py-12 bg-noir-900/40 border border-dashed border-noir-800 text-xs text-slate-500">
                NENHUM ALERTA DE PREÇO CRIADO.
              </div>
            ) : (
              alerts.map((a) => (
                <AlertRow key={a.id} alert={a} product={productById(a.product_id)}
                  busy={updateAlert.isPending || deleteAlert.isPending}
                  onUpdate={(id, data) => run(() => updateAlert.mutateAsync({ id, data }))}
                  onDelete={(id) => run(() => deleteAlert.mutateAsync(id))} />
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}
