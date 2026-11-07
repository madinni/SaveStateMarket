import React from "react";
import { Link, useLocation } from "react-router-dom";
import CrtToggle from "./CrtToggle";
import DesktopNav from "./DesktopNav";

// Moldura comum das telas públicas /entrar e /cadastrar.
// Celular: uma coluna. Desktop (lg+): apresentação à esquerda e formulário à direita.
export default function AuthShell({ children }) {
  const { pathname } = useLocation();
  const tab = (active, on) => `py-2.5 chamfer-tag font-bold text-center ${active ? on : "text-slate-400 hover:text-white"}`;

  return (
    <div className="min-h-screen px-4 pt-6 pb-nav max-w-md md:max-w-2xl lg:max-w-5xl mx-auto flex flex-col text-slate-200">
      <header className="flex justify-between items-center text-xs font-code pb-4 border-b border-noir-800">
        <Link to="/" className="text-neon-cyan hover:text-white py-2">&lt;&lt; VOLTAR AO INÍCIO</Link>
        <div className="flex items-center space-x-2">
          <CrtToggle />
          <span className="text-neon-mint border border-neon-mint/30 px-2 py-0.5 chamfer-tag">CONEXÃO SEGURA</span>
        </div>
      </header>

      {/* Desktop (lg+): navegação principal no topo (abaixo de lg fica a Navbar inferior). */}
      <DesktopNav className="border-b border-noir-800 py-1" />

      <main className="flex-1 pt-8 lg:grid lg:grid-cols-[1fr_1.3fr] lg:gap-12 lg:items-start space-y-6 lg:space-y-0">
        <div className="text-center lg:text-left lg:sticky lg:top-8 space-y-3">
          <span className="font-pixel text-5xl lg:text-7xl text-white tracking-widest block leading-none">
            NULL<span className="text-neon-pink">//</span>AUTH
          </span>
          <span className="font-code text-xs text-neon-cyan tracking-widest block uppercase">
            Entre ou crie sua conta
          </span>
          <ul className="hidden lg:block pt-4 space-y-2 font-code text-sm text-slate-300">
            <li><span className="text-neon-pink">■</span> Compre e venda mídia física retrô.</li>
            <li><span className="text-neon-cyan">■</span> Negocie preços direto com o vendedor.</li>
            <li><span className="text-neon-mint">■</span> Receba alertas quando o jogo baixar de preço.</li>
          </ul>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-1 bg-noir-900 p-1 border border-noir-700 font-code text-xs">
            <Link to="/entrar" aria-current={pathname === "/entrar" ? "page" : undefined}
              className={tab(pathname === "/entrar", "bg-neon-pink text-white glow-pink")}>
              [ENTRAR]
            </Link>
            <Link to="/cadastrar" aria-current={pathname === "/cadastrar" ? "page" : undefined}
              className={tab(pathname === "/cadastrar", "bg-neon-cyan text-noir-950 glow-cyan")}>
              [CRIAR CONTA]
            </Link>
          </div>

          {children}
        </div>
      </main>

      <footer className="text-center font-code text-xs text-slate-500 pt-8">
        NULL//EXCHANGE · SaveState Market © 2026
      </footer>
    </div>
  );
}
