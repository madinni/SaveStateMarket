import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "../components/Header";
import FieldError from "../components/FieldError";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../hooks/useProducts";
import { useGames } from "../hooks/useGames";
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
import { alertSchema, alertTargetSchema, PLATFORMS } from "../schemas";
import { listingsForAlert, normalizeAlertTitle } from "../utils/alerts";

const TYPE_ICON = { OFFER: "◈", PRICE_ALERT: "▼", REVIEW: "★", ORDER: "▣", REFUND: "↺", MODERATION: "⚑", TICKET: "?" };
const TYPE_COLOR = {
  OFFER: "text-neon-cyan",
  PRICE_ALERT: "text-neon-amber",
  REVIEW: "text-neon-mint",
  ORDER: "text-neon-mint",
  REFUND: "text-neon-pink",
  MODERATION: "text-neon-pink",
  TICKET: "text-neon-cyan",
};

const brl = (v) => `R$ ${Number(v).toFixed(2)}`;
const when = (iso) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const inputClass =
  "w-full bg-noir-950 border-2 border-slate-600 p-2 text-slate-100 text-xs focus:outline-none focus:border-neon-amber";

function AlertRow({ alert, products, userId, busy, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(alertTargetSchema),
    defaultValues: { target_price: alert.target_price },
  });

  const listings = listingsForAlert(alert, products, userId).sort((a, b) => a.price - b.price);
  const cheapest = listings[0];
  const triggeredProduct = products.find((p) => String(p.id) === String(alert.triggered_product_id));

  const submit = async ({ target_price }) => {
    // Alterar o alvo de um alerta já disparado o reativa (o servidor confere os anúncios na hora).
    await onUpdate(alert.id, { target_price, active: true });
    setEditing(false);
  };

  return (
    <div className="bg-noir-900 border border-noir-800 p-3 chamfer-box space-y-2 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-white truncate">{alert.title}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {alert.platform || "QUALQUER PLATAFORMA"} · ALVO: <strong className="text-neon-mint">{brl(alert.target_price)}</strong>
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {cheapest ? (
              <>
                MENOR ANÚNCIO AGORA:{" "}
                <Link to={`/product/${cheapest.id}`} className="text-neon-cyan underline">{brl(cheapest.price)}</Link>
                {listings.length > 1 ? ` (${listings.length} anúncios)` : ""}
              </>
            ) : (
              "NENHUM ANÚNCIO DESTE TÍTULO NO MOMENTO"
            )}
          </p>
        </div>
        <span className={`shrink-0 border px-2 py-0.5 text-[10px] font-bold ${alert.active ? "border-neon-amber text-neon-amber" : "border-neon-mint text-neon-mint"}`}>
          {alert.active ? "[ATIVO]" : "[DISPARADO]"}
        </span>
      </div>

      {!alert.active && alert.triggered_at && (
        <p className="text-[10px] text-slate-400">
          Disparado em {when(alert.triggered_at)} com um anúncio a {brl(alert.triggered_price)}.{" "}
          {triggeredProduct && (
            <Link to={`/product/${triggeredProduct.id}`} className="text-neon-cyan underline">ver anúncio</Link>
          )}
        </p>
      )}

      {editing ? (
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-2">
          <input type="number" step="0.01" aria-label="Novo alvo" {...register("target_price")} className={inputClass} />
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
          <button type="button" onClick={() => setEditing(true)}
            className="px-2.5 py-1 border border-neon-cyan text-neon-cyan text-[10px] font-bold">
            {alert.active ? "ALTERAR ALVO" : "REATIVAR"}
          </button>
          <button type="button" onClick={() => onDelete(alert.id)} disabled={busy}
            className="px-2.5 py-1 border border-neon-pink text-neon-pink text-[10px] font-bold disabled:opacity-50">
            REMOVER
          </button>
        </div>
      )}
    </div>
  );
}

