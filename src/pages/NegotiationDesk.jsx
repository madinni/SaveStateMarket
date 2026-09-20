import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_URL } from '../context/AuthContext';

export default function NegotiationDesk() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');
  const [product, setProduct] = useState(null);
  const [offerVal, setOfferVal] = useState('');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (productId) {
      fetch(`${API_URL}/products/${productId}`)
        .then(res => res.json())
        .then(data => {
          setProduct(data);
          setOfferVal(String(Math.round((Number(data.price) || 100) * 0.85)));
        })
        .catch(() => setProduct(null));
    }
  }, [productId]);

  const formatBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen pb-28 text-slate-200">
      <header className="sticky top-0 z-40 bg-noir-950/85 backdrop-blur-md border-b border-noir-700/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-neon-cyan animate-pulse"></div>
          <div>
            <h1 className="font-pixel text-2xl tracking-widest text-white leading-none">
              NEGOTIATION<span className="text-neon-pink">//</span>DESK
            </h1>
            <p className="font-code text-[9px] text-slate-400">P2P_BARGAIN_SYSTEM // LIVE</p>
          </div>
        </div>
        <span className="font-code text-[10px] text-neon-mint border border-neon-mint/30 px-2 py-0.5 chamfer-tag bg-noir-900">
          ACTIVE_LOG
        </span>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4 font-code">
        {product && (
          <div className="bg-noir-900 border border-noir-700 p-3 chamfer-box flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <img src={product.image_url} alt="" className="w-12 h-12 border border-neon-cyan object-cover grayscale" />
              <div className="min-w-0">
                <h2 className="text-xs font-bold text-white uppercase truncate">{product.title}</h2>
                <p className="text-[10px] text-slate-400">{product.platform}</p>
              </div>
            </div>
            <p className="font-pixel text-neon-cyan text-xl">{formatBRL(product.price)}</p>
          </div>
        )}

        <div className="bg-noir-900/90 border border-neon-cyan/50 p-3.5 chamfer-box glow-cyan space-y-3">
          <span className="text-xs text-neon-mint font-bold block">◈ ENVIAR CONTRAPROPOSTA DIRETA</span>
          <div className="flex items-center bg-noir-950 border border-noir-700 px-3 py-1.5">
            <span className="text-neon-pink text-xs mr-2 font-bold">SUA OFERTA: R$</span>
            <input 
              type="number" 
              value={offerVal} 
              onChange={(e) => setOfferVal(e.target.value)}
              className="w-full bg-transparent text-white font-pixel text-xl focus:outline-none"
            />
          </div>
          <button 
            onClick={() => alert(`Proposta de ${formatBRL(offerVal)} enviada ao vendedor!`)}
            className="w-full py-2 bg-noir-800 hover:bg-neon-mint hover:text-noir-950 text-neon-mint border border-neon-mint/50 text-xs font-bold chamfer-tag"
          >
            [TRANSMITIR_PROPOSTA_AO_VENDEDOR]
          </button>
        </div>

        {/* PROPOSTA ATIVA DE EXEMPLO */}
        <div className="bg-noir-900 border border-neon-cyan/60 p-3.5 chamfer-box space-y-2.5">
          <div className="flex justify-between items-start">
            <span className="text-[9px] text-neon-cyan bg-noir-950 px-1.5 py-0.5 border border-neon-cyan/40">
              [CONTRAPROPOSTA -15%]
            </span>
            <p className="font-pixel text-neon-mint text-xl leading-none">{formatBRL(Number(product?.price || 100) * 0.85)}</p>
          </div>
          <p className="text-[10px] text-slate-300 bg-noir-950 p-2 border border-noir-800">
            <span className="text-neon-pink">&gt; Mensagem:</span> "Aceita fechar nesse valor no Pix com envio amanhã?"
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <button 
              onClick={() => setAccepted(true)} 
              className={`py-1.5 chamfer-tag font-bold transition-all ${accepted ? 'col-span-2 bg-neon-mint text-noir-950' : 'bg-noir-800 text-neon-mint border border-neon-mint/50'}`}
            >
              {accepted ? '[ACEITA // EM CUSTÓDIA]' : '[ACEITAR]'}
            </button>
            {!accepted && (
              <button onClick={(e) => e.target.closest('.chamfer-box').remove()} className="py-1.5 bg-noir-800 text-slate-400 border border-noir-700 chamfer-tag">
                [RECUSAR]
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}