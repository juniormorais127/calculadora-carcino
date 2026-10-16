import React, { useEffect, useState } from "react";
import { Layers, Plus, Trash2, Edit3, Calendar, Droplets, Maximize2 } from "lucide-react";
import { deleteViveiro } from "../services/db.js";
import { useDatabase } from "./AccountProvider.jsx";
import PondLocationFields from './PondLocationFields.jsx';
import { parsePondLocation } from '../services/pondLocation.js';

export default function ViveirosList({ 
  viveiros = [], 
  onReload, 
  isModalOpenExternal = false, 
  onCloseExternalModal,
  onViveiroCriado,
  intencaoPosViveiro = null
}) {
  const db = useDatabase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingViveiro, setEditingViveiro] = useState(null);
  const [location, setLocation] = useState({ latitude: '', longitude: '' });
  const [saveError, setSaveError] = useState('');

  const [nome, setNome] = useState("");
  const [areaM2, setAreaM2] = useState(10000);
  const [profundidadeM, setProfundidadeM] = useState(1.2);
  const [dataPovoamento, setDataPovoamento] = useState(new Date().toISOString().split("T")[0]);
  const [qtdPovoada, setQtdPovoada] = useState(120000);
  const [densidadePovoamento, setDensidadePovoamento] = useState(12);
  const [status, setStatus] = useState("ativo");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (isModalOpenExternal) handleOpenModal();
  }, [isModalOpenExternal]);

  const handleClose = () => {
    setIsModalOpen(false);
    onCloseExternalModal?.();
  };

  const handleOpenModal = (v = null) => {
    setSaveError('');
    setLocation({ latitude: String(v?.latitude ?? ''), longitude: String(v?.longitude ?? ''), locationAccuracyM: v?.locationAccuracyM ?? null, locationCapturedAt: v?.locationCapturedAt ?? null });
    if (v) {
      setEditingViveiro(v);
      setNome(v.nome);
      setAreaM2(v.areaM2);
      setProfundidadeM(v.profundidadeM || 1.2);
      setDataPovoamento(v.dataPovoamento);
      setQtdPovoada(v.qtdPovoada || 100000);
      setDensidadePovoamento(v.densidadePovoamento || 10);
      setStatus(v.status || "ativo");
      setObservacoes(v.observacoes || "");
    } else {
      setEditingViveiro(null);
      setNome(`Viveiro 0${viveiros.length + 1}`);
      setAreaM2(10000);
      setProfundidadeM(1.2);
      setDataPovoamento(new Date().toISOString().split("T")[0]);
      setQtdPovoada(120000);
      setDensidadePovoamento(12);
      setStatus("ativo");
      setObservacoes("");
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    let coordinates;
    try { coordinates = parsePondLocation(location.latitude, location.longitude); }
    catch (err) { setSaveError(err.message); return; }
    setSaveError('');
    const vol = Number((Number(areaM2) * Number(profundidadeM)).toFixed(0));
    const dens = Number(areaM2) > 0 ? Number((Number(qtdPovoada) / Number(areaM2)).toFixed(1)) : 0;

    const dados = {
      ...coordinates,
      locationAccuracyM: coordinates.latitude === null ? null : location.locationAccuracyM ?? null,
      locationCapturedAt: coordinates.latitude === null ? null : location.locationCapturedAt ?? null,
      nome,
      areaM2: Number(areaM2),
      profundidadeM: Number(profundidadeM),
      volumeM3: vol,
      dataPovoamento,
      qtdPovoada: Number(qtdPovoada),
      densidadePovoamento: dens,
      status,
      observacoes,
      updatedAt: new Date().toISOString()
    };

    let novoId = null;
    const isNovo = !editingViveiro;

    if (editingViveiro) {
      await db.viveiros.update(editingViveiro.id, dados);
      novoId = editingViveiro.id;
    } else {
      dados.createdAt = new Date().toISOString();
      novoId = await db.viveiros.add(dados);
    }

    handleClose();
    await onReload?.();

    if (isNovo && onViveiroCriado) {
      onViveiroCriado(novoId);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Deseja realmente excluir este viveiro? Suas medições também serão removidas.")) {
      await deleteViveiro(id, db);
      onReload();
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-700" />
            Gestão de Viveiros da Fazenda
          </h2>
          <p className="text-xs md:text-sm text-slate-700 mt-1">
            Cadastre as dimensões e datas de povoamento para alimentar as calculadoras automáticas.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-sm  transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Viveiro</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {viveiros.map((v) => (
          <div
            key={v.id}
            className="bg-white border border-slate-200 hover:border-emerald-500/40 card-hover-lift rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4 transition-all duration-300"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{v.nome}</h3>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {(v.areaM2 / 10000).toFixed(2)} ha • {v.areaM2.toLocaleString()} m²
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  v.status === "ativo" 
                    ? "bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 shadow-2xs" 
                    : "bg-slate-100 text-slate-700"
                }`}>
                  {v.status === "ativo" && (
                    <span className="relative flex h-2 w-2">
                      <span className="radar-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                  )}
                  {v.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-600 block text-[10px] uppercase font-semibold">Volume d'água</span>
                  <span className="text-slate-900 font-semibold">{v.volumeM3?.toLocaleString()} m³</span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px] uppercase font-semibold">Densidade</span>
                  <span className="text-emerald-700 font-semibold">{v.densidadePovoamento || 10} cam/m²</span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px] uppercase font-semibold">Povoamento</span>
                  <span className="text-slate-800 font-bold">{v.dataPovoamento}</span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px] uppercase font-semibold">PLs Estocadas</span>
                  <span className="text-slate-800 font-bold">{v.qtdPovoada?.toLocaleString() || "--"}</span>
                </div>
              </div>

              {Number.isFinite(v.latitude) && Number.isFinite(v.longitude) && <a href={`https://www.google.com/maps/search/?api=1&query=${v.latitude},${v.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 min-h-11 py-3 text-xs font-semibold text-emerald-800 underline underline-offset-4">Ver localização no mapa ({v.latitude.toFixed(6)}, {v.longitude.toFixed(6)})</a>}
              {v.observacoes && (
                <p className="text-xs text-slate-600 mt-3 italic line-clamp-2">
                    : "{v.observacoes}"
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => handleOpenModal(v)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-100 text-slate-800 text-xs flex items-center gap-1 font-semibold"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => handleDelete(v.id)}
                className="p-2 rounded-lg bg-rose-50 hover:bg-rose-50 text-rose-700 text-xs flex items-center gap-1 font-semibold border border-rose-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-xl max-h-[90dvh] overflow-y-auto my-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-700" />
              {editingViveiro ? "Editar Viveiro" : "Cadastrar Novo Viveiro"}
            </h3>

            {intencaoPosViveiro && !editingViveiro && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 text-xs text-emerald-800 flex items-start gap-2.5">
                <span className="font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide flex-shrink-0 mt-0.5">
                  Passo 1 de 2
                </span>
                <span>
                  Cadastre as dimensões deste viveiro. Assim que salvar, abriremos diretamente a tela de{" "}
                  <strong>{intencaoPosViveiro === "biometria" ? "Biometria" : "Qualidade da Água"}</strong> para você lançar seus dados!
                </span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <PondLocationFields value={location} onChange={setLocation} />
              {saveError && <p role="alert" className="text-sm text-rose-800">{saveError}</p>}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nome / Identificação:</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Viveiro 01 - Berçário"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Área (m²):</label>
                  <input
                    type="number"
                    required
                    value={areaM2}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setAreaM2(raw === "" ? "" : raw.replace(/^0+(?=\d)/, ""));
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-600">10.000 m² = 1 ha</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Profundidade Média (m):</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={profundidadeM}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setProfundidadeM(raw === "" ? "" : raw.replace(/^0+(?=\d)/, ""));
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-600">Padrão: 1.0 a 1.4 m</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Data de Povoamento:</label>
                  <input
                    type="date"
                    required
                    value={dataPovoamento}
                    onChange={(e) => setDataPovoamento(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Quantidade de Pós-Larvas:</label>
                  <input
                    type="number"
                    required
                    value={qtdPovoada}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setQtdPovoada(raw === "" ? "" : raw.replace(/^0+(?=\d)/, ""));
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Status do Viveiro:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="ativo">Ativo (Em Cultivo)</option>
                  <option value="preparo">Em Preparação / Calagem</option>
                  <option value="despescado">Despescado (Vazio)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Observações:</label>
                <textarea
                  rows="2"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Histórico do viveiro, aeração, linhagem de PL..."
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
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                >
                  {intencaoPosViveiro && !editingViveiro ? (
                    `Salvar e Ir para ${intencaoPosViveiro === "biometria" ? "Biometria" : "Qualidade da Água"}`
                  ) : (
                    editingViveiro ? "Salvar Alterações" : "Salvar Viveiro"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
