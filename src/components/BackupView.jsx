import React, { useEffect, useState } from "react";
import { Settings, Download, Upload, Trash2, Smartphone, ShieldCheck, Database, RefreshCw, FileText } from "lucide-react";
import { exportLocalDatabase, importLocalDatabase, seedInitialDataIfEmpty, clearLocalDatabase } from "../services/db.js";
import { useAccount, useDatabase } from "./AccountProvider.jsx";
import { gerarRelatorioFazendaPdf } from "../services/relatorioPdfService.js";
import { publishSharedFarm } from '../services/technicalVisits.js';
import { propertyNameKey } from '../services/propertyDirectory.js';
import { saveDeviceFile } from '../services/deviceFiles.js';
import { AndroidDownloadSettings } from './AppUpdates.jsx';

export default function BackupView({ 
  farmProfile, 
  viveiros = [], 
  biometrias = [], 
  qualidadeAgua = [], 
  onReload 
}) {
  const db = useDatabase();
  const { user } = useAccount() || {};
  const [nomeFazenda, setNomeFazenda] = useState(farmProfile?.nomeFazenda || '');
  const [profileBusy, setProfileBusy] = useState(false), [profileError, setProfileError] = useState('');
  const [produtor, setProdutor] = useState(farmProfile?.produtor || "Produtor Rural");
  const [localizacao, setLocalizacao] = useState(farmProfile?.localizacao || "Litoral");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    setNomeFazenda(farmProfile?.nomeFazenda || '');
    setProdutor(farmProfile?.produtor || "Produtor Rural");
    setLocalizacao(farmProfile?.localizacao || "Litoral");
  }, [farmProfile]);

  const handleExportarPdf = async () => {
    try {
      propertyNameKey(nomeFazenda);
      if (user) await publishSharedFarm(user, { nomeFazenda }, viveiros);
      if (farmProfile?.id) {
        await db.configuracoes.update(farmProfile.id, {
          nomeFazenda,
          produtor,
          localizacao,
          createdAt: new Date().toISOString()
        });
      } else {
        await db.configuracoes.add({
          chave: "perfilFazenda",
          nomeFazenda,
          produtor,
          localizacao,
          createdAt: new Date().toISOString()
        });
      }

      await gerarRelatorioFazendaPdf({
        farmProfile: {
          nomeFazenda,
          produtor,
          localizacao
        },
        viveiros,
        biometrias,
        qualidadeAgua,
        baixar: true
      });
      setMensagem("Dados salvos e Relatório da Fazenda em PDF baixado com sucesso!");
      setTimeout(() => setMensagem(""), 4000);
      onReload?.();
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Não foi possível gerar o PDF: " + err.message);
    }
  };

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    setProfileBusy(true); setProfileError('');
    try {
    propertyNameKey(nomeFazenda);
    if (user) await publishSharedFarm(user, { nomeFazenda }, viveiros);
    if (farmProfile?.id) {
      await db.configuracoes.update(farmProfile.id, {
        nomeFazenda,
        produtor,
        localizacao,
        createdAt: new Date().toISOString()
      });
    } else {
      await db.configuracoes.add({
        chave: "perfilFazenda",
        nomeFazenda,
        produtor,
        localizacao,
        createdAt: new Date().toISOString()
      });
    }
    setMensagem("Perfil da fazenda atualizado com sucesso!");
    setTimeout(() => setMensagem(""), 3000);
    onReload();
    } catch (error) { setProfileError(error.code ? 'Não foi possível conferir o nome da propriedade. Verifique a conexão e tente novamente; seus dados anteriores foram preservados.' : error.message); }
    finally { setProfileBusy(false); }
  };

  const handleExport = async () => {
    const json = await exportLocalDatabase(db);
    const blob = new Blob([json], { type: "application/json" });
    const dataStr = new Date().toISOString().split("T")[0];
    await saveDeviceFile(blob, `backup-carcinogestao-${dataStr}.json`);
  };

  const handleImport = async (e) => {
    const input = e.target;
    const file = input.files[0];
    if (!file) return;
    if (!confirm(user ? "Restaurar este backup substituirá os registros desta conta e será sincronizado com a nuvem. Deseja continuar?" : "Restaurar este backup substituirá todos os dados locais. Deseja continuar?")) {
      input.value = "";
      return;
    }
    try {
      await importLocalDatabase(await file.text(), db);
      await onReload();
      setMensagem("Backup restaurado com sucesso no dispositivo!");
    } catch (err) {
      alert(`Não foi possível restaurar o  ${err.message}`);
    } finally {
      input.value = "";
    }
  };

  const handleResetDemo = async () => {
    if (confirm("Carregar dados de exemplo? Os exemplos serão carregados apenas se não houver viveiros cadastrados.")) {
      await seedInitialDataIfEmpty({ force: true }, db);
      onReload();
    }
  };

  const handleClearAll = async () => {
    if (confirm(user ? "Apagar TODOS os registros desta conta? A exclusão também será sincronizada com a nuvem. Exporte um backup antes de continuar." : "ATENÇÃO: Deseja apagar TODOS os dados locais deste aparelho? Esta ação é irreversível.")) {
      await clearLocalDatabase(db);
      alert(user ? "Registros apagados. Confira o status da sincronização." : "Banco de dados local limpo.");
      onReload();
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-600" />
          Configurações e Backup
        </h2>
        <p className="text-xs md:text-sm text-slate-700 mt-1">
          {user ? "Gerencie os dados desta conta e exporte cópias dos registros da fazenda." : "Gerencie o armazenamento interno deste aparelho e faça backups dos dados da fazenda."}
        </p>
      </div>

      {mensagem && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 rounded-xl text-xs font-bold">
          {mensagem}
        </div>
      )}

      <AndroidDownloadSettings />

      {/* Perfil da Fazenda */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-700" />
          Identificação da Propriedade
        </h3>

        <form onSubmit={handleSalvarPerfil} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nome da Fazenda / Projeto:</label>
              <input
                type="text"
                required
                value={nomeFazenda}
                minLength={2}
                maxLength={200}
                onChange={(e) => setNomeFazenda(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-bold text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nome do Produtor / Responsável:</label>
              <input
                type="text"
                required
                value={produtor}
                onChange={(e) => setProdutor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-bold text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Localização / Município / Região:</label>
            <input
              type="text"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-semibold text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={profileBusy}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              {profileBusy ? 'Conferindo nome…' : 'Salvar Dados da Fazenda'}
            </button>

            <button
              type="button"
              disabled={profileBusy}
              onClick={handleExportarPdf}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Salvar dados da fazenda em formato PDF"
            >
              <FileText className="w-4 h-4" />
              <span>Salvar em PDF</span>
            </button>
          </div>
          <p className="text-xs text-slate-600">O nome é obrigatório e exclusivo no sistema. Maiúsculas, acentos e espaços não criam um nome diferente. É necessário estar conectado para confirmar o nome.</p>
          {profileError && <p role="alert" className="text-sm text-rose-900">{profileError}</p>}
        </form>
      </div>

      {/* Estatísticas do Banco Local */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-cyan-700" />
          Armazenamento Local neste Aparelho
        </h3>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-2xl font-semibold text-slate-900">{viveiros.length}</div>
            <div className="text-[11px] text-slate-600 font-medium">Viveiros Salvos</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-2xl font-semibold text-emerald-700">{biometrias.length}</div>
            <div className="text-[11px] text-slate-600 font-medium">Pesagens / Biometrias</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-2xl font-semibold text-cyan-700">{qualidadeAgua.length}</div>
            <div className="text-[11px] text-slate-600 font-medium">Análises de Água</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-700">
          <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900">Privacidade e Funcionamento Sem Internet:</span>
            {" "}{user ? "Você possui uma cópia local independente para este login. Com internet, os registros são sincronizados com sua conta; confira o status antes de sair ou trocar de aparelho. Exporte backups periódicos." : "Todos os seus registros de viveiros e biometrias ficam armazenados no navegador deste celular. Depois que a aplicação estiver aberta, os registros podem ser consultados e salvos sem internet. Entre em uma conta para usar o salvamento na nuvem."}
          </div>
        </div>

        {/* Botões de Ação de Backup */}
        <div className="flex flex-wrap gap-2.5 pt-2">
          <button
            onClick={handleExportarPdf}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Salvar Relatório da Fazenda em PDF</span>
          </button>

          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer border border-slate-200"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Baixar Arquivo de Backup (JSON)</span>
          </button>

          <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs shadow-sm cursor-pointer transition-all active:scale-95 border border-slate-200">
            <Upload className="w-4 h-4 text-cyan-700" />
            <span>Restaurar Backup</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Zona de Perigo / Limpeza */}
      <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Gerenciar Dados
        </h4>
        <p className="text-xs text-slate-600">
          {user ? "Os exemplos e a exclusão abaixo afetam os registros desta conta e serão sincronizados com a nuvem:" : "Se desejar recarregar os viveiros de demonstração ou limpar todos os registros locais deste aparelho:"}
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={handleResetDemo}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Carregar Dados de Exemplo</span>
          </button>

          <button
            onClick={handleClearAll}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-50 text-rose-700 font-semibold text-xs flex items-center gap-1.5 border border-rose-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Banco de Dados</span>
          </button>
        </div>
      </div>
    </div>
  );
}
