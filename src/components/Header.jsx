import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header({
  title = "NULL",
  subtitle = "DISTRICT 03 :: BLACK_MARKET",
  titleHighlight = "EXCHANGE",
  backLink = null,
  backText = "<< ESC",
  badgeText = null,
  badgeType = "mint", // "mint", "pink", "cyan"
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
    <header className="sticky top-0 z-40 bg-noir-950/85 backdrop-blur-md border-b border-noir-700/60 px-4 py-3 flex items-center justify-between">
      {/* Lado Esquerdo: Navegação de Retorno ou Logo/Identificador */}
      <div className="flex items-center space-x-3 min-w-0">
        {backLink ? (
          <>
            <Link
              to={backLink}
              className="text-neon-cyan hover:text-white text-xs font-code flex items-center gap-1 shrink-0 transition-colors"
            >
              {backText}
            </Link>
            <div className="h-4 w-px bg-noir-700"></div>
          </>
        ) : (
          <div className="w-2.5 h-2.5 bg-neon-pink animate-pulse shrink-0"></div>
        )}

        <div className="truncate">
          <h1 className="font-pixel text-2xl tracking-widest text-white leading-none truncate">
            {title}
            <span className="text-neon-cyan">//</span>
            <span className="text-neon-pink">{titleHighlight}</span>
          </h1>
          {subtitle && (
            <p className="font-code text-[9px] text-slate-400 tracking-tighter truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Lado Direito: Ações customizadas, Badge de Sistema ou Chip de Autenticação */}
      <div className="flex items-center space-x-2 shrink-0">
        {customAction && customAction}

        {/* Badge de segurança / status opcional */}
        {badgeText && (
          <span className={`font-code text-[10px] border px-2 py-0.5 chamfer-tag ${badgeStyles[badgeType] || badgeStyles.mint}`}>
            {badgeText}
          </span>
        )}

        {/* Bloco de Login/Autenticação Reativo */}
        {showAuth && (
          <div className="flex items-center space-x-2">
            <Link
              to="/sell"
              className="hidden sm:inline-block px-2.5 py-1 bg-noir-900 border border-neon-pink text-neon-pink text-[10px] font-code chamfer-tag hover:bg-neon-pink hover:text-white transition-all"
            >
              +DROP_ASSET
            </Link>

            {user ? (
              <Link
                to="/profile"
                className="px-2.5 py-1 bg-noir-900 border border-neon-mint/60 hover:border-neon-mint text-neon-mint text-[11px] font-code chamfer-tag flex items-center space-x-1.5 transition-all glow-mint"
              >
                <span className="w-1.5 h-1.5 bg-neon-mint rounded-full animate-ping"></span>
                <span className="font-bold truncate max-w-[100px]">{user.handle}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-2.5 py-1 bg-noir-800 border border-noir-700 hover:border-neon-cyan text-neon-cyan text-[11px] font-code chamfer-tag font-bold transition-all"
              >
                [AUTH]
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}