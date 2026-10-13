import React from "react";
import { LayoutDashboard, Layers, Activity, Droplets, Calculator, Settings } from "lucide-react";

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "dashboard", label: "Painel", icon: LayoutDashboard },
    { id: "viveiros", label: "Viveiros", icon: Layers },
    { id: "biometria", label: "Biometria", icon: Activity },
    { id: "agua", label: "Água", icon: Droplets },
    { id: "calculadoras", label: "Cálculos", icon: Calculator },
    { id: "backup", label: "Ajustes", icon: Settings },
  ];

  return (
    <>
      {/* Desktop / Tablet Top Nav */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80 max-w-6xl mx-auto my-4 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Bottom Fixed Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 pb-safe">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                  isActive
                    ? "text-emerald-400 scale-105 font-bold"
                    : "text-slate-400 hover:text-slate-300 font-normal"
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? "bg-emerald-500/15" : ""}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
