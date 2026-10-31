import React from "react";
import { usePriceReference } from "../hooks/usePriceReference";
import { compareWithReference } from "../services/priceReference";
import { formatBRL } from "../utils/format";

export default function PriceBenchmark({ product }) {
  const { data: ref, isLoading, isError } = usePriceReference(product.title);
  const price = Number(product.price ?? 0);
  const diff = compareWithReference(price, ref);

  if (isLoading) {
    return (
      <div className="bg-noir-950 p-3 border border-neon-cyan/40 text-xs">
        <span className="text-neon-cyan animate-pulse">// CONSULTANDO_BENCHMARK_EXTERNO...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="bg-noir-950 p-3 border border-neon-pink text-xs text-neon-pink font-bold">
        ⚠ BENCHMARK INDISPONÍVEL NO MOMENTO. TENTE NOVAMENTE MAIS TARDE.
      </div>
    );
  }

  if (!ref?.found) {
    return (
      <div className="bg-noir-950 p-3 border border-slate-800 text-xs space-y-1">
        <span className="text-slate-300 font-bold">// BENCHMARK DE PREÇO</span>
        <p className="text-slate-500">
          SEM REFERÊNCIA EXTERNA. A CheapShark cobre apenas jogos digitais de PC e este título não foi encontrado.
        </p>
      </div>
    );
  }

  const cheaper = diff <= 0;
  const tone = cheaper ? "text-neon-mint border-neon-mint" : "text-neon-amber border-neon-amber";

  return (
    <div className="bg-noir-950 p-3 border border-neon-cyan/40 text-xs space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-neon-cyan font-bold">// BENCHMARK DE PREÇO</span>
        <span className={`border px-2 py-0.5 text-[10px] font-bold ${tone}`}>
          {Math.abs(diff).toFixed(1)}% {cheaper ? "ABAIXO" : "ACIMA"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-noir-900 border border-slate-800 p-2">
          <span className="block text-[9px] text-slate-500">PREÇO ANUNCIADO</span>
          <span className="font-pixel text-xl text-neon-cyan leading-none">{formatBRL(price)}</span>
        </div>
        <div className="bg-noir-900 border border-slate-800 p-2">
          <span className="block text-[9px] text-slate-500">REFERÊNCIA DIGITAL</span>
          <span className="font-pixel text-xl text-white leading-none">{formatBRL(ref.price_brl)}</span>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 leading-relaxed">
        Fonte: {ref.source} • Correspondência: {ref.matched_title} • US$ {Number(ref.price_usd).toFixed(2)} × R${" "}
        {Number(ref.usd_brl).toFixed(2)}
        {ref.fx_estimated ? " (câmbio estimado)" : ""} • Atualizado em{" "}
        {new Date(ref.fetched_at).toLocaleDateString("pt-BR")}
      </p>
      <p className="text-[10px] text-slate-500 leading-relaxed">
        A referência é o menor preço atual da versão digital (PC). Mídias físicas de colecionador podem valer mais.
      </p>
    </div>
  );
}