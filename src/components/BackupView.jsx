import React, { useState } from "react";
import { Settings, Download, Upload, Trash2, Smartphone, ShieldCheck, Database, RefreshCw } from "lucide-react";
import { db, exportLocalDatabase, importLocalDatabase, seedInitialDataIfEmpty } from "../services/db.js";

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

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    if (farmProfile?.id) {
      await db.configuracoes.update(farmProfile.id, {
        nomeFazenda,
        produtor,
        localizacao,
        updatedAt: new Date().toISOString()
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

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await importLocalDatabase(event.target.result);
        alert("Backup restaurado com sucesso no dispositivo!");
        onReload();
      } catch (err) {
        alert("Erro ao ler o arquivo de backup. Verifique se é um arquivo JSON válido.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = async () => {
    if (confirm("Deseja restaurar os dados de exemplo padrão? Isso adicionará os dados de demonstração.")) {
      await seedInitialDataIfEmpty();
      onReload();
    }
  };

  const handleClearAll = async () => {
    if (confirm("ATENÇÃO: Deseja apagar TODOS os dados locais deste aparelho? Esta ação é irreversível.")) {
      await db.viveiros.clear();
      await db.biometrias.clear();
      await db.qualidadeAgua.clear();
      await db.registrosAlimentacao.clear();
      alert("Banco de dados local limpo.");
      onReload();
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-400" />
          Configurações e Banco de Dados Local
        </h2>
        <p className="text-xs md:text-sm text-slate-300 mt-1">
          Gerencie o armazenamento interno deste aparelho e faça backups dos dados da fazenda.
        </p>
      </div>

      {mensagem && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold">
          {mensagem}
        </div>
      )}

      {/* Perfil da Fazenda */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          Identificação da Propriedade
        </h3>

        <form onSubmit={handleSalvarPerfil} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Nome da Fazenda / Projeto:</label>
              <input
                type="text"
                required
                value={nomeFazenda}
                onChange={(e) => setNomeFazenda(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-bold text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Nome do Produtor / Responsável:</label>
              <input
                type="text"
                required
                value={produtor}
                onChange={(e) => setProdutor(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-bold text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Localização / Município / Região:</label>
            <input
              type="text"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-semibold text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-700/20"
          >
            Salvar Dados da Fazenda
          </button>
        </form>
      </div>

      {/* Estatísticas do Banco Local */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-cyan-400" />
          Armazenamento Local neste Aparelho
        </h3>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="text-2xl font-black text-white">{viveiros.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Viveiros Salvos</div>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="text-2xl font-black text-emerald-400">{biometrias.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Pesagens / Biometrias</div>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="text-2xl font-black text-cyan-400">{qualidadeAgua.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Análises de Água</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/70 flex items-start gap-3 text-xs text-slate-300">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Privacidade e Funcionamento Sem Internet:</span>
            {" "}Todos os seus registros de viveiros e biometrias ficam armazenados diretamente na memória do navegador deste celular (IndexedDB). Não depende de sinal de internet no viveiro.
          </div>
        </div>

        {/* Botões de Ação de Backup */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Baixar Arquivo de Backup (JSON)</span>
          </button>

          <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Restaurar Backup</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Zona de Perigo / Limpeza */}
      <div className="bg-slate-800/40 border border-rose-900/30 rounded-2xl p-5 shadow-lg space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Gerenciar Dados
        </h4>
        <p className="text-xs text-slate-400">
          Se desejar recarregar os viveiros de demonstração ou limpar todos os registros locais deste aparelho:
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={handleResetDemo}
            className="px-3.5 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Carregar Dados de Exemplo</span>
          </button>

          <button
            onClick={handleClearAll}
            className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-semibold text-xs flex items-center gap-1.5 border border-rose-800/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Banco de Dados</span>
          </button>
        </div>
      </div>
    </div>
  );
}
