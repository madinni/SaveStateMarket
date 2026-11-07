import React from "react";
import { NavLink } from "react-router-dom";
import { useNavItems } from "./navItems";

// Barra inferior: só abaixo de lg. No lg+ a mesma navegação aparece no topo (DesktopNav).
// Celular: ícone em cima e rótulo embaixo. Tablet (md): dock flutuante, ícone e rótulo na mesma linha.
const baseItem =
  "relative flex flex-col md:flex-row items-center gap-0 md:gap-1.5 px-1 md:px-2 py-1 md:py-2 min-w-[40px] transition-colors";
const activeClass = `${baseItem} text-neon-pink`;
const inactiveClass = `${baseItem} text-slate-400 hover:text-neon-cyan`;
const linkClass = ({ isActive }) => (isActive ? activeClass : inactiveClass);

const labelClass = "font-code text-[10px] md:text-xs tracking-tight md:tracking-normal";
const iconClass = "font-pixel text-lg md:text-xl leading-none";

// Contador sobre o ícone (carrinho, notificações). Também usado pela DesktopNav.
export function CountBadge({ value }) {
  if (!value) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute -top-1 -right-2.5 min-w-[16px] h-[16px] px-0.5 bg-neon-pink text-white text-[10px] font-code leading-[16px] text-center rounded-full"
    >
      {value > 9 ? "9+" : value}
    </span>
  );
}

export default function Navbar() {
  const items = useNavItems();

  return (
    <nav
      aria-label="Navegação principal"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-noir-950/95 backdrop-blur-lg border-t border-noir-700/80 px-2 py-2
        md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:border md:border-noir-700 md:px-4 nav-dock"
    >
      <div className="flex justify-between md:justify-center items-center max-w-md md:max-w-none mx-auto md:gap-1">
        {items.map((item) =>
          item.highlight ? (
            <NavLink
              key={item.to}
              to={item.to}
              className="bg-neon-pink text-white px-2.5 py-2.5 md:px-4 md:py-2 md:mx-2 chamfer-box glow-pink hover:scale-105 active:scale-95 transition-all -mt-5 md:mt-0 border border-white/20 flex items-center justify-center"
            >
              <span className="font-code text-xs font-bold leading-none">{item.label}</span>
            </NavLink>
          ) : (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} aria-label={item.ariaLabel}>
              <span className={`relative ${iconClass}`} aria-hidden="true">
                {item.icon}
                <CountBadge value={item.count} />
              </span>
              <span className={labelClass}>{item.label}</span>
            </NavLink>
          )
        )}
      </div>
    </nav>
  );
}
