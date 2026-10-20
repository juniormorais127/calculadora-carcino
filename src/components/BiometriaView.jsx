import React, { useState, useEffect } from "react";
import { Activity, Plus, TrendingUp, Calendar, Trash2, ArrowUpRight, Scale } from "lucide-react";
import { useDatabase } from "./AccountProvider.jsx";
import { saveBiometria, deleteBiometria } from '../services/biometrias.js';
import ModalAvisoViveiroObrigatorio from "./ModalAvisoViveiroObrigatorio.jsx";

export default function BiometriaView({ 
  viveiros = [], 
  biometrias = [], 
  onReload,
  isModalOpenExternal = false,
  onCloseExternalModal = null,
  novoViveiroCriadoId = null,
  onSolicitarCadastroViveiro = null
}) {
  const db = useDatabase();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedViveiroId, setSelectedViveiroId] = useState(
    viveiros.length > 0 ? String(viveiros[0].id) : ""
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAvisoAberto, setModalAvisoAberto] = useState(false);

  // Inputs do modal
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [pesoMedioG, setPesoMedioG] = useState(10.5);
  const [sobrevivenciaEstimada, setSobrevivenciaEstimada] = useState(85);
  const [notas, setNotas] = useState("");

  const viveiroAtual = viveiros.find(v => String(v.id) === String(selectedViveiroId));

  // Biometrias filtradas do viveiro atual ordenadas por data
  const biometriasViveiro = biometrias
    .filter(b => String(b.viveiroId) === String(selectedViveiroId))
    .sort((a, b) => new Date(a.data) - new Date(b.data) || Number(a.id) - Number(b.id));

  const ultimaBiometria = biometriasViveiro.length > 0 
    ? biometriasViveiro[biometriasViveiro.length - 1] 
    : null;

  useEffect(() => {
    if (isModalOpenExternal) {
      if (viveiros.length > 0) {
        handleOpenModal();
      } else {
        setModalAvisoAberto(true);
      }
    }
  }, [isModalOpenExternal, viveiros.length]);

  useEffect(() => {
    if (novoViveiroCriadoId) {
      setSelectedViveiroId(String(novoViveiroCriadoId));
    } else if (viveiros.length > 0 && (!selectedViveiroId || !viveiros.some(v => String(v.id) === String(selectedViveiroId)))) {
      setSelectedViveiroId(String(viveiros[0].id));
    }
  }, [viveiros, novoViveiroCriadoId]);

  const handleOpenModal = () => {
    if (viveiros.length === 0) {
      setModalAvisoAberto(true);
      return;
    }
    setData(new Date().toISOString().split("T")[0]);
    setPesoMedioG(ultimaBiometria ? Number(((Number(ultimaBiometria.pesoMedioG) || 0) + 1.2).toFixed(1)) : 5.0);
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

    if (busy) return;
    setBusy(true); setError('');
    try {
      await saveBiometria(db, viveiroAtual, { data, pesoMedioG, sobrevivenciaEstimada, notas });
      await onReload();
      handleClose();
    } catch (err) { setError(err.message || 'Não foi possível salvar a biometria. Tente novamente.'); }
    finally { setBusy(false); }
  };

  const handleDelete = async (id) => {
    if (busy || !confirm("Excluir esta medição de biometria?")) return;
    setBusy(true); setError('');
    try { await deleteBiometria(db, id); await onReload(); }
    catch (err) { setError(err.message || 'Não foi possível excluir a biometria. Tente novamente.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {error && !isModalOpen && !isModalOpenExternal && <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-700" />
            Biometria e Curva de Crescimento
          </h2>
          <p className="text-xs md:text-sm text-slate-700 mt-1">
            Pesagens semanais calculam automaticamente biomassa, taxa de arraçoamento e ganho de peso.
          </p>
        </div>

        <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-2">
          {viveiros.length > 0 && (
            <select
              value={selectedViveiroId}
              onChange={(e) => setSelectedViveiroId(e.target.value)}
              className="min-w-0 w-full min-[480px]:w-auto min-[480px]:flex-1 bg-white text-slate-900 font-bold text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {viveiros.map(v => (
                <option key={v.id} value={v.id}>{v.nome}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm "
          >
            <Plus className="w-4 h-4" />
            <span>Nova Biometria</span>
          </button>
        </div>
      </div>

      {viveiros.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 shadow-sm">
          <Activity className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Nenhum viveiro cadastrado</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Para lançar pesagens de biometria e acompanhar biomassa, taxa de arraçoamento e curva de crescimento, cadastre primeiro o viveiro da sua fazenda.
          </p>
          <button
            onClick={() => {
              if (onSolicitarCadastroViveiro) {
                onSolicitarCadastroViveiro("biometria");
              } else {
                setModalAvisoAberto(true);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Viveiro</span>
          </button>
        </div>
      ) : (
        <>
          {/* KPI Cards do Viveiro Selecionado */}
          {viveiroAtual && ultimaBiometria && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <span className="text-[11px] font-semibold text-slate-600 uppercase">Peso Atual</span>
                <div className="text-2xl font-semibold text-emerald-700 mt-1">
                  {ultimaBiometria.pesoMedioG} <span className="text-xs text-slate-900">g</span>
                </div>
                <span className="text-[10px] text-slate-600">Em {ultimaBiometria.data}</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <span className="text-[11px] font-semibold text-slate-600 uppercase">Biomassa Estimada</span>
                <div className="text-2xl font-semibold text-slate-900 mt-1">
                  {Math.round(ultimaBiometria.biomassaKg)} <span className="text-xs text-slate-600">kg</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  {(ultimaBiometria.biomassaKg / 1000).toFixed(2)} toneladas
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <span className="text-[11px] font-semibold text-slate-600 uppercase">Ganho Semanal</span>
                <div className="text-2xl font-semibold text-teal-700 mt-1 flex items-center gap-1">
                  {ultimaBiometria.ganhoSemanalG > 0 ? `+${ultimaBiometria.ganhoSemanalG}` : ultimaBiometria.ganhoSemanalG} 
                  <span className="text-xs text-slate-900">g/sem</span>
                </div>
                <span className="text-[10px] text-slate-600">
                  GPD: {ultimaBiometria.ganhoDiarioG} g/dia
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <span className="text-[11px] font-semibold text-slate-600 uppercase">Sobrevivência</span>
                <div className="text-2xl font-semibold text-cyan-700 mt-1">
                  {ultimaBiometria.sobrevivenciaEstimada}%
                </div>
                <span className="text-[10px] text-slate-600">
                  ~{ultimaBiometria.camaroesEstimados?.toLocaleString()} camarões
                </span>
              </div>
            </div>
          )}

          {/* Histórico e Tabela */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" />
                Histórico de Pesagens - {viveiroAtual?.nome || "Selecione um viveiro"}
              </span>
              <span className="text-xs text-slate-600 font-normal">
                {biometriasViveiro.length} registros
              </span>
            </h3>

            {biometriasViveiro.length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-xs">
                Nenhuma biometria cadastrada para este viveiro. Clique em "+ Nova Biometria" para registrar a pesagem semanal.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
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
                  <tbody className="divide-y divide-slate-800 text-slate-800">
                    {biometriasViveiro.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-100 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900">{b.data}</td>
                        <td className="py-3 px-3 font-semibold text-emerald-700 text-sm">{b.pesoMedioG} g</td>
                        <td className="py-3 px-3 text-teal-700 font-bold">
                          {b.ganhoSemanalG ? `+${b.ganhoSemanalG} g` : "--"}
                        </td>
                        <td className="py-3 px-3 font-semibold">{b.biomassaKg ? `${Math.round(b.biomassaKg)} kg` : "--"}</td>
                        <td className="py-3 px-3">{b.sobrevivenciaEstimada}%</td>
                        <td className="py-3 px-3 text-slate-600 italic max-w-xs truncate">{b.notas || "--"}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDelete(b.id)}
                            disabled={busy}
                            aria-label={`Excluir biometria de ${b.data}`}
                            className="text-rose-700 hover:text-rose-700 min-h-11 min-w-11 p-2 disabled:opacity-50 rounded hover:bg-white"
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
        </>
      )}

      {/* Modal de Nova Biometria */}
      {(isModalOpen || isModalOpenExternal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-xl max-h-[90dvh] overflow-y-auto my-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-700" />
              Lançar Biometria Semanal
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              {error && <p role="alert" className="text-sm text-rose-900">{error}</p>}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Viveiro:</label>
                <select
                  value={selectedViveiroId}
                  onChange={(e) => setSelectedViveiroId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {viveiros.map(v => (
                    <option key={v.id} value={v.id}>{v.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Data da Pesagem:</label>
                  <input
                    type="date"
                    required
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Peso Médio (g):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pesoMedioG}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setPesoMedioG(raw === "" ? "" : raw.replace(/^0+(?=\d)/, ""));
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-600">Ex: 11.85 g</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Sobrevivência Estimada (%):
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  required
                  value={sobrevivenciaEstimada}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setSobrevivenciaEstimada(raw === "" ? "" : raw.replace(/^0+(?=\d)/, ""));
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-600">Padrão da carcinicultura brasileira: 75% a 88%</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Observações do Lote:</label>
                <textarea
                  rows="2"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ex: Trato normal, brânquias limpas, 10% em ecdise..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm "
                >
                  {busy ? 'Salvando…' : 'Gravar Biometria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Aviso quando não há viveiros */}
      <ModalAvisoViveiroObrigatorio
        isOpen={modalAvisoAberto}
        tipo="biometria"
        onClose={() => setModalAvisoAberto(false)}
        onCadastrarViveiro={() => {
          setModalAvisoAberto(false);
          onSolicitarCadastroViveiro?.("biometria");
        }}
      />
    </div>
  );
}
