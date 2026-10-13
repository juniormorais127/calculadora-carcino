import React, { useState, useEffect } from "react";
import Header from "./components/Header.jsx";
import Navigation from "./components/Navigation.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ViveirosList from "./components/ViveirosList.jsx";
import BiometriaView from "./components/BiometriaView.jsx";
import QualidadeAguaView from "./components/QualidadeAguaView.jsx";
import CalculadorasHub from "./components/CalculadorasHub.jsx";
import BackupView from "./components/BackupView.jsx";
import SanidadeView from "./components/SanidadeView.jsx";
import { db, initializeDatabase } from "./services/db.js";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [viveiros, setViveiros] = useState([]);
  const [biometrias, setBiometrias] = useState([]);
  const [qualidadeAgua, setQualidadeAgua] = useState([]);
  const [farmProfile, setFarmProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modais acionados do Dashboard
  const [openModalBiometria, setOpenModalBiometria] = useState(false);
  const [openModalAgua, setOpenModalAgua] = useState(false);
  const [openModalViveiro, setOpenModalViveiro] = useState(false);

  const loadData = async () => {
    setError("");
    try {
      await initializeDatabase();
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
      setError("Não foi possível acessar o armazenamento local. Verifique as permissões do navegador e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header farmProfile={farmProfile} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 pt-2 pb-16 md:pb-6">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {error ? (
          <div role="alert" className="my-8 rounded-xl border border-rose-100 bg-rose-50 p-5">
            <p>{error}</p>
            <button onClick={loadData} className="mt-4 rounded-lg bg-slate-100 px-4 py-3 font-semibold">Tentar novamente</button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-600">Carregando banco de dados local...</p>
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
                onOpenNewViveiro={() => {
                  setActiveTab("viveiros");
                  setOpenModalViveiro(true);
                }}
              />
            )}

            {activeTab === "viveiros" && (
              <ViveirosList 
                viveiros={viveiros} 
                onReload={loadData} 
                isModalOpenExternal={openModalViveiro}
                onCloseExternalModal={() => setOpenModalViveiro(false)}
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

            {activeTab === "sanidade" && (
              <SanidadeView />
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
      <footer className="site-footer max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 text-xs text-slate-500 flex flex-wrap justify-between gap-2 border-t border-slate-200">
        <span>CarcinoGestão · Gratuito para produtores de camarão</span>
        <span>Seus registros ficam neste navegador. Faça backups em Ajustes.</span>
      </footer>
    </div>
  );
}
