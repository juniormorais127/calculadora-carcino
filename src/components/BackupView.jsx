import React, { useEffect, useState } from "react";
import { Settings, Download, Upload, Trash2, Smartphone, ShieldCheck, Database, RefreshCw, FileText } from "lucide-react";
import { db, exportLocalDatabase, importLocalDatabase, seedInitialDataIfEmpty, clearLocalDatabase } from "../services/db.js";
import { gerarRelatorioFazendaPdf } from "../services/relatorioPdfService.js";

export default function BackupView({ 
  farmProfile, 
  viveiros = [], 
  biometrias = [], 
  qualidadeAgua = [], 
  onReload 
}) {
  const [nomeFazenda, setNomeFazenda] = useState(farmProfile?.nomeFazenda || "Fazenda de Carcinicultura");
  const [produtor, setProdutor] = useState(farmProfile?.produtor || "Produtor Rural");
  const [localizacao, setLocalizacao] = useState(farmProfile?.localizacao || "Litoral");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    setNomeFazenda(farmProfile?.nomeFazenda || "Fazenda de Carcinicultura");
    setProdutor(farmProfile?.produtor || "Produtor Rural");
    setLocalizacao(farmProfile?.localizacao || "Litoral");
  }, [farmProfile]);

  const handleExportarPdf = () => {
    try {
      gerarRelatorioFazendaPdf({
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
      setMensagem("Relatório da fazenda em PDF gerado e baixado com sucesso!");
      setTimeout(() => setMensagem(""), 4000);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Não foi possível gerar o PDF: " + err.message);
    }
  };

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
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
  };

  const handleExport = async () => {
    const json = await exportLocalDatabase();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dataStr = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `backup-carcinogestao-${dataStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const input = e.target;
    const file = input.files[0];
    if (!file) return;
    if (!confirm("Restaurar este backup substituirá todos os dados locais. Deseja continuar?")) {
      input.value = "";
      return;
    }
    try {
      await importLocalDatabase(await file.text());
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
      await seedInitialDataIfEmpty({ force: true });
      onReload();
    }
  };

  const handleClearAll = async () => {
    if (confirm("ATENÇÃO: Deseja apagar TODOS os dados locais deste aparelho? Esta ação é irreversível.")) {
      await clearLocalDatabase();
      alert("Banco de dados local limpo.");
      onReload();
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-600" />
          Configurações e Banco de Dados Local
        </h2>
        <p className="text-xs md:text-sm text-slate-700 mt-1">
          Gerencie o armazenamento interno deste aparelho e faça backups dos dados da fazenda.
        </p>
      </div>

      {mensagem && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 rounded-xl text-xs font-bold">
          {mensagem}
        </div>
      )}

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
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              Salvar Dados da Fazenda
            </button>

            <button
              type="button"
              onClick={handleExportarPdf}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Salvar dados da fazenda em formato PDF"
            >
              <FileText className="w-4 h-4" />
              <span>Salvar em PDF</span>
            </button>
          </div>
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
            {" "}Todos os seus registros de viveiros e biometrias ficam armazenados no navegador deste celular (IndexedDB). Depois que a aplicação estiver aberta, os registros podem ser consultados e salvos sem internet. Faça backups periódicos; limpar os dados do navegador remove os registros locais.
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
          Se desejar recarregar os viveiros de demonstração ou limpar todos os registros locais deste aparelho:
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
