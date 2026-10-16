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
import { initializeDatabase, seedInitialDataIfEmpty } from "./services/db.js";
import { useAccount } from "./components/AccountProvider.jsx";
import AccountView from "./components/AccountView.jsx";
import { ShrimpMarkIcon } from "./components/icons/CustomAquacultureIcons.jsx";
import PasswordResetView from "./components/PasswordResetView.jsx";
import VerifyEmailView from "./components/VerifyEmailView.jsx";
import TechnicalVisitsView from './components/TechnicalVisitsView.jsx';
import TechnicalVisitBridge from './components/TechnicalVisitBridge.jsx';
import { accountRole, motivoDoBloqueioDeAcesso } from './services/accountPermissions.js';
import { CheckCircle2, X } from "lucide-react";

export default function App() {
  const { user, access, accessLoading, accessError } = useAccount();
  const [action] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return { mode: params.get('mode'), code: params.get('oobCode') };
  });
  useEffect(() => {
    if (action.mode) window.history.replaceState(null, '', window.location.pathname);
  }, [action]);
  const motivoDoBloqueio = motivoDoBloqueioDeAcesso({
    user,
    perfil: access,
    perfilCarregando: accessLoading,
    perfilErro: !!accessError,
    online: navigator.onLine,
  });
  if (motivoDoBloqueio || action.mode) return (
    <main className="min-h-screen bg-slate-50 text-slate-900 px-5 py-8 sm:py-14">
      <div className="mx-auto max-w-md">
        <header className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white"><ShrimpMarkIcon className="h-8 w-8" /></div>
          <div><h1 className="text-xl font-bold tracking-tight">CarcinoGestão</h1><p className="text-sm text-slate-600">Gestão da sua produção de camarão</p></div>
        </header>
        {action.mode ? <PasswordResetView mode={action.mode} code={action.code} /> : user ? <VerifyEmailView /> : <AccountView />}
      </div>
    </main>
  );
  return <ProductionApp />;
}

function ProductionApp() {
  const { database: db, user, access, syncStatus, dataVersion, sync } = useAccount();
  const technician = accountRole(access, user.uid) === 'field_technician';
  const [activeTab, setActiveTab] = useState(() => technician ? 'visitas' : 'dashboard');
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

  // Fluxo guiado: quando o usuário clica em biometria/água sem ter viveiros
  const [intencaoPosViveiro, setIntencaoPosViveiro] = useState(null); // "biometria" | "agua" | null
  const [novoViveiroCriadoId, setNovoViveiroCriadoId] = useState(null);
  const [feedbackBanner, setFeedbackBanner] = useState(null);

  const loadData = async () => {
    setError("");
    try {
      await initializeDatabase(db);
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
  }, [dataVersion]);

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
    await seedInitialDataIfEmpty({ force: true }, db);
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
        user={user}
        onConta={() => handleNavigate("conta")}
        resumoRegistros={`${viveiros.length} viveiro(s) · ${biometrias.length} biometria(s) · ${qualidadeAgua.length} medição(ões) de água`}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 pt-2 pb-20 md:pb-6">
        <Navigation activeTab={activeTab} setActiveTab={handleNavigate} />
        {technician && activeTab !== 'visitas' && <div className="my-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 py-3"><span className="text-sm font-semibold text-slate-800">Área do técnico de campo</span><button className="min-h-11 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800" onClick={() => handleNavigate('visitas')}>Registrar visita técnica</button></div>}
        <TechnicalVisitBridge onOpen={() => handleNavigate('visitas')} onReload={loadData} />
        {user && <div role="status" className={`my-3 flex flex-wrap justify-between items-center gap-2 rounded-xl border px-3 py-2 text-xs ${syncStatus.state === 'synced' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>
          <span>{syncStatus.message}</span>
          {['conflict', 'pending'].includes(syncStatus.state) && <button onClick={() => syncStatus.state === 'conflict' ? handleNavigate('conta') : sync()} className="min-h-11 font-bold underline underline-offset-2">{syncStatus.state === 'conflict' ? 'Revisar versões' : 'Tentar sincronizar'}</button>}
        </div>}

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
            {activeTab === "conta" && <AccountView onVisits={() => handleNavigate('visitas')} />}
            {activeTab === 'visitas' && <TechnicalVisitsView onReload={loadData} />}
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
          </>
        )}
      </main>
      <footer className="site-footer max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 text-xs text-slate-500 flex flex-wrap justify-between gap-2 border-t border-slate-200">
        <span>CarcinoGestão · Gestão para produtores de camarão</span>
        <span>{user ? "Confira o status da nuvem. Exporte backups em Ajustes." : "Modo local. Entre na sua conta para salvar na nuvem."}</span>
      </footer>
    </div>
  );
}
