import React from "react";
import { ShrimpMarkIcon } from "./icons/CustomAquacultureIcons.jsx";
import AjudaSuporte from "./AjudaSuporte.jsx";

export default function Header({ farmProfile, telaAtual, resumoRegistros, user, onConta }) {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-emerald-900/40 text-white px-4 py-3 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-400/40 flex items-center justify-center text-white shadow-sm shadow-emerald-950/30">
            <ShrimpMarkIcon className="w-7 h-7" />
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
          <button onClick={onConta} className="min-h-11 rounded-xl border border-emerald-400/40 px-3 text-xs font-bold text-emerald-100 hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-white">{user ? "Minha conta" : "Entrar"}</button>
          <AjudaSuporte telaAtual={telaAtual} resumoRegistros={resumoRegistros} />
        </div>
      </div>
    </header>
  );
}
