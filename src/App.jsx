import React, { useState, useEffect } from "react";
import Header from "./components/Header.jsx";
import Navigation from "./components/Navigation.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ViveirosList from "./components/ViveirosList.jsx";
import BiometriaView from "./components/BiometriaView.jsx";
import QualidadeAguaView from "./components/QualidadeAguaView.jsx";
import CalculadorasHub from "./components/CalculadorasHub.jsx";
import BackupView from "./components/BackupView.jsx";
import { db, seedInitialDataIfEmpty } from "./services/db.js";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [viveiros, setViveiros] = useState([]);
  const [biometrias, setBiometrias] = useState([]);
  const [qualidadeAgua, setQualidadeAgua] = useState([]);
  const [farmProfile, setFarmProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modais acionados do Dashboard
  const [openModalBiometria, setOpenModalBiometria] = useState(false);
  const [openModalAgua, setOpenModalAgua] = useState(false);

  const loadData = async () => {
    try {
      await seedInitialDataIfEmpty();
      const allViveiros = await db.viveiros.toArray();
      const allBiometrias = await db.biometrias.toArray();
      const allAgua = await db.qualidadeAgua.toArray();
      const config = await db.configuracoes.where("chave").equals("perfilFazenda").first();

      setViveiros(allViveiros);
      setBiometrias(allBiometrias);
      setQualidadeAgua(allAgua);
      setFarmProfile(config || null);
    } catch (err) {
      console.error("Erro ao carregar dados do Dexie:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header farmProfile={farmProfile} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 pt-2 pb-16 md:pb-6">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-400">Carregando banco de dados local...</p>
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <Dashboard
                viveiros={viveiros}
                biometrias={biometrias}
                qualidadeAgua={qualidadeAgua}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenNewBiometria={() => {
                  setActiveTab("biometria");
                  setOpenModalBiometria(true);
                }}
                onOpenNewAgua={() => {
                  setActiveTab("agua");
                  setOpenModalAgua(true);
                }}
                onOpenNewViveiro={() => setActiveTab("viveiros")}
              />
            )}

            {activeTab === "viveiros" && (
              <ViveirosList 
                viveiros={viveiros} 
                onReload={loadData} 
              />
            )}

            {activeTab === "biometria" && (
              <BiometriaView
                viveiros={viveiros}
                biometrias={biometrias}
                onReload={loadData}
                isModalOpenExternal={openModalBiometria}
                onCloseExternalModal={() => setOpenModalBiometria(false)}
              />
            )}

            {activeTab === "agua" && (
              <QualidadeAguaView
                viveiros={viveiros}
                qualidadeAgua={qualidadeAgua}
                onReload={loadData}
                isModalOpenExternal={openModalAgua}
                onCloseExternalModal={() => setOpenModalAgua(false)}
              />
            )}

            {activeTab === "calculadoras" && (
              <CalculadorasHub
                viveiros={viveiros}
                biometrias={biometrias}
                qualidadeAgua={qualidadeAgua}
              />
            )}

            {activeTab === "backup" && (
              <BackupView
                farmProfile={farmProfile}
                viveiros={viveiros}
                biometrias={biometrias}
                qualidadeAgua={qualidadeAgua}
                onReload={loadData}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
