import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import AdminTabs from "../components/AdminTabs";
import ChangePasswordForm from "../components/ChangePasswordForm";
import { useAdminReports, useAdminRefunds, useAdminTickets } from "../hooks/useAdmin";

// Resumo do que está esperando o administrador em cada fila.
function QueueCard({ to, title, query, countOf, hint, accent }) {
  const { data = [], isLoading, isError, error } = query;
  return (
    <Link to={to}
      className={`block bg-noir-900 border-2 ${accent.border} p-4 chamfer-box hover:bg-noir-800 transition-colors`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-black text-white tracking-wider">{title}</h2>
        <span className={`font-pixel text-3xl leading-none ${accent.text}`}>
          {isLoading ? "…" : isError ? "!" : countOf(data)}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-slate-400">
        {isError ? <span className="text-neon-pink">⚠ {error.message}</span> : hint}
      </p>
    </Link>
  );
}

export default function AdminPanel() {
  const tickets = useAdminTickets();
  const refunds = useAdminRefunds();
  const reports = useAdminReports();

  return (
    <div className="min-h-screen pb-nav text-slate-100 bg-noir-950 font-code">
      <Header title="NULL" titleHighlight="ADMIN" subtitle="CONSOLE DO ADMINISTRADOR" backLink="/" badgeText="ROOT" badgeType="pink" />
      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <AdminTabs />

        <QueueCard to="/admin/tickets" title="// TICKETS DE SUPORTE" query={tickets}
          countOf={(list) => list.filter((t) => t.status !== "CLOSED").length}
          hint="Tickets abertos ou em análise aguardando resposta."
          accent={{ border: "border-neon-cyan/60", text: "text-neon-cyan" }} />

        <QueueCard to="/admin/reembolsos" title="// REEMBOLSOS PIX" query={refunds}
          countOf={(list) => list.filter((r) => r.status === "paid").length}
          hint="Reembolsos pagos pelo vendedor aguardando liberação da conta."
          accent={{ border: "border-neon-amber/60", text: "text-neon-amber" }} />

        <QueueCard to="/admin/denuncias" title="// DENÚNCIAS DE ANÚNCIOS" query={reports}
          countOf={(list) => list.filter((r) => r.status === "OPEN").length}
          hint="Denúncias abertas aguardando análise."
          accent={{ border: "border-neon-pink/60", text: "text-neon-pink" }} />

        {/* A conta inicial do admin é de demonstração: troque a senha padrão por aqui. */}
        <ChangePasswordForm idPrefix="admin-pwd" />
      </main>
    </div>
  );
}
