import React from "react";
import { LayoutDashboard, Layers, Activity, Droplets, Calculator, ShieldAlert, Store, Settings } from "lucide-react";

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "dashboard", label: "Painel", icon: LayoutDashboard },
    { id: "viveiros", label: "Viveiros", icon: Layers },
    { id: "biometria", label: "Biometria", icon: Activity },
    { id: "agua", label: "Água", icon: Droplets },
    { id: "calculadoras", label: "Cálculos", icon: Calculator },
    { id: "sanidade", label: "Sanidade & BPM", mobileLabel: "Sanidade", icon: ShieldAlert },
    { id: "mercado", label: "Onde Comprar", mobileLabel: "Comprar", icon: Store },
    { id: "backup", label: "Ajustes", icon: Settings },
  ];

  return (
    <>
      {/* Desktop / Tablet Top Nav */}
      <nav aria-label="Navegação principal" className="hidden md:flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/90 max-w-6xl mx-auto my-3 px-2 shadow-2xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Bottom Fixed Nav */}
      <nav aria-label="Navegação principal" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-1 py-1 pb-safe shadow-[0_-2px_8px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                aria-current={isActive ? "page" : undefined}
                aria-label={tab.label}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center min-h-[52px] min-w-0 flex-1 py-1 px-0.5 rounded-xl transition-all active:scale-95 cursor-pointer ${
                  isActive
                    ? "text-emerald-800 font-bold"
                    : "text-slate-500 hover:text-slate-800 font-medium"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-emerald-700 text-white shadow-xs" : "text-slate-500"}`}>
                  <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] tracking-tight mt-0.5 truncate max-w-full ${isActive ? "font-bold text-emerald-900" : "font-medium text-slate-600"}`}>
                  {tab.mobileLabel || tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
