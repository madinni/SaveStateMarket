import React from "react";
import { Link, useLocation } from "react-router-dom";
import CrtToggle from "./CrtToggle";

// Moldura comum das telas públicas /entrar e /cadastrar.
export default function AuthShell({ children }) {
  const { pathname } = useLocation();
  const tab = (active, on) => `py-2 chamfer-tag font-bold text-center ${active ? on : "text-slate-400"}`;

  return (
    <div className="min-h-screen px-4 py-8 max-w-sm mx-auto flex flex-col justify-between text-slate-200">
      <header className="flex justify-between items-center text-xs font-code pb-4 border-b border-noir-800">
        <Link to="/" className="text-neon-cyan hover:text-white">&lt;&lt; RETURN_TO_FEED</Link>
        <div className="flex items-center space-x-2">
          <CrtToggle />
          <span className="text-neon-mint border border-neon-mint/30 px-2 py-0.5 chamfer-tag">JWT</span>
        </div>
      </header>

      <main className="space-y-6">
        <div className="text-center">
          <span className="font-pixel text-4xl text-white tracking-widest block">
            NULL<span className="text-neon-pink">//</span>AUTH
          </span>
          <span className="font-code text-[9px] text-neon-cyan tracking-widest block uppercase">
            District Protocol :: Clearance Required
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-noir-900 p-1 border border-noir-700 font-code text-xs">
          <Link to="/entrar" aria-current={pathname === "/entrar" ? "page" : undefined}
            className={tab(pathname === "/entrar", "bg-neon-pink text-white glow-pink")}>
            [ENTRAR]
          </Link>
          <Link to="/cadastrar" aria-current={pathname === "/cadastrar" ? "page" : undefined}
            className={tab(pathname === "/cadastrar", "bg-neon-cyan text-noir-950 glow-cyan")}>
            [NOVO_OPERADOR]
          </Link>
        </div>

        {children}
      </main>

      <footer className="text-center font-code text-[9px] text-slate-600 pt-4">
        PROJECT_NULL // AUTH_PROTOCOL © 2026
      </footer>
    </div>
  );
}
