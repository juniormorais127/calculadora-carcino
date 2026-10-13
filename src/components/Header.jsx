import React from "react";
import { Waves, Database, Smartphone } from "lucide-react";

export default function Header({ farmProfile }) {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
            <Waves className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              CarcinoGestão
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                Vannamei
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {farmProfile?.nomeFazenda || "Fazenda de Carcinicultura"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-emerald-400 font-medium">
            <Database className="w-3.5 h-3.5" />
            <span>Banco Local Ativo</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-300 font-medium">
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">100% Offline</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
        </div>
      </div>
    </header>
  );
}
