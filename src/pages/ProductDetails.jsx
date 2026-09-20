import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../context/AuthContext';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const formatBRL = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) {
    return <div className="p-10 text-center font-code text-neon-cyan">LOADING_ITEM_DATA...</div>;
  }

  if (!product) {
    return <div className="p-10 text-center font-code text-neon-pink">ITEM_NOT_FOUND // 404</div>;
  }

  const price = Number(product.price) || 0;
  const estimatedDigital = price > 0 ? (price * 1.7) : 100;
  const discount = Math.round(((estimatedDigital - price) / estimatedDigital) * 100);

  return (
    <div className="min-h-screen pb-32 text-slate-200">
      <header className="sticky top-0 z-40 bg-noir-950/90 backdrop-blur-md border-b border-noir-700/70 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="text-neon-cyan hover:text-white text-xs font-code flex items-center gap-1">
            &lt;&lt; CATALOG
          </Link>
          <div className="h-4 w-px bg-noir-700"></div>
          <h1 className="font-pixel text-xl tracking-widest text-white leading-none">
            ITEM<span className="text-neon-pink">//</span>{String(product.id).slice(0, 8).toUpperCase()}
          </h1>
        </div>
        <span className="font-code text-[10px] text-neon-mint border border-neon-mint/30 px-2 py-0.5 chamfer-tag bg-noir-900">
          AVAILABLE
        </span>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* SNAP */}
        <div className="bg-noir-900 border border-noir-700 chamfer-box overflow-hidden relative">
          <div className="relative aspect-[4/3] bg-noir-950 flex items-center justify-center">
            <img 
              src={product.image_url} 
              alt={product.title} 
              className="w-full h-full object-cover grayscale contrast-125 opacity-90"
            />
            <div className="absolute top-3 left-3 bg-noir-950/90 border border-neon-pink text-neon-pink text-[10px] font-code px-2 py-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-neon-pink animate-pulse"></span>
              <span>REC // VERIFIED_SNAP</span>
            </div>
            <div className="absolute bottom-3 right-3 bg-noir-950/90 text-slate-300 text-[10px] font-code px-2 py-0.5 border border-noir-700">
              {product.platform}
            </div>
          </div>
        </div>

        {/* TITULO E VENDEDOR */}
        <div className="space-y-1">
          <div className="flex justify-between items-start gap-2">
            <h2 className="text-base font-bold text-white font-code uppercase leading-tight">
              {product.title}
            </h2>
            <span className="font-code text-[10px] text-neon-mint bg-noir-900 border border-neon-mint/30 px-2 py-0.5 shrink-0">
              {product.condition_tag || '[USED]'}
            </span>
          </div>
          <p className="text-xs font-code text-slate-400">
            Vendido por: <Link to={`/profile?handle=${encodeURIComponent(product.seller_handle)}`} className="text-neon-cyan hover:underline font-bold">
              {product.seller_handle}
            </Link>
          </p>
        </div>

        {/* BENCHMARK */}
        <div className="bg-noir-900/90 border border-neon-cyan/50 p-3.5 chamfer-box glow-cyan space-y-2 font-code">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-neon-mint flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-neon-mint rounded-full animate-ping"></span>
              BENCHMARK_SCANNER // SYNCED
            </span>
            <span className="text-slate-500">API: CHEAPSHARK</span>
          </div>
          <div className="grid grid-cols-2 gap-2 bg-noir-950 p-2.5 border border-noir-800 text-xs">
            <div>
              <span className="text-[9px] text-slate-500 block">ESTIMATIVA DIGITAL</span>
              <span className="text-slate-400 line-through">{formatBRL(estimatedDigital)}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-500 block">ESTA OFERTA</span>
              <span className="text-neon-cyan font-pixel text-2xl leading-none">{formatBRL(price)}</span>
              <span className="text-[10px] text-neon-mint block font-bold">-{discount}% DE ECONOMIA</span>
            </div>
          </div>
        </div>

        {/* DIAGNOSTICO */}
        <div className="bg-noir-900 border border-noir-800 p-3.5 space-y-2 chamfer-box font-code">
          <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
            <span className="text-neon-pink">■</span> DIAGNÓSTICO DE ESTADO DA MÍDIA
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center space-x-2 bg-noir-950 p-2 border border-noir-800">
              <span className={product.has_box ? "text-neon-mint font-bold" : "text-slate-600"}>
                {product.has_box ? "✓" : "✕"}
              </span>
              <span className="text-slate-300">Caixa Original (Box)</span>
            </div>
            <div className="flex items-center space-x-2 bg-noir-950 p-2 border border-noir-800">
              <span className={product.has_manual ? "text-neon-mint font-bold" : "text-slate-600"}>
                {product.has_manual ? "✓" : "✕"}
              </span>
              <span className="text-slate-300">Manual Incluso</span>
            </div>
            <div className={`flex items-center space-x-2 bg-noir-950 p-2 border col-span-2 ${product.is_functional ? 'border-neon-mint/40 text-slate-300' : 'border-neon-amber/60 text-neon-amber'}`}>
              <span className="font-bold">{product.is_functional ? "✓" : "⚠"}</span>
              <span>{product.is_functional ? "Mídia Testada & 100% Operacional" : "Mídia com Defeito (Para Peças)"}</span>
            </div>
          </div>
        </div>
      </main>

      {/* COMPRA FIXA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-noir-950/95 backdrop-blur-lg border-t border-noir-700/80 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <div>
            <span className="text-[9px] font-code text-slate-500 block">TOTAL À VISTA</span>
            <p className="text-neon-cyan font-pixel text-2xl leading-none">{formatBRL(price)}</p>
          </div>
          <Link 
            to={`/offers?id=${product.id}`}
            className="py-3 px-3 bg-noir-800 hover:bg-noir-700 text-neon-cyan border border-neon-cyan/50 text-[10px] font-code font-bold chamfer-tag transition-all"
          >
            [PROPOR_OFERTA]
          </Link>
          <button 
            onClick={() => setModalOpen(true)}
            className="flex-1 bg-neon-pink hover:bg-neon-pink/90 text-white font-code font-bold py-3 px-3 text-xs uppercase chamfer-box glow-pink"
          >
            COMPRAR &gt;&gt;
          </button>
        </div>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-noir-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-noir-900 border border-neon-pink p-5 max-w-xs w-full chamfer-box glow-pink space-y-4 font-code text-center">
            <div className="w-3 h-3 bg-neon-pink mx-auto animate-ping"></div>
            <h4 className="text-sm font-bold text-white uppercase">CONFIRMAR COMPRA DIRETA?</h4>
            <p className="text-xs text-slate-300">
              O valor de <span className="text-neon-cyan font-bold">{formatBRL(price)}</span> ficará retido em custódia até você testar a mídia física.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={() => setModalOpen(false)} className="py-2 bg-noir-800 text-slate-400 border border-noir-700 chamfer-tag text-xs">
                [CANCELAR]
              </button>
              <Link to="/profile" className="py-2 bg-neon-pink text-white font-bold chamfer-tag text-xs flex items-center justify-center">
                [AUTORIZAR]
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}