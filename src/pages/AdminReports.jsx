import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import AdminTabs from "../components/AdminTabs";
import { useAdminDeleteProduct, useAdminReports, useDismissReport } from "../hooks/useAdmin";
import { REPORT_REASONS } from "../schemas";

const STATUS = {
  OPEN: ["[ABERTA]", "border-neon-pink text-neon-pink"],
  DISMISSED: ["[ARQUIVADA]", "border-slate-500 text-slate-400"],
  RESOLVED_REMOVED: ["[ANÚNCIO REMOVIDO]", "border-neon-mint text-neon-mint"],
};
const reasonLabel = (value) => REPORT_REASONS.find((r) => r.value === value)?.label || value;
const when = (iso) => (iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—");

export default function AdminReports() {
  const { data: reports = [], isLoading, isError, error } = useAdminReports();
  const dismissReport = useDismissReport();
  const deleteProduct = useAdminDeleteProduct();
  const [confirming, setConfirming] = useState(null); // denúncia cujo anúncio será removido
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const onDismiss = async (report) => {
    setFeedback({ type: "", text: "" });
    try {
      await dismissReport.mutateAsync(report.id);
      setFeedback({ type: "ok", text: `Denúncia ${report.id} arquivada.` });
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  const onConfirmRemove = async () => {
    const report = confirming;
    setFeedback({ type: "", text: "" });
    try {
      const result = await deleteProduct.mutateAsync(report.product_id);
      const resolved = Number(result?.resolved_reports ?? 0);
      setFeedback({
        type: "ok",
        text: `Anúncio "${report.product_title}" removido e vendedor notificado. ${resolved} denúncia(s) encerrada(s).`,
      });
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setConfirming(null);
    }
  };

  return (
    <div className="min-h-screen pb-28 text-slate-100 bg-noir-950 font-code">
      <Header title="NULL" titleHighlight="DENÚNCIAS" subtitle="CONSOLE DO ADMINISTRADOR // MODERAÇÃO" backLink="/admin" badgeText="ROOT" badgeType="pink" />
      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <AdminTabs />

        {feedback.text && (
          <p role={feedback.type === "error" ? "alert" : "status"}
            className={`text-[11px] font-bold border bg-noir-900 p-3 ${feedback.type === "error" ? "text-neon-pink border-neon-pink/50" : "text-neon-mint border-neon-mint/50"}`}>
            {feedback.type === "error" ? "⚠" : "✓"} {feedback.text}
          </p>
        )}

        {isLoading ? (
          <p className="text-xs text-neon-cyan animate-pulse">CARREGANDO_DENÚNCIAS...</p>
        ) : isError ? (
          <p role="alert" className="text-xs font-bold text-neon-pink">⚠ {error.message}</p>
        ) : reports.length === 0 ? (
          <p className="text-xs text-slate-500 bg-noir-900/40 border border-dashed border-noir-800 p-4 text-center">
            NENHUMA DENÚNCIA REGISTRADA.
          </p>
        ) : (
          reports.map((report) => {
            const [label, style] = STATUS[report.status] || [`[${report.status}]`, "border-slate-500 text-slate-400"];
            const isOpen = report.status === "OPEN";
            // O servidor informa se o anúncio ainda existe (product_exists).
            const exists = Boolean(report.product_exists);
            return (
              <article key={report.id}
                className={`bg-noir-900 border p-3 chamfer-box space-y-2 text-xs ${isOpen ? "border-neon-pink/50" : "border-slate-800 opacity-80"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {exists ? (
                      <Link to={`/product/${report.product_id}`} className="font-black text-neon-cyan hover:underline break-words">
                        {report.product_title}
                      </Link>
                    ) : (
                      <p className="font-black text-slate-300 break-words">
                        {report.product_title} <span className="text-[10px] text-slate-500">(anúncio já removido)</span>
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 break-all">{report.id} // ANÚNCIO {report.product_id}</p>
                  </div>
                  <span className={`shrink-0 border px-2 py-0.5 text-[10px] font-bold ${style}`}>{label}</span>
                </div>

                <div className="text-[10px] text-slate-400 space-y-0.5">
                  <p>MOTIVO: <span className="text-neon-amber font-bold">{reasonLabel(report.reason)}</span></p>
                  <p>
                    VENDEDOR: <span className="text-slate-200">{report.seller_handle || report.seller_id}</span>
                    {" · "}DENUNCIANTE: <span className="text-slate-200">{report.reporter_handle || report.reporter_id}</span>
                  </p>
                  <p>
                    {when(report.created_at)}
                    {report.resolved_at && ` · RESOLVIDA: ${when(report.resolved_at)}`}
                  </p>
                </div>

                {report.details && (
                  <p className="text-[11px] text-slate-300 bg-noir-950 border border-slate-800 p-2 leading-relaxed whitespace-pre-wrap break-words">
                    {report.details}
                  </p>
                )}

                {isOpen && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button type="button" onClick={() => setConfirming(report)} disabled={!exists || deleteProduct.isPending}
                      className="py-2.5 bg-neon-pink text-white font-black chamfer-tag text-[10px] tracking-wider disabled:opacity-30">
                      REMOVER ANÚNCIO
                    </button>
                    <button type="button" onClick={() => onDismiss(report)} disabled={dismissReport.isPending}
                      className="py-2.5 bg-noir-800 border border-slate-500 text-slate-200 font-bold chamfer-tag text-[10px] tracking-wider disabled:opacity-40">
                      {dismissReport.isPending && dismissReport.variables === report.id ? "ARQUIVANDO..." : "ARQUIVAR"}
                    </button>
                  </div>
                )}
              </article>
            );
          })
        )}
      </main>

      {confirming && (
        <div className="fixed inset-0 z-50 bg-noir-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="confirm-remove-title"
            className="bg-noir-900 border-2 border-neon-pink p-5 max-w-sm w-full chamfer-box glow-pink space-y-4 font-code text-xs">
            <h3 id="confirm-remove-title" className="font-black text-white uppercase tracking-wider">REMOVER ANÚNCIO?</h3>
            <p className="text-slate-300 leading-relaxed">
              O anúncio <span className="text-neon-cyan font-bold">{confirming.product_title}</span> de{" "}
              {confirming.seller_handle} será apagado junto com as propostas e mensagens, e todas as denúncias
              abertas dele serão encerradas. Esta ação não pode ser desfeita.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setConfirming(null)} disabled={deleteProduct.isPending}
                className="py-2.5 bg-noir-800 text-slate-200 border border-slate-600 font-bold chamfer-tag">
                CANCELAR
              </button>
              <button type="button" onClick={onConfirmRemove} disabled={deleteProduct.isPending}
                className="py-2.5 bg-neon-pink text-white font-black chamfer-tag disabled:opacity-50">
                {deleteProduct.isPending ? "REMOVENDO..." : "CONFIRMAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
