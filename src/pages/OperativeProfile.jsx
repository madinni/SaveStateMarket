import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';

export default function OperativeProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout, updateAvatar } = useAuth();
  
  const targetHandle = searchParams.get('handle');
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userProducts, setUserProducts] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Normalização segura
  const normalize = (v) => v ? decodeURIComponent(String(v)).replace(/[@\s]/g, '').toLowerCase().trim() : '';

  const isOwnProfile = !targetHandle || (user && normalize(user.handle) === normalize(targetHandle));

  useEffect(() => {
    // Guarda de acesso: deslogado sem targetHandle é redirecionado
    if (!targetHandle && !user) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const handleToSearch = targetHandle || user.handle;
        const clean = normalize(handleToSearch);

        // 1. Busca Operador
        const resProf = await fetch(`${API_URL}/profiles`);
        const allProfs = await resProf.json();
        const found = allProfs.find(p => normalize(p.handle) === clean) || {
          handle: handleToSearch,
          reputation: 5.0,
          total_transactions: 0,
          success_rate: 100,
          vault_balance: 0,
          clearance_level: "LEVEL_3"
        };
        setProfile(found);

        // 2. Busca Reviews do Operador
        if (found.id) {
          const resRev = await fetch(`${API_URL}/profile_reviews?profile_id=${found.id}&_sort=created_at&_order=desc`);
          const revData = await resRev.json();
          setReviews(revData);

          // Verifica se o usuário atual já fez review
          if (user) {
            const myRev = revData.find(r => normalize(r.author_handle) === normalize(user.handle));
            if (myRev) {
              setCommentText(myRev.comment);
              setRating(myRev.rating);
              setIsUpdating(true);
            }
          }
        }

        // 3. Busca Produtos do Operador
        const resProd = await fetch(`${API_URL}/products?_sort=created_at&_order=desc`);
        const prodData = await resProd.json();
        setUserProducts(prodData.filter(p => normalize(p.seller_handle) === clean));

      } catch (err) {
        console.error("Erro ao sincronizar dossiê:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [targetHandle, user, navigate]);

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, 200, 200);
        updateAvatar(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!commentText.trim()) return alert("Digite um comentário.");

    const payload = {
      profile_id: profile.id,
      author_handle: user.handle,
      rating: Number(rating),
      comment: commentText,
      badge: isUpdating ? '[UPDATED_REVIEW]' : '[VERIFIED_TRADE]',
      created_at: new Date().toISOString()
    };

    try {
      if (isUpdating) {
        const existing = reviews.find(r => normalize(r.author_handle) === normalize(user.handle));
        await fetch(`${API_URL}/profile_reviews/${existing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setReviews(reviews.map(r => r.id === existing.id ? { ...r, ...payload } : r));
      } else {
        const res = await fetch(`${API_URL}/profile_reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const created = await res.json();
        setReviews([created, ...reviews]);
        setIsUpdating(true);
      }
      alert("Feedback persistido com sucesso!");
    } catch (err) {
      alert("Falha na gravação do feedback.");
    }
  };

  const formatBRL = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading || !profile) {
    return <div className="p-10 text-center font-code text-neon-cyan">SYNCING_OPERATIVE_DOSSIER...</div>;
  }

  return (
    <div className="min-h-screen pb-24 text-slate-200">
      <header className="sticky top-0 z-40 bg-noir-950/85 backdrop-blur-md border-b border-noir-700/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-neon-mint animate-pulse"></div>
          <div>
            <h1 className="font-pixel text-2xl tracking-widest text-white leading-none">
              DOSSIER<span className="text-neon-cyan">//</span>{normalize(profile.handle).slice(0, 4).toUpperCase()}
            </h1>
            <p className="font-code text-[9px] text-slate-400">OPERATIVE_RECORD // {profile.clearance_level || 'LEVEL_3'}</p>
          </div>
        </div>
        {isOwnProfile ? (
          <button onClick={logout} className="px-2 py-1 bg-noir-900 border border-noir-700 text-slate-400 hover:text-neon-pink hover:border-neon-pink text-[10px] font-code chamfer-tag">
            [LOGOUT]
          </button>
        ) : (
          <Link to="/" className="px-2 py-1 bg-noir-900 border border-noir-700 text-neon-cyan text-[10px] font-code chamfer-tag">
            &lt;&lt; FEED
          </Link>
        )}
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* CARD IDENTIDADE */}
        <section className="bg-noir-900/90 border border-noir-700 p-4 chamfer-box glow-pink">
          <div className="flex items-center space-x-3.5">
            <div className="relative group">
              <input type="file" id="avatar-input" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <div 
                onClick={() => isOwnProfile && document.getElementById('avatar-input').click()}
                className={`w-16 h-16 bg-noir-800 border-2 border-neon-pink p-0.5 overflow-hidden chamfer-tag relative ${isOwnProfile ? 'cursor-pointer' : ''}`}
              >
                <img 
                  src={profile.avatar_url || "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=200&q=80"} 
                  alt="Avatar" 
                  className="w-full h-full object-cover grayscale contrast-150"
                />
                {isOwnProfile && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-noir-950/80 text-[8px] font-code text-neon-cyan font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>[EDIT]</span>
                    <span>PHOTO</span>
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-neon-mint border-2 border-noir-950"></span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white font-code truncate">{profile.handle}</h2>
                <span className="text-[9px] font-code text-neon-cyan bg-noir-950 px-1.5 py-0.5 border border-neon-cyan/40">
                  {isOwnProfile ? 'VERIFIED' : 'SELLER'}
                </span>
              </div>
              <p className="text-[10px] font-code text-slate-400 mt-0.5">ID: 0x{String(profile.id || '7D8CD670').slice(0, 8).toUpperCase()}</p>
              <p className="text-[10px] font-code text-neon-mint mt-1">REPUTATION: ★ {Number(profile.reputation || 5).toFixed(2)} ({profile.total_transactions || 0} TRANSACTIONS)</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-noir-800 text-center font-code">
            <div className="bg-noir-950 p-2 border border-noir-800/80">
              <span className="text-[8px] text-slate-500 block">SUCCESS_RATE</span>
              <span className="text-xs font-bold text-neon-mint font-pixel text-lg leading-none">{profile.success_rate || 100}%</span>
            </div>
            <div className="bg-noir-950 p-2 border border-noir-800/80">
              <span className="text-[8px] text-slate-500 block">ACTIVE_DROPS</span>
              <span className="text-xs font-bold text-neon-cyan font-pixel text-lg leading-none">{String(userProducts.length).padStart(2, '0')}</span>
            </div>
            <div className="bg-noir-950 p-2 border border-noir-800/80">
              <span className="text-[8px] text-slate-500 block">VAULT_BALANCE</span>
              <span className="text-xs font-bold text-neon-pink font-pixel text-lg leading-none">{formatBRL(profile.vault_balance || 0).split(',')[0]}</span>
            </div>
          </div>
        </section>

        {/* CARTEIRA (APENAS PROPRIETÁRIO) */}
        {isOwnProfile && (
          <section className="bg-noir-900 border border-neon-cyan/40 p-3 chamfer-box flex justify-between items-center glow-cyan">
            <div>
              <span className="text-[9px] font-code text-neon-cyan block">NULL_ESCROW // CARTEIRA</span>
              <p className="text-base font-pixel text-white leading-none mt-0.5">
                {formatBRL(profile.vault_balance || 0)} <span className="text-[10px] text-slate-400 font-code font-normal">EM CUSTÓDIA</span>
              </p>
            </div>
            <button onClick={() => alert('Saque PIX autorizado.')} className="px-3 py-1.5 bg-noir-800 hover:bg-neon-cyan hover:text-noir-950 text-neon-cyan border border-neon-cyan text-[10px] font-code font-bold chamfer-tag">
              [SACAR_SALDO]
            </button>
          </section>
        )}

        {/* ANÚNCIOS DO OPERADOR */}
        <section className="space-y-2">
          <div className="flex border-b border-noir-800 pb-1 text-xs font-code text-white font-bold">
            <span>ANÚNCIOS REGISTRADOS ({userProducts.length})</span>
          </div>
          {userProducts.length === 0 ? (
            <div className="bg-noir-900 border border-noir-800 p-4 text-center font-code text-xs text-slate-500">
              NENHUM ITEM PUBLICADO POR ESTE OPERADOR.
            </div>
          ) : (
            userProducts.map(p => (
              <Link to={`/product/${p.id}`} key={p.id} className="bg-noir-900 border border-noir-800 p-2.5 flex items-center justify-between hover:border-neon-pink transition-colors block">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 bg-noir-800 border border-noir-700 shrink-0 overflow-hidden">
                    <img src={p.image_url} alt="" className="w-full h-full object-cover filter grayscale" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white font-code truncate uppercase">{p.title}</h3>
                    <p className="text-[10px] text-slate-500 font-code">{p.platform} // {p.condition_tag}</p>
                  </div>
                </div>
                <p className="font-pixel text-neon-cyan text-lg">{formatBRL(p.price)}</p>
              </Link>
            ))
          )}
        </section>

        {/* REPUTATION SYSTEM */}
        {!isOwnProfile && (
          user ? (
            <section className="bg-noir-900/90 border border-noir-700 p-3.5 chamfer-box space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-code text-neon-cyan font-bold">
                  {isUpdating ? 'ALTERAR SEU FEEDBACK' : 'REGISTRAR FEEDBACK NO DOSSIÊ'}
                </span>
                <span className="text-[9px] font-code text-slate-500">{isUpdating ? 'EDIT_MODE' : 'NEW_ENTRY'}</span>
              </div>
              <form onSubmit={handleReviewSubmit} className="space-y-2">
                <textarea 
                  rows="2"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Relate a experiência da negociação..."
                  className="w-full bg-noir-950 border border-noir-700 px-3 py-2 text-xs font-code text-white placeholder-slate-600 focus:outline-none focus:border-neon-pink resize-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-code text-slate-400">NOTA:</span>
                    <select 
                      value={rating} 
                      onChange={(e) => setRating(e.target.value)}
                      className="bg-noir-950 border border-noir-700 text-neon-mint text-xs font-code px-2 py-1"
                    >
                      <option value="5">★ ★ ★ ★ ★ (5.0)</option>
                      <option value="4">★ ★ ★ ★ ☆ (4.0)</option>
                      <option value="3">★ ★ ★ ☆ ☆ (3.0)</option>
                      <option value="2">★ ★ ☆ ☆ ☆ (2.0)</option>
                      <option value="1">★ ☆ ☆ ☆ ☆ (1.0)</option>
                    </select>
                  </div>
                  <button type="submit" className="py-1.5 px-4 bg-neon-pink text-white font-code text-xs font-bold chamfer-tag glow-pink">
                    {isUpdating ? '[ATUALIZAR_LOG]' : '[GRAVAR_LOG]'}
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <div className="bg-noir-900/90 border border-noir-700 p-4 chamfer-box text-center space-y-2">
              <p className="text-[11px] font-code text-neon-amber font-bold">CLEARANCE_REQUIRED // ACESSO RESTRITO</p>
              <p className="text-[10px] font-code text-slate-400">Faça login para registrar feedback neste dossiê.</p>
              <Link to="/login" className="inline-block px-3 py-1.5 bg-neon-cyan text-noir-950 font-code text-xs font-bold chamfer-tag">
                [AUTORIZAR_ACESSO]
              </Link>
            </div>
          )
        )}

        {/* FEEDBACK LIST */}
        <section className="space-y-2">
          <div className="flex justify-between items-center border-b border-noir-800 pb-1 text-xs font-code text-white font-bold">
            <span>REPUTATION_LOGS ({reviews.length})</span>
          </div>
          {reviews.length === 0 ? (
            <div className="bg-noir-900 border border-noir-800 p-4 text-center font-code text-xs text-slate-500">
              NENHUM FEEDBACK REGISTRADO AINDA.
            </div>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="bg-noir-900 border border-noir-800 p-3 chamfer-box space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-code">
                  <span className="text-white font-bold">{r.author_handle}</span>
                  <span className="text-neon-mint">{"★".repeat(r.rating || 5)}</span>
                </div>
                <p className="text-xs font-code text-slate-300 bg-noir-950 p-2 border border-noir-800/60 leading-relaxed">
                  "{r.comment}"
                </p>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}