// Novo alerta pelo TÍTULO do jogo. Ex.: "GTA VI" até R$ 200, mesmo sem anúncio publicado.
function NewAlertForm() {
  const createAlert = useCreateAlert();
  const { data: games = [] } = useGames();
  const [error, setError] = useState("");
  const [created, setCreated] = useState("");

  const titles = useMemo(() => [...new Set(games.map((g) => g.title))].sort(), [games]);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(alertSchema),
    defaultValues: { title: "", platform: "", target_price: "" },
  });

  // Se o título existe no catálogo, só aparecem as plataformas em que o jogo existe.
  // Título fora do catálogo (ex.: lançamento novo) libera todas as plataformas.
  const typedTitle = normalizeAlertTitle(watch("title"));
  const selectedPlatform = watch("platform");
  const catalogPlatforms = useMemo(
    () => [...new Set(games.filter((g) => normalizeAlertTitle(g.title) === typedTitle).map((g) => g.platform))],
    [games, typedTitle],
  );
  const platformOptions = catalogPlatforms.length
    ? PLATFORMS.filter((p) => catalogPlatforms.includes(p.value))
        .concat(catalogPlatforms.filter((v) => !PLATFORMS.some((p) => p.value === v)).map((v) => ({ value: v, label: v })))
    : PLATFORMS;

  // Trocou o título e a plataforma escolhida não vale mais para ele: volta para "qualquer".
  useEffect(() => {
    if (selectedPlatform && !platformOptions.some((p) => p.value === selectedPlatform)) {
      setValue("platform", "");
    }
  }, [platformOptions, selectedPlatform, setValue]);

  const onSubmit = async ({ title, platform, target_price }) => {
    setError("");
    setCreated("");
    try {
      const alert = await createAlert.mutateAsync({ title, platform: platform || null, target_price });
      setCreated(
        alert.active
          ? `Alerta criado: avisaremos quando "${alert.title}" estiver por ${brl(alert.target_price)} ou menos.`
          : `Já existe um anúncio de "${alert.title}" no seu alvo! Confira suas notificações.`,
      );
      reset({ title: "", platform: "", target_price: "" });
    } catch (err) {
      setError(err.message || "Não foi possível criar o alerta.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate
      className="bg-noir-900 border border-neon-amber/50 p-3 chamfer-box space-y-3 text-xs">
      <p className="text-neon-amber font-bold">▼ NOVO ALERTA DE PREÇO</p>

      <div>
        <label htmlFor="new-alert-title" className="block text-[10px] text-slate-400 mb-1">TÍTULO DO JOGO</label>
        <input id="new-alert-title" list="alert-title-options" placeholder="Ex: GTA VI" autoComplete="off"
          {...register("title")} className={inputClass} />
        <datalist id="alert-title-options">
          {titles.map((t) => <option key={t} value={t} />)}
        </datalist>
        <FieldError error={errors.title} />
      </div>

      <div>
        <label htmlFor="new-alert-platform" className="block text-[10px] text-slate-400 mb-1">PLATAFORMA (OPCIONAL)</label>
        <select id="new-alert-platform" {...register("platform")} className={inputClass}>
          <option value="">
            {catalogPlatforms.length === 1 ? `Qualquer (só existe em ${platformOptions[0].label})` : "Qualquer plataforma"}
          </option>
          {platformOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        {catalogPlatforms.length > 0 && (
          <p className="mt-1 text-[10px] text-slate-500">Plataformas em que este jogo existe no catálogo.</p>
        )}
      </div>

      <div>
        <label htmlFor="new-alert-target" className="block text-[10px] text-slate-400 mb-1">ME AVISE QUANDO HOUVER ANÚNCIO POR ATÉ (R$)</label>
        <input id="new-alert-target" type="number" step="0.01" placeholder="Ex: 200" {...register("target_price")} className={inputClass} />
        <FieldError error={errors.target_price} />
      </div>

      <button type="submit" disabled={createAlert.isPending}
        className="w-full py-2 bg-neon-amber text-noir-950 text-[11px] font-black disabled:opacity-50">
        {createAlert.isPending ? "CRIANDO..." : "ATIVAR ALERTA"}
      </button>

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

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

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
              O alerta é do jogo, não de um anúncio: quando qualquer vendedor anunciar o título pelo seu
              preço alvo ou menos, você recebe uma notificação aqui.
            </p>
            <NewAlertForm />
            {alerts.length === 0 ? (
              <div className="text-center py-12 bg-noir-900/40 border border-dashed border-noir-800 text-xs text-slate-500">
                NENHUM ALERTA DE PREÇO CRIADO.
              </div>
            ) : (
              alerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  products={products}
                  userId={user.id}
                  busy={updateAlert.isPending || deleteAlert.isPending}
                  onUpdate={(id, data) => run(() => updateAlert.mutateAsync({ id, data }))}
                  onDelete={(id) => run(() => deleteAlert.mutateAsync(id))}
                />
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}
