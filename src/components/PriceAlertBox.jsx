import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { useMyAlerts, useCreateAlert, useUpdateAlert, useDeleteAlert } from "../hooks/useNotifications";
import { alertTargetSchema } from "../schemas";
import { normalizeAlertTitle } from "../utils/alerts";
import FieldError from "./FieldError";
import PriceInput from "./PriceInput";
import { notify } from "../utils/toast";

const brl = (v) => `R$ ${Number(v).toFixed(2)}`;

// O alerta é do JOGO (título), não deste anúncio: avisa quando qualquer
// anúncio do título aparecer pelo preço alvo ou menos.
export default function PriceAlertBox({ product }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [samePlatform, setSamePlatform] = useState(true);
  const [error, setError] = useState("");

  const { data: alerts = [] } = useMyAlerts(user?.id);
  const createAlert = useCreateAlert();
  const updateAlert = useUpdateAlert();
  const deleteAlert = useDeleteAlert();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(alertTargetSchema),
    defaultValues: { target_price: "" },
  });

  const key = normalizeAlertTitle(product.title);
  const active = alerts.find(
    (a) => a.active && normalizeAlertTitle(a.title) === key && (!a.platform || a.platform === product.platform),
  );
  const busy = createAlert.isPending || updateAlert.isPending || deleteAlert.isPending;

  const onSubmit = async ({ target_price }) => {
    setError("");
    try {
      if (active) {
        await updateAlert.mutateAsync({ id: active.id, data: { target_price } });
      } else {
        await createAlert.mutateAsync({
          title: product.title,
          platform: samePlatform ? product.platform : null,
          target_price,
        });
      }
      setEditing(false);
      reset({ target_price: "" });
      notify.success(active ? "Alvo do alerta atualizado." : "Alerta de preço ativado.");
    } catch (err) {
      setError(err.message || "Não foi possível salvar o alerta.");
      notify.error(err.message || "Não foi possível salvar o alerta.");
    }
  };

  const onRemove = async () => {
    setError("");
    try {
      await deleteAlert.mutateAsync(active.id);
      notify.success("Alerta removido.");
    } catch (err) {
      setError(err.message || "Não foi possível remover o alerta.");
      notify.error(err.message || "Não foi possível remover o alerta.");
    }
  };

  if (!user) {
    return (
      <p className="text-[11px] text-slate-400 bg-noir-950 border border-slate-800 p-3">
        <Link to="/entrar" className="text-neon-cyan underline font-bold">Entre</Link>{" "}
        para criar um alerta de preço para "{product.title}".
      </p>
    );
  }

  return (
    <div className="bg-noir-950 border border-slate-800 p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-neon-amber font-bold">▼ ALERTA DE PREÇO DO JOGO</span>
        <Link to="/notifications" className="text-[10px] text-neon-cyan underline">meus alertas</Link>
      </div>

      {active && !editing ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-slate-300">
            Avisaremos quando houver "{active.title}"{active.platform ? ` (${active.platform})` : ""} por{" "}
            <strong className="text-neon-mint">{brl(active.target_price)}</strong> ou menos.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setEditing(true); reset({ target_price: active.target_price }); }}
              className="px-2.5 py-1 border border-neon-cyan text-neon-cyan text-[10px] font-bold">
              ALTERAR
            </button>
            <button type="button" onClick={onRemove} disabled={busy}
              className="px-2.5 py-1 border border-neon-pink text-neon-pink text-[10px] font-bold disabled:opacity-50">
              REMOVER
            </button>
          </div>
        </div>
      ) : !editing ? (
        <button type="button" onClick={() => setEditing(true)}
          className="w-full py-2 border border-neon-amber text-neon-amber font-bold text-[11px] hover:bg-neon-amber/10">
          AVISAR QUANDO "{product.title.toUpperCase()}" BAIXAR DE PREÇO
        </button>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
          <label htmlFor="alert-target" className="block text-[10px] text-slate-400">
            ME AVISE QUANDO "{product.title}" ESTIVER POR ATÉ (R$) — ESTE ANÚNCIO: {brl(product.price)}
          </label>
          <PriceInput id="alert-target" placeholder="Ex: 150,00" {...register("target_price")}
            className="w-full bg-noir-900 border-2 border-slate-600 p-2 text-slate-100 text-xs focus:outline-none focus:border-neon-amber" />
          <FieldError error={errors.target_price} />
          {!active && (
            <label className="flex items-center gap-2 text-[10px] text-slate-300">
              <input type="checkbox" checked={samePlatform} onChange={(e) => setSamePlatform(e.target.checked)} />
              Só na plataforma {product.platform}
            </label>
          )}
          <p className="text-[10px] text-slate-500">
            Se o alvo for igual ou maior que um anúncio já publicado, o alerta dispara na hora.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setEditing(false); reset({ target_price: "" }); }}
              className="flex-1 py-1.5 bg-noir-800 text-slate-300 border border-slate-600 text-[11px] font-bold">
              CANCELAR
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 py-1.5 bg-neon-amber text-noir-950 text-[11px] font-black disabled:opacity-50">
              {active ? "SALVAR ALVO" : "ATIVAR ALERTA"}
            </button>
          </div>
        </form>
      )}

      {error && <p role="alert" className="text-[11px] font-bold text-neon-pink">⚠ {error}</p>}
    </div>
  );
}
