import React, { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { useProducts } from "../hooks/useProducts";
import { useMarketBenchmark } from "../hooks/usePriceReference";
import { PLATFORMS } from "../schemas";
import { formatBRL } from "../utils/format";
import { matchesTitle, normalizeText, suggestTitles } from "../utils/search";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80";

const SEARCH_DELAY_MS = 250; // espera uma pausa na digitação antes de buscar
const MAX_SUGGESTIONS = 6;

// Condição da mídia: cada marcado exige o item no anúncio.
const CONDITIONS = [
  { key: "has_box", label: "Com caixa" },
  { key: "has_manual", label: "Com manual" },
  { key: "is_functional", label: "Funcionando" },
];

const EMPTY_FILTERS = {
  platform: "",
  minPrice: "",
  maxPrice: "",
  has_box: false,
  has_manual: false,
  is_functional: false,
};

// Valor digitado no campo de preço → número (ou null se vazio/inválido).
const toPrice = (value) => {
  if (value === "" || value === null) return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const useDebouncedValue = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

// Campo de busca com sugestões (padrão ARIA combobox + listbox).
function SearchBox({ value, onChange, onPick, suggestions, isFuzzy }) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const showList = open && suggestions.length > 0;

  // Nova lista de sugestões: nenhuma opção destacada.
  useEffect(() => setActive(-1), [suggestions]);

  const pick = (title) => {
    onPick(title);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      if (suggestions.length) setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length) setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (showList && active >= 0) {
        e.preventDefault();
        pick(suggestions[active]);
      } else {
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      if (showList) setOpen(false);
      else onChange("");
    }
  };

  return (
    <div className="relative min-w-0">
      <label htmlFor={`${listId}-input`} className="sr-only">Buscar pelo título do jogo</label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-neon-pink font-code text-sm" aria-hidden="true">&gt;</span>
        <input
          id={`${listId}-input`}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-opt-${active}` : undefined}
          autoComplete="off"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder="Buscar pelo título do jogo..."
          className="w-full bg-noir-900 border border-noir-700/80 rounded-none pl-8 pr-10 py-3 text-sm text-white placeholder-slate-500 font-code focus:outline-none focus:border-neon-cyan transition-all"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Limpar busca"
            className="absolute right-1 w-9 h-9 text-slate-400 hover:text-neon-pink font-code text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Sugestões de título"
          className="absolute z-30 left-0 right-0 mt-1 bg-noir-900 border border-neon-cyan/60 glow-cyan font-code text-sm"
        >
          {isFuzzy && (
            <li role="presentation" className="px-3 pt-2 pb-1 text-xs text-neon-amber">
              Você quis dizer…
            </li>
          )}
          {suggestions.map((title, index) => (
            <li
              key={title}
              id={`${listId}-opt-${index}`}
              role="option"
              aria-selected={index === active}
              // mousedown (antes do blur) para o clique não fechar a lista sem escolher
              onMouseDown={(e) => {
                e.preventDefault();
                pick(title);
              }}
              onMouseEnter={() => setActive(index)}
              className={`px-3 py-2.5 cursor-pointer truncate ${index === active ? "bg-noir-700 text-neon-cyan" : "text-slate-200"}`}
            >
              {title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FiltersPanel({ filters, setFilter, platforms, onClear, activeCount, priceError }) {
  const chip = (selected) =>
    `px-3 py-2 text-xs font-code font-bold chamfer-tag transition-all ${
      selected ? "bg-neon-pink text-white glow-pink" : "bg-noir-800 text-slate-300 border border-noir-700 hover:border-neon-cyan"
    }`;
  const priceInput =
    "w-full bg-noir-950 border border-noir-700 px-3 py-2 text-sm text-white font-code placeholder-slate-600 focus:outline-none focus:border-neon-cyan";

  return (
    <div className="bg-noir-900/90 border border-noir-700 p-4 chamfer-box space-y-5 font-code">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">FILTROS</h2>
        <button
          type="button"
          onClick={onClear}
          disabled={activeCount === 0}
          className="text-xs text-neon-cyan hover:text-white disabled:text-slate-600"
        >
          Limpar filtros
        </button>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-bold text-slate-300 mb-2">Plataforma</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={!filters.platform} onClick={() => setFilter("platform", "")} className={chip(!filters.platform)}>
            TODAS
          </button>
          {platforms.map((p) => (
            <button
              key={p.value}
              type="button"
              title={p.label}
              aria-pressed={filters.platform === p.value}
              onClick={() => setFilter("platform", filters.platform === p.value ? "" : p.value)}
              className={chip(filters.platform === p.value)}
            >
              {p.value}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-bold text-slate-300 mb-2">Faixa de preço (R$)</legend>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="filter-min" className="block text-xs text-slate-400 mb-1">Mínimo</label>
            <input id="filter-min" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0"
              value={filters.minPrice} onChange={(e) => setFilter("minPrice", e.target.value)} className={priceInput} />
          </div>
          <div>
            <label htmlFor="filter-max" className="block text-xs text-slate-400 mb-1">Máximo</label>
            <input id="filter-max" type="number" min="0" step="0.01" inputMode="decimal" placeholder="Sem limite"
              value={filters.maxPrice} onChange={(e) => setFilter("maxPrice", e.target.value)} className={priceInput} />
          </div>
        </div>
        {priceError && <p role="alert" className="text-xs font-bold text-neon-amber">⚠ {priceError}</p>}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-bold text-slate-300 mb-2">Condição da mídia</legend>
        {CONDITIONS.map((c) => (
          <label key={c.key} className="flex items-center gap-2.5 text-sm text-slate-200 cursor-pointer min-h-[32px]">
            <input
              type="checkbox"
              checked={filters[c.key]}
              onChange={(e) => setFilter(c.key, e.target.checked)}
              className="w-4 h-4 accent-neon-mint"
            />
            {c.label}
          </label>
        ))}
      </fieldset>
    </div>
  );
}

export default function MarketFeed() {
  const { data: products = [], isLoading, isError } = useProducts();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false); // painel de filtros no celular
  const term = useDebouncedValue(search, SEARCH_DELAY_MS);

  // UC03: média da variação entre o preço anunciado e a referência digital externa.
  const benchmark = useMarketBenchmark(products);
  const benchValue = benchmark.isLoading
    ? "..."
    : benchmark.average === null
      ? "N/D"
      : `${benchmark.average > 0 ? "+" : ""}${benchmark.average.toFixed(1)}%`;

  // Lista oficial de plataformas + alguma que já exista em anúncio e não esteja nela.
  const platforms = useMemo(() => {
    const known = new Set(PLATFORMS.map((p) => p.value));
    const extra = [...new Set(products.map((p) => p.platform).filter((p) => p && !known.has(p)))]
      .map((value) => ({ value, label: value }));
    return [...PLATFORMS, ...extra];
  }, [products]);

  const titles = useMemo(() => products.map((p) => p.title), [products]);
  const suggestions = useMemo(() => suggestTitles(titles, term, MAX_SUGGESTIONS), [titles, term]);
  // Nenhum título contém o termo exato: as sugestões são aproximadas ("você quis dizer…").
  const normalizedTerm = normalizeText(term);
  const isFuzzy = Boolean(normalizedTerm) && !titles.some((t) => normalizeText(t).includes(normalizedTerm));

  const minPrice = toPrice(filters.minPrice);
  const maxPrice = toPrice(filters.maxPrice);
  const priceError =
    minPrice !== null && maxPrice !== null && minPrice > maxPrice
      ? "O preço mínimo é maior que o máximo."
      : "";

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const activeCount =
    (filters.platform ? 1 : 0) +
    (minPrice !== null ? 1 : 0) +
    (maxPrice !== null ? 1 : 0) +
    CONDITIONS.filter((c) => filters[c.key]).length;

  // A busca de texto olha só o título; a plataforma é um filtro à parte.
  const filtered = products.filter((p) => {
    const price = Number(p.price || 0);
    return (
      matchesTitle(p.title, term) &&
      (!filters.platform || p.platform === filters.platform) &&
      (minPrice === null || price >= minPrice) &&
      (maxPrice === null || price <= maxPrice) &&
      // Anúncio antigo sem is_functional conta como funcionando (igual ao selo do card).
      (!filters.has_box || p.has_box === true) &&
      (!filters.has_manual || p.has_manual === true) &&
      (!filters.is_functional || p.is_functional !== false)
    );
  });

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setSearch("");
  };

  return (
    <div className="min-h-screen pb-nav text-slate-200">
      <Header subtitle="MERCADO DE MÍDIA FÍSICA RETRÔ" showAuth />

      <main className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-4 pt-4 space-y-4">
        <div className="md:grid md:grid-cols-[minmax(0,1fr)_auto] md:gap-4 md:items-stretch space-y-4 md:space-y-0">
          <SearchBox
            value={search}
            onChange={setSearch}
            onPick={setSearch}
            suggestions={suggestions}
            isFuzzy={isFuzzy}
          />

          <div className="bg-noir-900/90 border border-neon-cyan/40 px-4 py-3 relative overflow-hidden glow-cyan chamfer-box flex justify-between items-center gap-4 min-w-0">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 text-xs font-code text-neon-mint">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-mint animate-pulse"></span>
                COMPARATIVO DE PREÇO {benchmark.isLoading ? "· ATUALIZANDO" : ""}
              </span>
              <p className="text-xs text-slate-300 font-code mt-0.5 break-words">
                Usado vs. digital · {benchmark.matched} de {benchmark.total} com referência
              </p>
            </div>
            <span className={`font-pixel text-3xl leading-none shrink-0 whitespace-nowrap ${benchmark.average > 0 ? "text-neon-amber" : "text-neon-cyan"}`}>
              {benchValue}
            </span>
          </div>
        </div>

        {/* Celular: filtros recolhíveis. Desktop: barra lateral sempre visível. */}
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-controls="feed-filters"
          className="lg:hidden w-full py-2.5 bg-noir-900 border border-noir-700 text-sm font-code font-bold text-neon-cyan chamfer-tag"
        >
          {showFilters ? "▲ OCULTAR FILTROS" : "▼ FILTROS"}{activeCount ? ` (${activeCount})` : ""}
        </button>

        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6 lg:items-start">
          <aside id="feed-filters" className={`${showFilters ? "block" : "hidden"} lg:block sticky-panel mb-4 lg:mb-0`}>
            <FiltersPanel
              filters={filters}
              setFilter={setFilter}
              platforms={platforms}
              onClear={() => setFilters(EMPTY_FILTERS)}
              activeCount={activeCount}
              priceError={priceError}
            />
          </aside>

          <section aria-label="Anúncios" className="min-w-0">
            <div className="flex justify-between items-center mb-3 gap-2">
              <h2 className="min-w-0 text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="text-neon-pink">■</span> Anúncios disponíveis
              </h2>
              <span className="shrink-0 whitespace-nowrap text-xs font-code text-slate-400" aria-live="polite">
                {filtered.length} {filtered.length === 1 ? "anúncio" : "anúncios"}
              </span>
            </div>

            {isLoading ? (
              <div className="py-10 text-center font-code text-sm text-neon-cyan animate-pulse">
                CARREGANDO ANÚNCIOS...
              </div>
            ) : isError ? (
              <div role="alert" className="text-center py-10 px-4 bg-noir-900 border-2 border-neon-pink font-code text-sm text-neon-pink font-bold">
                ⚠ FALHA AO CARREGAR OS ANÚNCIOS. VERIFIQUE SE A API ESTÁ RODANDO.
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 px-4 bg-noir-900/40 border border-dashed border-noir-800 font-code text-sm text-slate-400 space-y-3">
                <p>{products.length === 0 ? "NENHUM ANÚNCIO PUBLICADO AINDA." : "NENHUM ANÚNCIO COMBINA COM A BUSCA E OS FILTROS."}</p>
                {products.length > 0 && (
                  <button type="button" onClick={clearAll} className="px-3 py-2 border border-neon-cyan text-neon-cyan text-xs font-bold chamfer-tag">
                    LIMPAR BUSCA E FILTROS
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                {filtered.map((item) => (
                  <Link
                    to={`/product/${item.id}`}
                    key={item.id}
                    className="min-w-0 bg-noir-900 border border-noir-700 hover:border-neon-pink transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative bg-noir-800 aspect-[3/4] overflow-hidden">
                        <img
                          src={item.image_url || FALLBACK_IMAGE}
                          alt={item.title}
                          className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300"
                        />
                        <div className={`absolute top-2 left-2 bg-noir-950/90 border ${item.is_functional === false ? "border-neon-amber text-neon-amber" : "border-neon-mint text-neon-mint"} text-xs font-code px-1.5 py-0.5`}>
                          {item.condition_tag || (item.has_box ? "[CIB]" : "[USADO]")}
                        </div>
                        <div className="absolute bottom-2 right-2 bg-noir-950/85 text-slate-200 text-xs font-code px-1.5">
                          {item.platform}
                        </div>
                      </div>
                      <div className="p-2.5">
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-neon-pink uppercase">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-400 font-code truncate">
                          Vendedor: {item.seller_handle}
                        </p>
                        <div className="mt-2 pt-2 border-t border-noir-800 flex flex-wrap justify-between items-baseline gap-x-1">
                          <p className="text-neon-cyan font-pixel text-xl leading-none">
                            {formatBRL(item.price)}
                          </p>
                          <span className={`text-xs font-code ${item.is_functional === false ? "text-neon-amber" : "text-neon-mint"}`}>
                            {item.is_functional === false ? "[PEÇAS]" : "[OK]"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-noir-800 group-hover:bg-neon-pink group-hover:text-white text-neon-pink border-t border-noir-700 text-xs font-code py-2 text-center transition-all">
                      VER DETALHES
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
