import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';

export default function DropAsset() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('SUPER MARIO WORLD');
  const [platform, setPlatform] = useState('SNES (CART)');
  const [price, setPrice] = useState('95.00');
  const [hasBox, setHasBox] = useState(true);
  const [hasManual, setHasManual] = useState(true);
  const [isFunctional, setIsFunctional] = useState(true);
  const [previewImg, setPreviewImg] = useState(null);

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 600, 400);
        setPreviewImg(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title,
      platform,
      price: parseFloat(price) || 0,
      has_box: hasBox,
      has_manual: hasManual,
      is_functional: isFunctional,
      seller_handle: user ? user.handle : '@Visitante',
      condition_tag: !isFunctional ? '[DEFECTIVE]' : (hasBox ? '[CIB // 9.5]' : '[USED]'),
      image_url: previewImg || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
      created_at: new Date().toISOString()
    };

    try {
      await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      navigate('/');
    } catch (err) {
      alert("Falha na transmissão do ativo.");
    }
  };

  return (
    <div className="min-h-screen pb-28 text-slate-200">
      <header className="sticky top-0 z-40 bg-noir-950/90 backdrop-blur-md border-b border-noir-700/70 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="text-neon-cyan hover:text-white text-xs font-code">[ESC]</Link>
          <div className="h-4 w-px bg-noir-700"></div>
          <h1 className="font-pixel text-xl tracking-widest text-white leading-none">
            UPLOAD<span className="text-neon-pink">//</span>ASSET
          </h1>
        </div>
        <span className="font-code text-[10px] text-neon-mint border border-neon-mint/30 px-2 py-0.5 chamfer-tag bg-noir-900">
          SEC_LVL: 04
        </span>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4 font-code">
        {/* IDENTIFICAÇÃO DO OPERADOR */}
        <div className="bg-noir-900/80 border border-noir-700 p-2.5 chamfer-box flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-neon-mint animate-pulse"></span>
            <span className="text-slate-400">VENDEDOR:</span>
            <span className="text-neon-cyan font-bold">{user ? user.handle : '@Visitante (Anônimo)'}</span>
          </div>
          {!user && (
            <Link to="/login" className="text-[10px] text-neon-pink underline">[LOGAR]</Link>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* FOTO */}
          <div>
            <label className="block text-[11px] text-slate-400 uppercase mb-1">[01] Registro Visual da Mídia</label>
            <input type="file" id="asset-photo" accept="image/*" className="hidden" onChange={handleImage} />
            <div 
              onClick={() => document.getElementById('asset-photo').click()}
              className="w-full aspect-[16/9] border-2 border-dashed border-noir-700 hover:border-neon-pink bg-noir-900/60 chamfer-box flex items-center justify-center cursor-pointer overflow-hidden"
            >
              {previewImg ? (
                <img src={previewImg} alt="Preview" className="w-full h-full object-cover grayscale contrast-125" />
              ) : (
                <div className="text-center">
                  <p className="text-xs text-white font-bold">+ UPLOAD_RAW_SNAP</p>
                  <p className="text-[9px] text-slate-500">TOQUE PARA SELECIONAR FOTO</p>
                </div>
              )}
            </div>
          </div>

          {/* DADOS */}
          <div>
            <label className="block text-[11px] text-slate-400 uppercase mb-1">[02] Título do Jogo</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-noir-900 border border-noir-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-pink"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 uppercase mb-1">[03] Plataforma</label>
            <select 
              value={platform} 
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-noir-900 border border-noir-700 text-xs px-3 py-2 focus:outline-none focus:border-neon-pink"
            >
              <option value="SNES (CART)">Super Nintendo (SNES)</option>
              <option value="N64 (CART)">Nintendo 64</option>
              <option value="PS1 (DISC)">PlayStation 1</option>
              <option value="PS2 (DISC)">PlayStation 2</option>
              <option value="XBOX 360">Xbox 360</option>
              <option value="SWITCH (CART)">Nintendo Switch</option>
            </select>
          </div>

          {/* DIAGNOSTICO */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <label className="flex items-center space-x-2 bg-noir-900 border border-noir-700 p-2 cursor-pointer">
              <input type="checkbox" checked={hasBox} onChange={(e) => setHasBox(e.target.checked)} className="accent-neon-pink" />
              <span>Caixa Original</span>
            </label>
            <label className="flex items-center space-x-2 bg-noir-900 border border-noir-700 p-2 cursor-pointer">
              <input type="checkbox" checked={hasManual} onChange={(e) => setHasManual(e.target.checked)} className="accent-neon-pink" />
              <span>Manual Incluso</span>
            </label>
            <label className="flex items-center space-x-2 bg-noir-900 border border-neon-mint/60 p-2 cursor-pointer col-span-2">
              <input type="checkbox" checked={isFunctional} onChange={(e) => setIsFunctional(e.target.checked)} className="accent-neon-mint" />
              <span className="text-neon-mint font-bold">✓ MÍDIA TESTADA & 100% OPERACIONAL</span>
            </label>
          </div>

          {/* PREÇO */}
          <div>
            <label className="block text-[11px] text-slate-400 uppercase mb-1">[04] Preço Solicitado (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-noir-900 border border-noir-700 px-3 py-2 text-white font-pixel text-2xl focus:outline-none focus:border-neon-pink"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-neon-pink hover:bg-neon-pink/90 text-white font-bold py-3 text-xs uppercase chamfer-box glow-pink tracking-widest"
          >
            TRANSMIT_TO_NETWORK &gt;&gt;
          </button>
        </form>
      </main>
    </div>
  );
}