import React from "react";
import { Waves, ShieldCheck } from "lucide-react";
import { ShrimpIcon } from "./icons/CustomAquacultureIcons.jsx";
import AjudaSuporte from "./AjudaSuporte.jsx";

export default function Header({ farmProfile, telaAtual, resumoRegistros }) {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-emerald-900/40 text-white px-4 py-3 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="relative w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-400/40 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 group transition-transform active:scale-95 animate-float-gentle">
            <ShrimpIcon className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-white tracking-tight leading-none">
              CarcinoGestão
            </h1>
            <p className="text-xs text-emerald-300/80 font-medium break-words mt-1">
              {farmProfile?.nomeFazenda || "Gestão zootécnica de precisão"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <AjudaSuporte telaAtual={telaAtual} resumoRegistros={resumoRegistros} />
          <div title="Seus registros ficam salvos com segurança neste navegador (IndexedDB)" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/15 text-xs text-emerald-300 font-bold border border-emerald-500/30 shadow-xs animate-water-ripple">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">100% Offline</span>
          </div>
        </div>
      </div>
    </header>
  );
}
