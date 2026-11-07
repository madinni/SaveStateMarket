import React from 'react';
import CrtToggle from "./CrtToggle";
import DesktopNav from "./DesktopNav";
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header({
  title = "NULL",
  subtitle = "MERCADO DE MÍDIA FÍSICA RETRÔ",
  titleHighlight = "EXCHANGE",
  backLink = null,
  backText = "<< VOLTAR",
  badgeText = null,
  badgeType = "mint", // "mint", "pink", "cyan", "amber"
  showAuth = false,
  customAction = null
}) {
  const { user } = useAuth();

  // Mapeamento de cores para badges e indicadores
  const badgeStyles = {
    mint: "border-neon-mint/30 text-neon-mint bg-noir-900",
    pink: "border-neon-pink/40 text-neon-pink bg-noir-900",
    cyan: "border-neon-cyan/30 text-neon-cyan bg-noir-900",
    amber: "border-neon-amber/40 text-neon-amber bg-noir-900"
  };

  return (
    <header className="sticky top-0 z-40 bg-noir-950/85 backdrop-blur-md border-b border-noir-700/60">
      {/* A faixa interna acompanha a largura do conteúdo das páginas no desktop. */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Lado Esquerdo: Navegação de Retorno ou Logo/Identificador */}
        <div className="flex items-center space-x-3 min-w-0">
          {backLink ? (
            <>
              <Link
                to={backLink}
                className="text-neon-cyan hover:text-white text-xs font-code flex items-center gap-1 shrink-0 transition-colors py-2"
              >
                {backText}
              </Link>
              <div className="h-4 w-px bg-noir-700"></div>
            </>
          ) : (
            <Link to="/" aria-label="Ir para o início" className="w-2.5 h-2.5 bg-neon-pink animate-pulse shrink-0"></Link>
          )}

          <div className="min-w-0">
            <h1 className="font-pixel text-2xl md:text-3xl tracking-widest text-white leading-none truncate">
              {title}
              <span className="text-neon-cyan">//</span>
              <span className="text-neon-pink">{titleHighlight}</span>
            </h1>
            {subtitle && (
              <p className="font-code text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Lado Direito: Ações customizadas, Badge de Sistema ou Chip de Autenticação */}
        <div className="flex items-center gap-2 shrink-0">
          <CrtToggle />
          {customAction && customAction}

          {/* Atalho do administrador só entre sm e lg (no celular fica na Navbar; no lg+ na DesktopNav) */}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="hidden sm:inline-block lg:hidden px-2.5 py-1 bg-noir-900 border border-neon-amber text-neon-amber text-xs font-code font-bold chamfer-tag hover:bg-neon-amber hover:text-noir-950 transition-all"
            >
              [ADMIN]
            </Link>
          )}

          {/* Badge de segurança / status opcional */}
          {badgeText && (
            <span className={`font-code text-[11px] sm:text-xs border px-2 py-0.5 chamfer-tag ${badgeStyles[badgeType] || badgeStyles.mint}`}>
              {badgeText}
            </span>
          )}

          {/* Bloco de Login/Autenticação Reativo */}
          {showAuth && (
            <div className="flex items-center gap-2">
              <Link
                to="/sell"
                className="hidden sm:inline-block lg:hidden px-2.5 py-1 bg-noir-900 border border-neon-pink text-neon-pink text-xs font-code chamfer-tag hover:bg-neon-pink hover:text-white transition-all"
              >
                + ANUNCIAR
              </Link>

              {user ? (
                <Link
                  to="/profile"
                  className="px-2.5 py-1 bg-noir-900 border border-neon-mint/60 hover:border-neon-mint text-neon-mint text-xs font-code chamfer-tag flex items-center space-x-1.5 transition-all glow-mint"
                >
                  <span className="w-1.5 h-1.5 bg-neon-mint rounded-full animate-ping"></span>
                  <span className="font-bold truncate max-w-[100px] md:max-w-[160px]">{user.handle}</span>
                </Link>
              ) : (
                <Link
                  to="/entrar"
                  className="px-2.5 py-1 bg-noir-800 border border-noir-700 hover:border-neon-cyan text-neon-cyan text-xs font-code chamfer-tag font-bold transition-all"
                >
                  [ENTRAR]
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop (lg+): navegação principal no topo, no lugar da barra inferior. */}
      <div className="hidden lg:block border-t border-noir-800/80">
        <DesktopNav className="max-w-6xl mx-auto px-4" />
      </div>
    </header>
  );
}
