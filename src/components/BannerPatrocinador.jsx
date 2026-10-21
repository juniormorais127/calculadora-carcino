import React, { useState } from "react";
import { Sparkles, MessageCircle, ExternalLink, ShieldCheck, ChevronRight } from "lucide-react";
import { ANUNCIOS_PATROCINADORES } from "../data/fabricantesRacao.js";

export default function BannerPatrocinador({ onNavigateMercado, categoriaFiltro }) {
  const [anuncioAtivoIndex, setAnuncioAtivoIndex] = useState(0);

  // Filtra anúncios se houver categoria ou mostra todos
  const anuncios = categoriaFiltro
    ? ANUNCIOS_PATROCINADORES.filter(a => a.marcaId.includes(categoriaFiltro) || a.segmento.toLowerCase().includes(categoriaFiltro.toLowerCase()))
    : ANUNCIOS_PATROCINADORES;

  const lista = anuncios.length > 0 ? anuncios : ANUNCIOS_PATROCINADORES;
  const anuncio = lista[anuncioAtivoIndex % lista.length];

  return (
    <div className="w-full light-panel bg-blue-50 text-slate-900 rounded-3xl p-4 sm:p-5 shadow-md border border-emerald-500/30 overflow-hidden relative">
      {/* Luz ambiente de fundo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 min-w-0 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              {anuncio.badge || "Espaço do Fabricante"}
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {anuncio.nomeEmpresa}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
            {anuncio.titulo}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">
            {anuncio.chamada}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
          {onNavigateMercado && (
            <button
              onClick={() => onNavigateMercado(anuncio.marcaId)}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm"
            >
              <span>Vendedores no seu Estado</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <a
            href={`https://wa.me/55${anuncio.whatsapp}?text=${encodeURIComponent(
              `Olá! Vi o anúncio da ${anuncio.nomeEmpresa} no CarcinoGestão e gostaria de mais informações técnicas e cotação de produtos para minha fazenda.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Falar no WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Indicadores de alternância de parceiros se houver mais de 1 */}
      {lista.length > 1 && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/10">
          <span className="text-[10px] text-slate-400 font-medium mr-1">Parceiros oficiais:</span>
          {lista.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setAnuncioAtivoIndex(idx)}
              className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all ${
                idx === (anuncioAtivoIndex % lista.length)
                  ? "bg-emerald-500 text-slate-950 font-black"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.logoTexto || item.nomeEmpresa}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
