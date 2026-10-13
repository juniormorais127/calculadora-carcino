import React, { useState } from "react";
import { Activity, Plus, TrendingUp, Calendar, Trash2, ArrowUpRight, Scale } from "lucide-react";
import { db } from "../services/db.js";
import { calculateBiomass, getFeedingRateInfo } from "../services/calculatorService.js";

export default function BiometriaView({ 
  viveiros = [], 
  biometrias = [], 
  onReload,
  isModalOpenExternal = false,
  onCloseExternalModal = null
}) {
  const [selectedViveiroId, setSelectedViveiroId] = useState(
    viveiros.length > 0 ? String(viveiros[0].id) : ""
  );

  const [isModalOpen, setIsModalOpen] = useState(isModalOpenExternal);

  // Inputs do modal
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [pesoMedioG, setPesoMedioG] = useState(10.5);
  const [sobrevivenciaEstimada, setSobrevivenciaEstimada] = useState(85);
  const [notas, setNotas] = useState("");

  const viveiroAtual = viveiros.find(v => String(v.id) === String(selectedViveiroId));

  // Biometrias filtradas do viveiro atual ordenadas por data
  const biometriasViveiro = biometrias
    .filter(b => String(b.viveiroId) === String(selectedViveiroId))
    .sort((a, b) => new Date(a.data) - new Date(b.data));

  const ultimaBiometria = biometriasViveiro.length > 0 
    ? biometriasViveiro[biometriasViveiro.length - 1] 
    : null;

  const handleOpenModal = () => {
    setData(new Date().toISOString().split("T")[0]);
    setPesoMedioG(ultimaBiometria ? Number((ultimaBiometria.pesoMedioG + 1.2).toFixed(1)) : 5.0);
    setSobrevivenciaEstimada(ultimaBiometria ? ultimaBiometria.sobrevivenciaEstimada : 85);
    setNotas("");
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    if (onCloseExternalModal) onCloseExternalModal();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!viveiroAtual) return;

    const qtdEstocada = Number(viveiroAtual.qtdPovoada) || (viveiroAtual.areaM2 * (viveiroAtual.densidadePovoamento || 10));
    const camaroesEstimados = Math.round(qtdEstocada * (Number(sobrevivenciaEstimada) / 100));
    const biomassaKg = calculateBiomass(camaroesEstimados, Number(pesoMedioG));

    // Calcular ganho em relação à biometria anterior
    let ganhoSemanalG = 0;
    let ganhoDiarioG = 0;
    if (ultimaBiometria) {
      const diffPeso = Number(pesoMedioG) - Number(ultimaBiometria.pesoMedioG);
      const diffDias = Math.max(1, Math.round((new Date(data) - new Date(ultimaBiometria.data)) / (1000 * 60 * 60 * 24)));
      ganhoSemanalG = Number(((diffPeso / diffDias) * 7).toFixed(2));
      ganhoDiarioG = Number((diffPeso / diffDias).toFixed(3));
    }

    await db.biometrias.add({
      viveiroId: viveiroAtual.id,
      data,
      pesoMedioG: Number(pesoMedioG),
      sobrevivenciaEstimada: Number(sobrevivenciaEstimada),
      camaroesEstimados,
      biomassaKg,
      ganhoSemanalG,
      ganhoDiarioG,
      notas,
      createdAt: new Date().toISOString()
    });

    handleClose();
    onReload();
  };

  const handleDelete = async (id) => {
    if (confirm("Excluir esta medição de biometria?")) {
      await db.biometrias.delete(id);
      onReload();
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            Biometria e Curva de Crescimento
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            Pesagens semanais calculam automaticamente biomassa, taxa de arraçoamento e ganho de peso.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viveiros.length > 0 && (
            <select
              value={selectedViveiroId}
              onChange={(e) => setSelectedViveiroId(e.target.value)}
              className="bg-slate-800 text-white font-bold text-xs rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-emerald-500"
            >
              {viveiros.map(v => (
                <option key={v.id} value={v.id}>{v.nome}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-700/30"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Biometria</span>
          </button>
        </div>
      </div>

      {/* KPI Cards do Viveiro Selecionado */}
      {viveiroAtual && ultimaBiometria && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Peso Atual</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {ultimaBiometria.pesoMedioG} <span className="text-xs text-white">g</span>
            </div>
            <span className="text-[10px] text-slate-400">Em {ultimaBiometria.data}</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Biomassa Estimada</span>
            <div className="text-2xl font-black text-white mt-1">
              {Math.round(ultimaBiometria.biomassaKg)} <span className="text-xs text-slate-400">kg</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {(ultimaBiometria.biomassaKg / 1000).toFixed(2)} toneladas
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Ganho Semanal</span>
            <div className="text-2xl font-black text-teal-400 mt-1 flex items-center gap-1">
              {ultimaBiometria.ganhoSemanalG > 0 ? `+${ultimaBiometria.ganhoSemanalG}` : ultimaBiometria.ganhoSemanalG} 
              <span className="text-xs text-white">g/sem</span>
            </div>
            <span className="text-[10px] text-slate-400">
              GPD: {ultimaBiometria.ganhoDiarioG} g/dia
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Sobrevivência</span>
            <div className="text-2xl font-black text-cyan-400 mt-1">
              {ultimaBiometria.sobrevivenciaEstimada}%
            </div>
            <span className="text-[10px] text-slate-400">
              ~{ultimaBiometria.camaroesEstimados?.toLocaleString()} camarões
            </span>
          </div>
        </div>
      )}

      {/* Histórico e Tabela */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Histórico de Pesagens - {viveiroAtual?.nome || "Selecione um viveiro"}
          </span>
          <span className="text-xs text-slate-400 font-normal">
            {biometriasViveiro.length} registros
          </span>
        </h3>

        {biometriasViveiro.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Nenhuma biometria cadastrada para este viveiro. Clique em "+ Nova Biometria" para registrar a pesagem semanal.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Peso Médio</th>
                  <th className="py-2.5 px-3">Ganho Semanal</th>
                  <th className="py-2.5 px-3">Biomassa Est.</th>
                  <th className="py-2.5 px-3">Sobrevivência</th>
                  <th className="py-2.5 px-3">Observações</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {biometriasViveiro.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">{b.data}</td>
                    <td className="py-3 px-3 font-black text-emerald-400 text-sm">{b.pesoMedioG} g</td>
                    <td className="py-3 px-3 text-teal-300 font-bold">
                      {b.ganhoSemanalG ? `+${b.ganhoSemanalG} g` : "--"}
                    </td>
                    <td className="py-3 px-3 font-semibold">{b.biomassaKg ? `${Math.round(b.biomassaKg)} kg` : "--"}</td>
                    <td className="py-3 px-3">{b.sobrevivenciaEstimada}%</td>
                    <td className="py-3 px-3 text-slate-400 italic max-w-xs truncate">{b.notas || "--"}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Nova Biometria */}
      {(isModalOpen || isModalOpenExternal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              Lançar Biometria Semanal
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Viveiro:</label>
                <select
                  value={selectedViveiroId}
                  onChange={(e) => setSelectedViveiroId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {viveiros.map(v => (
                    <option key={v.id} value={v.id}>{v.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Data da Pesagem:</label>
                  <input
                    type="date"
                    required
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Peso Médio (g):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pesoMedioG}
                    onChange={(e) => setPesoMedioG(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-black text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Ex: 11.85 g</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Sobrevivência Estimada (%):
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  required
                  value={sobrevivenciaEstimada}
                  onChange={(e) => setSobrevivenciaEstimada(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Padrão da carcinicultura brasileira: 75% a 88%</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Observações do Lote:</label>
                <textarea
                  rows="2"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ex: Trato normal, brânquias limpas, 10% em ecdise..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-700/30"
                >
                  Gravar Biometria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
