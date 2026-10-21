import React from "react";
import { ShrimpMarkIcon } from "./icons/CustomAquacultureIcons.jsx";
import AjudaSuporte from "./AjudaSuporte.jsx";

export default function Header({ farmProfile, telaAtual, resumoRegistros, user, onConta }) {
  return (
    <header className="app-header sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 text-emerald-950">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="brand-mark flex h-11 w-11 shrink-0 items-center justify-center">
            <ShrimpMarkIcon className="w-10 h-10" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-emerald-950 tracking-tight leading-none">
              CarcinoGestão
            </h1>
            <p className="text-xs text-slate-600 font-medium break-words mt-1">
              {farmProfile?.nomeFazenda || "Gestão zootécnica de precisão"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button onClick={onConta} className="hidden sm:block min-h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-50">{user ? "Minha conta" : "Entrar"}</button>
          <AjudaSuporte telaAtual={telaAtual} resumoRegistros={resumoRegistros} />
        </div>
      </div>
    </header>
  );
}
