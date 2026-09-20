import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../context/AuthContext';

export default function SupportTicket() {
  const [category, setCategory] = useState('Mídia com Defeito');
  const [report, setReport] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, report, created_at: new Date().toISOString() })
      });
      setSuccess(true);
    } catch {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen pb-24 text-slate-200 font-code">
      <header className="sticky top-0 z-40 bg-noir-950/90 backdrop-blur-md border-b border-noir-700/70 px-4 py-3 flex items-center justify-between">
        <Link to="/help" className="text-neon-cyan hover:text-white text-xs flex items-center gap-1">
          &lt;&lt; DOCS
        </Link>
        <h1 className="font-pixel text-xl tracking-widest text-white leading-none">
          DISPATCH<span className="text-neon-pink">//</span>TICKET
        </h1>
        <span className="text-[10px] text-neon-pink border border-neon-pink/40 px-2 py-0.5 chamfer-tag">
          HIGH_PRIORITY
        </span>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <form onSubmit={handleSubmit} className="bg-noir-900/90 border border-noir-700 p-4 chamfer-box glow-pink space-y-4 text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">// CATEGORIA</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-noir-950 border border-noir-700 p-2 text-white">
              <option value="Mídia com Defeito">Mídia com Defeito</option>
              <option value="Saldo / Custódia">Saldo / Custódia</option>
              <option value="Divergência Preço">Divergência Preço</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">// RELATÓRIO DO OCORRIDO</label>
            <textarea 
              rows="4" 
              required
              value={report} 
              onChange={(e) => setReport(e.target.value)} 
              placeholder="Descreva o incidente..."
              className="w-full bg-noir-950 border border-noir-700 p-3 text-white focus:outline-none focus:border-neon-pink"
            />
          </div>

          <button type="submit" className="w-full bg-neon-pink text-white font-bold py-3 uppercase chamfer-box glow-pink tracking-widest">
            TRANSMITIR_DISPATCH &gt;&gt;
          </button>
        </form>

        {success && (
          <div className="fixed inset-0 z-50 bg-noir-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-noir-900 border border-neon-mint p-5 max-w-xs w-full chamfer-box text-center space-y-3">
              <div className="w-3 h-3 bg-neon-mint mx-auto animate-ping"></div>
              <h3 className="text-xs font-bold text-white uppercase">TICKET ABERTO COM SUCESSO</h3>
              <p className="text-[10px] text-slate-400">PROTOCOLO: #TCK-9902-NX</p>
              <Link to="/help" className="block w-full py-2 bg-noir-800 text-neon-mint border border-neon-mint/40 text-xs font-bold chamfer-tag">
                [RETORNAR_AO_GUIA]
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}