import React from "react";
import { NavLink } from "react-router-dom";
import { useNavItems } from "./navItems";
import { CountBadge } from "./Navbar";

// Navegação principal no topo, só no lg+ (abaixo disso fica a Navbar inferior).
// Usada pelo Header e pelos cabeçalhos locais (DropAsset, AuthShell). Itens em navItems.js.
const baseItem =
  "relative flex items-center gap-1.5 px-3 py-2 min-h-[40px] font-code text-xs font-bold tracking-wide border-b-2 transition-colors";
const linkClass = ({ isActive }) =>
  `${baseItem} ${isActive ? "text-neon-pink border-neon-pink" : "text-slate-400 border-transparent hover:text-neon-cyan"}`;

export default function DesktopNav({ className = "" }) {
  const items = useNavItems();

  return (
    <nav aria-label="Navegação principal" className={`hidden lg:block ${className}`}>
      {/* Itens centralizados horizontalmente; quebram linha se faltar espaço. */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        {items.map((item) =>
          item.highlight ? (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `mx-2 px-4 py-2 min-h-[36px] flex items-center bg-neon-pink text-white font-code text-xs font-bold chamfer-tag glow-pink border border-white/20 transition-all hover:brightness-110 ${isActive ? "ring-1 ring-white/60" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ) : (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} aria-label={item.ariaLabel}>
              <span className="relative font-pixel text-lg leading-none" aria-hidden="true">
                {item.icon}
                <CountBadge value={item.count} />
              </span>
              <span className={item.badge ? "ml-1.5" : ""}>{item.label}</span>
            </NavLink>
          )
        )}
      </div>
    </nav>
  );
}
