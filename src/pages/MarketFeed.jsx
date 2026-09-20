import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';

export default function MarketFeed() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/products?_sort=created_at&_order=desc`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar catálogo:", err);
        setLoading(false);
      });
  }, []);

  const formatBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filtered = products.filter(p => {
    const matchCat = filter === 'ALL' || (p.platform && p.platform.toUpperCase().includes(filter));
    const matchSearch = !search || 
      (p.title && p.title.toLowerCase().includes(search.toLowerCase())) || 
      (p.platform && p.platform.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen pb-24 text-slate-200">
      {/* HEADER DA PÁGINA */}
      <header className="sticky top-0 z-40 bg-noir-950/85 backdrop-blur-md border-b border-noir-700/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-neon-pink animate-pulse"></div>
          <div>
            <h1 className="font-pixel text-2xl tracking-widest text-white leading-none">
              NULL<span className="text-neon-cyan">//</span>EXCHANGE
            </h1>
            <p className="font-code text-[9px] text-slate-400 tracking-tighter">DISTRICT 03 :: BLACK_MARKET</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/sell" className="hidden sm:inline-block px-2.5 py-1 bg-noir-900 border border-neon-pink text-neon-pink text-[10px] font-code chamfer-tag hover:bg-neon-pink hover:text-white transition-all">
            +DROP_ASSET
          </Link>
          {user ? (
            <Link to="/profile" className="px-2.5 py-1 bg-noir-900 border border-neon-mint/60 hover:border-neon-mint text-neon-mint text-[11px] font-code chamfer-tag flex items-center space-x-1.5 glow-mint">
              <span className="w-1.5 h-1.5 bg-neon-mint rounded-full animate-ping"></span>
              <span className="font-bold truncate max-w-[100px]">{user.handle}</span>
            </Link>
          ) : (
            <Link to="/login" className="px-2.5 py-1 bg-noir-800 border border-noir-700 hover:border-neon-cyan text-neon-cyan text-[11px] font-code chamfer-tag font-bold">
              [AUTH]
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-3 space-y-4">
        {/* BUSCA */}
        <div className="relative flex items-center">
          <span className="absolute left-3 text-neon-pink font-code text-sm">&gt;</span>
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH_TITLE || ID || PLATFORM..." 
            className="w-full bg-noir-900 border border-noir-700/80 rounded-none pl-8 pr-4 py-2.5 text-xs text-white placeholder-slate-500 font-code focus:outline-none focus:border-neon-cyan transition-all"
          />
        </div>

        {/* FILTROS */}
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none text-[11px] font-code">
          {['ALL', 'CART', 'DISC', 'SNES'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 font-bold chamfer-tag shrink-0 transition-all ${filter === cat ? 'bg-neon-pink text-white glow-pink' : 'bg-noir-800 text-slate-400 border border-noir-700'}`}
            >
              {cat === 'ALL' ? 'ALL_UNITS' : `[${cat}]`}
            </button>
          ))}
        </div>

        {/* SCANNER BANNER */}
        <div className="bg-noir-900/90 border border-neon-cyan/40 p-3.5 relative overflow-hidden glow-cyan chamfer-box">
          <div className="flex justify-between items-center mb-1">
            <span className="inline-flex items-center space-x-1.5 text-[10px] font-code text-neon-mint">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-mint animate-pulse"></span>
              <span>BENCHMARK_SCANNER // ACTIVE</span>
            </span>
            <span className="text-[9px] font-code text-slate-400">SYNC: JSON_SERVER_REST</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-slate-300 font-bold">Média de Desconto em Usados</p>
              <p className="text-[11px] text-slate-400 font-code">Economia vs. Mídia Digital</p>
            </div>
            <span className="text-neon-cyan font-pixel text-3xl leading-none">-42.8%</span>
          </div>
        </div>

        {/* LISTA */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="text-neon-pink">■</span> Disponíveis no Distrito
            </h2>
            <span className="text-[10px] font-code text-slate-500">
              UNITS_ONLINE: {String(filtered.length).padStart(2, '0')}
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center font-code text-xs text-neon-cyan animate-pulse">
              CONNECTING_DISTRICT_DATABASE...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-noir-900/40 border border-dashed border-noir-800 font-code text-xs text-slate-500">
              NENHUM ITEM DISPONÍVEL NO MOMENTO.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(item => (
                <Link 
                  to={`/product/${item.id}`} 
                  key={item.id}
                  className="bg-noir-900 border border-noir-700 hover:border-neon-pink transition-all flex flex-col justify-between group block"
                >
                  <div>
                    <div className="relative bg-noir-800 aspect-[3/4] overflow-hidden">
                      <img 
                        src={item.image_url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80"} 
                        alt={item.title}
                        className="w-full h-full object-cover opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300 filter grayscale contrast-125"
                      />
                      <div className={`absolute top-2 left-2 bg-noir-950/90 border ${item.is_functional === false ? 'border-neon-amber text-neon-amber' : 'border-neon-mint text-neon-mint'} text-[9px] font-code px-1.5 py-0.5`}>
                        {item.condition_tag || (item.has_box ? '[CIB // 9.5]' : '[USED]')}
                      </div>
                      <div className="absolute bottom-2 right-2 bg-noir-950/80 text-slate-300 text-[9px] font-code px-1">
                        {item.platform}
                      </div>
                    </div>
                    <div className="p-2.5">
                      <h3 className="text-xs font-bold text-white truncate group-hover:text-neon-pink uppercase">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-code truncate">
                        Vendedor: {item.seller_handle}
                      </p>
                      <div className="mt-2 pt-2 border-t border-noir-800 flex justify-between items-baseline">
                        <p className="text-neon-cyan font-pixel text-xl leading-none">
                          {formatBRL(item.price)}
                        </p>
                        <span className={`text-[9px] font-code ${item.is_functional === false ? 'text-neon-amber' : 'text-neon-mint'}`}>
                          {item.is_functional === false ? '[PEÇAS]' : '[DIRETO]'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-noir-800 group-hover:bg-neon-pink group-hover:text-white text-neon-pink border-t border-noir-700 text-[10px] font-code py-1.5 text-center transition-all">
                    [VER_DETALHES]
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}