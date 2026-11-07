import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import AdminTabs from "../components/AdminTabs";
import { useAdminRefunds, useReleaseRefund } from "../hooks/useAdmin";
import { formatBRL } from "../utils/format";

// Fluxo do reembolso: pending (vendedor deve pagar) → paid (aguarda o admin) → released (conta liberada).
const STATUS = {
  pending: { label: "[PENDENTE]", style: "border-neon-amber text-neon-amber", order: 1 },
  paid: { label: "[PAGO]", style: "border-neon-cyan text-neon-cyan", order: 0 },
  released: { label: "[LIBERADO]", style: "border-neon-mint text-neon-mint", order: 2 },
};
const when = (iso) => (iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—");

export default function AdminRefunds() {
  const { data: refunds = [], isLoading, isError, error } = useAdminRefunds();
  const releaseRefund = useReleaseRefund();
  const [feedback, setFeedback] = useState({ id: "", type: "", text: "" });

  // Só ordenação de exibição: os que dependem do admin aparecem primeiro.
  const sorted = [...refunds].sort(
    (a, b) => (STATUS[a.status]?.order ?? 9) - (STATUS[b.status]?.order ?? 9)
      || String(b.created_at || "").localeCompare(String(a.created_at || "")),
  );

  const onRelease = async (refund) => {
    setFeedback({ id: refund.id, type: "", text: "" });
    try {
      await releaseRefund.mutateAsync(refund.id);
      setFeedback({ id: refund.id, type: "ok", text: `Reembolso liberado. A conta de ${refund.seller_handle} foi reavaliada.` });
    } catch (err) {
      setFeedback({ id: refund.id, type: "error", text: err.message });
    }
  };

  return (
    <div className="min-h-screen pb-nav text-slate-100 bg-noir-950 font-code">
      <Header title="NULL" titleHighlight="REEMBOLSOS" subtitle="CONSOLE DO ADMINISTRADOR // PIX" backLink="/admin" badgeText="ROOT" badgeType="pink" />
      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <AdminTabs />

        <p className="text-[10px] text-slate-400 bg-noir-900 border border-slate-800 p-3 leading-relaxed">
          A conta do vendedor só volta a comprar e anunciar depois que você libera o reembolso.
          Só é possível liberar reembolsos já confirmados (pagos) pelo vendedor.
        </p>

        {isLoading ? (
          <p className="text-xs text-neon-cyan animate-pulse">CARREGANDO_REEMBOLSOS...</p>
        ) : isError ? (
          <p role="alert" className="text-xs font-bold text-neon-pink">⚠ {error.message}</p>
        ) : sorted.length === 0 ? (
          <p className="text-xs text-slate-500 bg-noir-900/40 border border-dashed border-noir-800 p-4 text-center">
            NENHUM REEMBOLSO REGISTRADO.
          </p>
        ) : (
          sorted.map((refund) => {
            const status = STATUS[refund.status] || { label: `[${String(refund.status).toUpperCase()}]`, style: "border-slate-500 text-slate-400" };
            const busy = releaseRefund.isPending && releaseRefund.variables === refund.id;
            const mine = feedback.id === refund.id;
            return (
              <article key={refund.id} className="bg-noir-900 border border-slate-700 p-3 chamfer-box space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-black text-white">{formatBRL(refund.amount)}</p>
                    <p className="text-[10px] text-slate-400 break-all">{refund.id} // PEDIDO {refund.order_id}</p>
                  </div>
                  <span className={`shrink-0 border px-2 py-0.5 text-[10px] font-bold ${status.style}`}>{status.label}</span>
                </div>

                <div className="text-[10px] text-slate-400 space-y-0.5">
                  <p>
                    VENDEDOR:{" "}
                    <Link to={`/profile?handle=${encodeURIComponent(refund.seller_handle || "")}`} className="text-neon-cyan font-bold hover:underline">
                      {refund.seller_handle || refund.seller_id}
                    </Link>
                    {" → "}COMPRADOR: <span className="text-slate-200">{refund.buyer_handle || refund.buyer_id}</span>
                  </p>
                  {refund.item_titles?.length > 0 && <p className="break-words">ITENS: {refund.item_titles.join(", ")}</p>}
                  <p>
                    ABERTO: {when(refund.created_at)}
                    {refund.paid_at && ` · PAGO: ${when(refund.paid_at)}`}
                    {refund.released_at && ` · LIBERADO: ${when(refund.released_at)}`}
                  </p>
                </div>

                {refund.status === "pending" && (
                  <p className="text-[10px] text-neon-amber">Aguardando confirmação do vendedor.</p>
                )}
                {refund.status !== "released" && (
                  <button type="button" onClick={() => onRelease(refund)} disabled={refund.status !== "paid" || busy}
                    className="w-full py-2.5 bg-neon-mint text-noir-950 font-black chamfer-tag text-[10px] tracking-wider disabled:opacity-30 disabled:cursor-not-allowed">
                    {busy ? "LIBERANDO..." : "LIBERAR"}
                  </button>
                )}
                {mine && feedback.text && (
                  <p role={feedback.type === "error" ? "alert" : "status"}
                    className={`text-[10px] font-bold ${feedback.type === "error" ? "text-neon-pink" : "text-neon-mint"}`}>
                    {feedback.type === "error" ? "⚠" : "✓"} {feedback.text}
                  </p>
                )}
              </article>
            );
          })
        )}
      </main>
    </div>
  );
}
