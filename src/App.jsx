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
import MercadoView from "./components/MercadoView.jsx";
import AnalyticsView from "./components/AnalyticsView.jsx";
import { analytics } from "./services/analyticsService.js";
import { db, initializeDatabase, seedInitialDataIfEmpty } from "./services/db.js";
import { CheckCircle2, X } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [viveiros, setViveiros] = useState([]);
  const [biometrias, setBiometrias] = useState([]);
  const [qualidadeAgua, setQualidadeAgua] = useState([]);
  const [farmProfile, setFarmProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { analytics.iniciarAcesso(); }, []);
  useEffect(() => { if (!loading && !error) analytics.pagina(activeTab); }, [activeTab, loading, error]);

  // Modais acionados do Dashboard
  const [openModalBiometria, setOpenModalBiometria] = useState(false);
  const [openModalAgua, setOpenModalAgua] = useState(false);
  const [openModalViveiro, setOpenModalViveiro] = useState(false);

  // Fluxo guiado: quando o usuário clica em biometria/água sem ter viveiros
  const [intencaoPosViveiro, setIntencaoPosViveiro] = useState(null); // "biometria" | "agua" | null
  const [novoViveiroCriadoId, setNovoViveiroCriadoId] = useState(null);
  const [feedbackBanner, setFeedbackBanner] = useState(null);

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

  useEffect(() => {
    if (feedbackBanner) {
      const timer = setTimeout(() => {
        setFeedbackBanner(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [feedbackBanner]);

  const handleNavigate = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleIniciarCadastroComIntencao = (tipo) => {
    setIntencaoPosViveiro(tipo);
    setActiveTab("viveiros");
    setOpenModalViveiro(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCarregarExemplos = async () => {
    await seedInitialDataIfEmpty({ force: true });
    await loadData();
    setFeedbackBanner({
      tipo: "sucesso",
      texto: "Dados de exemplo carregados com sucesso! Você já pode acompanhar viveiros, biometrias e calculadoras."
    });
  };

  const handleViveiroCriado = (novoId) => {
    if (intencaoPosViveiro === "biometria") {
      setIntencaoPosViveiro(null);
      setNovoViveiroCriadoId(novoId);
      setActiveTab("biometria");
      setOpenModalBiometria(true);
      setFeedbackBanner({
        tipo: "sucesso",
        texto: "Viveiro cadastrado com sucesso! Preencha agora os dados da primeira pesagem/biometria."
      });
    } else if (intencaoPosViveiro === "agua") {
      setIntencaoPosViveiro(null);
      setNovoViveiroCriadoId(novoId);
      setActiveTab("agua");
      setOpenModalAgua(true);
      setFeedbackBanner({
        tipo: "sucesso",
        texto: "Viveiro cadastrado com sucesso! Preencha agora a medição dos parâmetros de qualidade da água."
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        farmProfile={farmProfile}
        telaAtual={activeTab}
        resumoRegistros={`${viveiros.length} viveiro(s) · ${biometrias.length} biometria(s) · ${qualidadeAgua.length} medição(ões) de água`}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 pt-2 pb-20 md:pb-6">
        <Navigation activeTab={activeTab} setActiveTab={handleNavigate} />

        {feedbackBanner && (
          <div 
            role="status" 
            aria-live="polite"
            className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-sm flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center gap-2.5 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{feedbackBanner.texto}</span>
            </div>
            <button
              onClick={() => setFeedbackBanner(null)}
              aria-label="Fechar notificação"
              className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
                onNavigate={handleNavigate}
                onOpenNewBiometria={() => {
                  handleNavigate("biometria");
                  setOpenModalBiometria(true);
                }}
                onOpenNewAgua={() => {
                  handleNavigate("agua");
                  setOpenModalAgua(true);
                }}
                onOpenNewViveiro={() => {
                  handleNavigate("viveiros");
                  setOpenModalViveiro(true);
                }}
                onIniciarCadastroComIntencao={handleIniciarCadastroComIntencao}
                onCarregarExemplos={handleCarregarExemplos}
              />
            )}

            {activeTab === "viveiros" && (
              <ViveirosList 
                viveiros={viveiros} 
                onReload={loadData} 
                isModalOpenExternal={openModalViveiro}
                onCloseExternalModal={() => setOpenModalViveiro(false)}
                onViveiroCriado={handleViveiroCriado}
                intencaoPosViveiro={intencaoPosViveiro}
              />
            )}

            {activeTab === "biometria" && (
              <BiometriaView
                viveiros={viveiros}
                biometrias={biometrias}
                onReload={loadData}
                isModalOpenExternal={openModalBiometria}
                onCloseExternalModal={() => setOpenModalBiometria(false)}
                novoViveiroCriadoId={novoViveiroCriadoId}
                onSolicitarCadastroViveiro={handleIniciarCadastroComIntencao}
              />
            )}

            {activeTab === "agua" && (
              <QualidadeAguaView
                viveiros={viveiros}
                qualidadeAgua={qualidadeAgua}
                onReload={loadData}
                isModalOpenExternal={openModalAgua}
                onCloseExternalModal={() => setOpenModalAgua(false)}
                novoViveiroCriadoId={novoViveiroCriadoId}
                onSolicitarCadastroViveiro={handleIniciarCadastroComIntencao}
              />
            )}

            {activeTab === "calculadoras" && (
              <CalculadorasHub
                viveiros={viveiros}
                biometrias={biometrias}
                qualidadeAgua={qualidadeAgua}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === "sanidade" && (
              <SanidadeView onNavigate={handleNavigate} />
            )}

            {activeTab === "mercado" && (
              <MercadoView
                onOpenStats={() => handleNavigate("estatisticas")}
                onVoltarCalculos={() => handleNavigate("calculadoras")}
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
            {activeTab === "estatisticas" && <AnalyticsView onVoltar={() => handleNavigate("mercado")} />}
          </>
        )}
      </main>
      <footer className="site-footer max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 text-xs text-slate-500 flex flex-wrap justify-between gap-2 border-t border-slate-200">
        <span>CarcinoGestão · Gestão para produtores de camarão</span>
        <span>Seus registros ficam neste navegador. Faça backups em Ajustes.</span>
      </footer>
    </div>
  );
}
