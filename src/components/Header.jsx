import React from "react";
import { Waves, ShieldCheck } from "lucide-react";
import { ShrimpIcon } from "./icons/CustomAquacultureIcons.jsx";
import AjudaSuporte from "./AjudaSuporte.jsx";

export default function Header({ farmProfile, telaAtual, resumoRegistros }) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="relative w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex items-center justify-center text-white shadow-sm border border-emerald-500/20 group">
            <ShrimpIcon className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              CarcinoGestão
            </h1>
            <p className="text-xs text-slate-600 font-medium break-words">
              {farmProfile?.nomeFazenda || "Gestão simples para sua produção"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <AjudaSuporte telaAtual={telaAtual} resumoRegistros={resumoRegistros} />
          <div title="Seus registros ficam apenas neste navegador" className="flex items-center gap-1.5 px-2.5 py-2 rounded-full bg-emerald-50 text-xs text-emerald-700 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Dados no seu aparelho</span>
          </div>
        </div>
      </div>
    </header>
  );
}
