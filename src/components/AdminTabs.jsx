import React from "react";
import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/admin", label: "PAINEL", end: true },
  { to: "/admin/tickets", label: "TICKETS" },
  { to: "/admin/reembolsos", label: "REEMBOLSOS" },
  { to: "/admin/denuncias", label: "DENÚNCIAS" },
  { to: "/admin/games", label: "JOGOS" },
];

// Abas do painel do administrador (rolagem horizontal só dentro da própria barra no celular).
export default function AdminTabs() {
  const tabClass = ({ isActive }) =>
    `shrink-0 px-3 py-2 chamfer-tag text-[10px] font-bold tracking-wider border transition-colors ${
      isActive
        ? "bg-neon-pink text-white border-neon-pink glow-pink"
        : "bg-noir-900 text-slate-400 border-noir-700 hover:text-neon-cyan hover:border-neon-cyan"
    }`;

  return (
    <nav aria-label="Seções do administrador" className="flex gap-2 overflow-x-auto pb-1">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={tabClass}>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}