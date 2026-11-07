import React from 'react';
import { Link } from 'react-router-dom';
import Header from "../components/Header";

const SECTIONS = [
  {
    n: "01",
    title: "COMPARATIVO DE PREÇO",
    color: "text-neon-cyan",
    text: "Comparamos o preço da mídia usada anunciada com o menor preço atual da versão digital (PC) do mesmo jogo, consultado na CheapShark (Steam, GOG, Humble e outras lojas). A diferença em porcentagem aparece na página do anúncio e a média aparece no início. Jogos sem versão digital de PC aparecem como \"sem referência\".",
  },
  {
    n: "02",
    title: "PAGAMENTO PROTEGIDO",
    color: "text-neon-pink",
    text: "O valor da compra fica retido até o comprador confirmar que recebeu a mídia física (disco ou cartucho) e que ela funciona.",
  },
  {
    n: "03",
    title: "BUSCA E FILTROS",
    color: "text-neon-mint",
    text: "A busca procura pelo título do jogo e sugere nomes parecidos mesmo com erro de digitação. Use os filtros para escolher a plataforma, a faixa de preço e a condição (com caixa, com manual, funcionando).",
  },
  {
    n: "04",
    title: "NEGOCIAÇÃO E ALERTAS",
    color: "text-neon-amber",
    text: "Na página do anúncio você pode enviar uma proposta ao vendedor e conversar com ele em Ofertas. Em Alertas, crie um aviso de preço para um jogo e receba uma notificação quando alguém anunciar pelo valor desejado.",
  },
];

export default function SystemGuide() {
  return (
    <div className="min-h-screen pb-nav text-slate-200">
      <Header title="GUIA" titleHighlight="AJUDA" subtitle="COMO O MERCADO FUNCIONA" backLink="/" badgeText="AJUDA" badgeType="cyan" />

      <main className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-4 pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map((s) => (
            <section key={s.n} className="bg-noir-900/90 border border-noir-700 p-4 chamfer-box space-y-2">
              <div className={`flex items-center space-x-2 font-code text-sm font-bold ${s.color}`}>
                <span className="font-pixel text-xl">{s.n}</span>
                <h2>// {s.title}</h2>
              </div>
              <p className="text-sm font-code text-slate-300 leading-relaxed">{s.text}</p>
            </section>
          ))}
        </div>

        <div className="pt-2 md:max-w-sm md:mx-auto">
          <Link to="/ticket" className="block w-full py-3 text-center bg-noir-800 hover:bg-neon-cyan hover:text-noir-950 text-neon-cyan border border-neon-cyan/40 font-code text-sm font-bold chamfer-tag transition-colors">
            [ ABRIR TICKET DE SUPORTE ]
          </Link>
        </div>
      </main>
    </div>
  );
}
