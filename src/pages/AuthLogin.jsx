import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';

export default function AuthLogin() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('k3nji@null-exchange.net');
  const [password, setPassword] = useState('supersecretpassword');
  const [handle, setHandle] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const finalHandle = handle.startsWith('@') ? handle : `@${handle || 'Operative'}`;
        const newProf = {
          handle: finalHandle,
          email,
          password_hash: password,
          reputation: 5.0,
          total_transactions: 0,
          success_rate: 100,
          vault_balance: 0,
          clearance_level: "LEVEL_3"
        };
        const res = await fetch(`${API_URL}/profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProf)
        });
        const created = await res.json();
        login(created);
      } else {
        const res = await fetch(`${API_URL}/profiles?email=${encodeURIComponent(email)}&password_hash=${encodeURIComponent(password)}`);
        const users = await res.json();
        if (users.length === 0) throw new Error("Credenciais inválidas.");
        login(users[0]);
      }
      navigate('/profile');
    } catch (err) {
      alert(err.message || "Falha de autenticação.");
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-sm mx-auto flex flex-col justify-between text-slate-200">
      <header className="flex justify-between items-center text-xs font-code pb-4 border-b border-noir-800">
        <Link to="/" className="text-neon-cyan hover:text-white">&lt;&lt; RETURN_TO_FEED</Link>
        <span className="text-neon-mint border border-neon-mint/30 px-2 py-0.5 chamfer-tag">PORT: 3001</span>
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
          <button 
            onClick={() => setIsRegister(false)} 
            className={`py-2 chamfer-tag font-bold ${!isRegister ? 'bg-neon-pink text-white glow-pink' : 'text-slate-400'}`}
          >
            [LOGIN]
          </button>
          <button 
            onClick={() => setIsRegister(true)} 
            className={`py-2 chamfer-tag font-bold ${isRegister ? 'bg-neon-cyan text-noir-950 glow-cyan' : 'text-slate-400'}`}
          >
            [NOVO_OPERADOR]
          </button>
        </div>

        <form onSubmit={handleAuth} className="bg-noir-900/90 border border-noir-700 p-5 chamfer-box glow-pink space-y-4 font-code text-xs">
          {isRegister && (
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">// OPERATIVE_TAG (HANDLE)</label>
              <input 
                type="text" 
                placeholder="ex: K3nji_Zero"
                value={handle} 
                onChange={(e) => setHandle(e.target.value)} 
                className="w-full bg-noir-950 border border-noir-700 px-3 py-2 text-white focus:outline-none focus:border-neon-cyan"
              />
            </div>
          )}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">// NETWORK_IDENTIFIER (EMAIL)</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              className="w-full bg-noir-950 border border-noir-700 px-3 py-2 text-white focus:outline-none focus:border-neon-pink"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">// CIPHER_KEY (SENHA)</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              className="w-full bg-noir-950 border border-noir-700 px-3 py-2 text-white focus:outline-none focus:border-neon-pink"
            />
          </div>

          <button 
            type="submit" 
            className={`w-full py-3 font-bold uppercase chamfer-box tracking-widest ${isRegister ? 'bg-neon-cyan text-noir-950 glow-cyan' : 'bg-neon-pink text-white glow-pink'}`}
          >
            AUTORIZAR_ACESSO &gt;&gt;
          </button>
        </form>
      </main>

      <footer className="text-center font-code text-[9px] text-slate-600 pt-4">
        PROJECT_NULL // AUTH_PROTOCOL © 2026
      </footer>
    </div>
  );
}