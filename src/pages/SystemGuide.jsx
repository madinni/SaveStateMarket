import React from 'react';
import { Link } from 'react-router-dom';

export default function SystemGuide() {
  return (
    <div className="min-h-screen pb-24 text-slate-200">
      <header className="sticky top-0 z-40 bg-noir-950/85 backdrop-blur-md border-b border-noir-700/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-neon-mint animate-pulse"></div>
          <h1 className="font-pixel text-2xl tracking-widest text-white leading-none">
            SYSTEM<span className="text-neon-cyan">//</span>GUIDE
          </h1>
        </div>
        <span className="font-code text-[10px] text-neon-cyan border border-neon-cyan/30 px-2 py-0.5 chamfer-tag bg-noir-900">
          DOCS_V1
        </span>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="bg-noir-900/90 border border-noir-700 p-4 chamfer-box space-y-2">
          <div className="flex items-center space-x-2 text-neon-cyan font-code text-xs font-bold">
            <span className="font-pixel text-lg">01</span>
            <h2>// BENCHMARK DE PREÇOS (CHEAPSHARK API)</h2>
          </div>
          <p className="text-[11px] font-code text-slate-300 leading-relaxed">
            Comparamos o preço da mídia usada anunciada com a cotação média digital em lojas como Steam, GOG e PlayStation Store, exibindo a porcentagem real de economia diretamente no card do jogo.
          </p>
        </div>

        <div className="bg-noir-900/90 border border-noir-700 p-4 chamfer-box space-y-2">
          <div className="flex items-center space-x-2 text-neon-pink font-code text-xs font-bold">
            <span className="font-pixel text-lg">02</span>
            <h2>// CUSTÓDIA (ESCROW PROTOCOL)</h2>
          </div>
          <p className="text-[11px] font-code text-slate-300 leading-relaxed">
            O valor da compra permanece retido em custódia até que o comprador confirme o recebimento e o funcionamento correto da mídia física (disco ou cartucho).
          </p>
        </div>

        <div className="text-center pt-2">
          <Link to="/ticket" className="block w-full py-2.5 bg-noir-800 hover:bg-neon-cyan hover:text-noir-950 text-neon-cyan border border-neon-cyan/40 font-code text-xs font-bold chamfer-tag transition-colors">
            [ ABRIR_TICKET_SUPORTE ]
          </Link>
        </div>
      </main>
    </div>
  );
}