import React from "react";
import { LayoutDashboard, Layers, Activity, Droplets, Calculator, ShieldAlert, Settings } from "lucide-react";

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "dashboard", label: "Painel", icon: LayoutDashboard },
    { id: "viveiros", label: "Viveiros", icon: Layers },
    { id: "biometria", label: "Biometria", icon: Activity },
    { id: "agua", label: "Água", icon: Droplets },
    { id: "calculadoras", label: "Cálculos", icon: Calculator },
    { id: "sanidade", label: "Sanidade & BPM", mobileLabel: "Sanidade", icon: ShieldAlert },
    { id: "backup", label: "Ajustes", icon: Settings },
  ];

  return (
    <>
      {/* Desktop / Tablet Top Nav */}
      <nav aria-label="Navegação principal" className="hidden md:flex flex-wrap items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 max-w-6xl mx-auto my-4 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm  font-semibold"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Bottom Fixed Nav */}
      <nav aria-label="Navegação principal" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-50 backdrop-blur-lg border-t border-slate-200 px-1 py-1.5 pb-safe">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
              aria-current={isActive ? "page" : undefined}
                aria-label={tab.label}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center min-h-11 min-w-0 flex-1 py-1 px-1 rounded-xl transition-all ${
                  isActive
                    ? "text-emerald-700 font-bold"
                  : "text-slate-600 hover:text-slate-700 font-normal"
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? "bg-emerald-500/15" : ""}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{tab.mobileLabel || tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
