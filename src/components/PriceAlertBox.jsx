import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import {
  useMyAlerts,
  useCreateAlert,
  useUpdateAlert,
  useDeleteAlert,
} from "../hooks/useNotifications";
import { makeAlertSchema } from "../schemas";
import FieldError from "./FieldError";

const brl = (v) => `R$ ${Number(v).toFixed(2)}`;

export default function PriceAlertBox({ product }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const { data: alerts = [] } = useMyAlerts(user?.id);
  const createAlert = useCreateAlert();
  const updateAlert = useUpdateAlert();
  const deleteAlert = useDeleteAlert();

  const currentPrice = Number(product.price);
  const schema = useMemo(() => makeAlertSchema(currentPrice), [currentPrice]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { target_price: "" } });

  const active = alerts.find((a) => a.product_id === product.id && a.active);
  const busy = createAlert.isPending || updateAlert.isPending || deleteAlert.isPending;

  const onSubmit = async ({ target_price }) => {
    setError("");
    try {
      if (active) {
        await updateAlert.mutateAsync({ id: active.id, data: { target_price } });
      } else {
        await createAlert.mutateAsync({
          user_id: user.id,
          product_id: product.id,
          product_title: product.title,
          target_price,
          price_at_creation: currentPrice,
          active: true,
          created_at: new Date().toISOString(),
        });
      }
      setEditing(false);
      reset();
    } catch (err) {
      setError(err.message || "Não foi possível salvar o alerta.");
    }
  };

  const onRemove = async () => {
    setError("");
    try {
      await deleteAlert.mutateAsync(active.id);
    } catch (err) {
      setError(err.message || "Não foi possível remover o alerta.");
    }
  };

  if (!user) {
    return (
      <p className="text-[11px] text-slate-400 bg-noir-950 border border-slate-800 p-3">
        <Link to="/login" className="text-neon-cyan underline font-bold">Faça login</Link>{" "}
        para criar um alerta de preço neste anúncio.
      </p>
    );
  }

  return (
    <div className="bg-noir-950 border border-slate-800 p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-neon-amber font-bold">▼ ALERTA DE PREÇO</span>
        <Link to="/notifications" className="text-[10px] text-neon-cyan underline">ver notificações</Link>
      </div>

      {active && !editing ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-slate-300">
            Avisaremos quando o preço chegar a <strong className="text-neon-mint">{brl(active.target_price)}</strong> ou menos.
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
      ) : !active && !editing ? (
        <button type="button" onClick={() => setEditing(true)}
          className="w-full py-2 border border-neon-amber text-neon-amber font-bold text-[11px] hover:bg-neon-amber/10">
          CRIAR ALERTA DE PREÇO
        </button>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
          <label htmlFor="alert-target" className="block text-[10px] text-slate-400">
            ME AVISE QUANDO O PREÇO CHEGAR A (R$) — ATUAL: {brl(currentPrice)}
          </label>
          <input id="alert-target" type="number" step="0.01" {...register("target_price")}
            className="w-full bg-noir-900 border-2 border-slate-600 p-2 text-slate-100 text-xs focus:outline-none focus:border-neon-amber" />
          <FieldError error={errors.target_price} />
          <div className="flex gap-2">
            <button type="button" onClick={() => { setEditing(false); reset(); }}
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
