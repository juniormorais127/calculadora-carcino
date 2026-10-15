import React from "react";
import { Waves, ShieldCheck } from "lucide-react";
import { ShrimpIcon } from "./icons/CustomAquacultureIcons.jsx";
import AjudaSuporte from "./AjudaSuporte.jsx";

export default function Header({ farmProfile, telaAtual, resumoRegistros }) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="relative w-10 h-10 shrink-0 rounded-xl bg-emerald-800 border border-emerald-700/60 flex items-center justify-center text-white shadow-xs group transition-transform active:scale-95">
            <ShrimpIcon className="w-6 h-6 text-emerald-100 transition-transform duration-300 group-hover:scale-105" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
              CarcinoGestão
            </h1>
            <p className="text-xs text-slate-600 font-medium break-words mt-1">
              {farmProfile?.nomeFazenda || "Gestão zootécnica de precisão"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <AjudaSuporte telaAtual={telaAtual} resumoRegistros={resumoRegistros} />
          <div title="Seus registros ficam salvos com segurança neste navegador (IndexedDB)" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 text-xs text-emerald-800 font-bold border border-emerald-200/80 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">100% Offline</span>
          </div>
        </div>
      </div>
    </header>
  );
}
