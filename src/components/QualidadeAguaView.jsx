import React, { useState } from "react";
import { Droplets, Plus, AlertTriangle, CheckCircle, Trash2, Calendar, Clock, Sparkles } from "lucide-react";
import { db } from "../services/db.js";
import { calculateToxicAmmonia } from "../services/calculatorService.js";
import { PARAMETROS_QUALIDADE_AGUA } from "../data/carcinoData.js";

export default function QualidadeAguaView({ 
  viveiros = [], 
  qualidadeAgua = [], 
  onReload,
  isModalOpenExternal = false,
  onCloseExternalModal = null
}) {
  const [selectedViveiroId, setSelectedViveiroId] = useState(
    viveiros.length > 0 ? String(viveiros[0].id) : ""
  );

  const [isModalOpen, setIsModalOpen] = useState(isModalOpenExternal);

  // Estados do Modal
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [horario, setHorario] = useState("Manhã (06:00)");
  const [oxigenio, setOxigenio] = useState(4.8);
  const [temperatura, setTemperatura] = useState(28.5);
  const [ph, setPh] = useState(8.0);
  const [salinidade, setSalinidade] = useState(20);
  const [alcalinidade, setAlcalinidade] = useState(130);
  const [amoniaTotal, setAmoniaTotal] = useState(0.3);
  const [nitrito, setNitrito] = useState(0.1);
  const [transparencia, setTransparencia] = useState(35);
  const [notas, setNotas] = useState("");

  const viveiroAtual = viveiros.find(v => String(v.id) === String(selectedViveiroId));

  const registrosViveiro = qualidadeAgua
    .filter(q => String(q.viveiroId) === String(selectedViveiroId))
    .sort((a, b) => new Date(b.data) - new Date(a.data));

  const ultimoRegistro = registrosViveiro.length > 0 ? registrosViveiro[0] : null;

  const handleOpenModal = () => {
    setData(new Date().toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    if (onCloseExternalModal) onCloseExternalModal();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!viveiroAtual) return;

    await db.qualidadeAgua.add({
      viveiroId: viveiroAtual.id,
      data,
      horario,
      oxigenio: Number(oxigenio),
      temperatura: Number(temperatura),
      ph: Number(ph),
      salinidade: Number(salinidade),
      alcalinidade: Number(alcalinidade),
      amoniaTotal: Number(amoniaTotal),
      nitrito: Number(nitrito),
      transparencia: Number(transparencia),
      notas,
      createdAt: new Date().toISOString()
    });

    handleClose();
    onReload();
  };

  const handleDelete = async (id) => {
    if (confirm("Excluir esta análise de água?")) {
      await db.qualidadeAgua.delete(id);
      onReload();
    }
  };

  // Cálculo da amônia tóxica da medição recente
  const amoniaToxicaRecente = ultimoRegistro 
    ? calculateToxicAmmonia(ultimoRegistro.amoniaTotal, ultimoRegistro.ph, ultimoRegistro.temperatura, ultimoRegistro.salinidade)
    : null;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Droplets className="w-6 h-6 text-cyan-400" />
            Qualidade da Água & Diagnósticos
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            Monitoramento de rotina do viveiro. Amônia tóxica calculada em tempo real com alertas visuais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viveiros.length > 0 && (
            <select
              value={selectedViveiroId}
              onChange={(e) => setSelectedViveiroId(e.target.value)}
              className="bg-slate-800 text-white font-bold text-xs rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-cyan-500"
            >
              {viveiros.map(v => (
                <option key={v.id} value={v.id}>{v.nome}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-700/30"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Medição</span>
          </button>
        </div>
      </div>

      {/* Cartões de Parâmetros Atuais do Viveiro Selecionado */}
      {ultimoRegistro ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Oxigênio */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Oxigênio (O2)</span>
            <div className={`text-2xl font-black mt-1 ${
              ultimoRegistro.oxigenio >= 4.0 ? "text-emerald-400" : (ultimoRegistro.oxigenio >= 3.0 ? "text-amber-400" : "text-rose-400")
            }`}>
              {ultimoRegistro.oxigenio} <span className="text-xs text-white">mg/L</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {ultimoRegistro.oxigenio >= 4.0 ? "Ótimo para arraçoamento" : "Atenção aeração"}
            </span>
          </div>

          {/* pH */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">pH</span>
            <div className={`text-2xl font-black mt-1 ${
              ultimoRegistro.ph >= 7.8 && ultimoRegistro.ph <= 8.5 ? "text-emerald-400" : "text-amber-400"
            }`}>
              {ultimoRegistro.ph}
            </div>
            <span className="text-[10px] text-slate-400">Faixa ideal: 7.8 a 8.5</span>
          </div>

          {/* Alcalinidade */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Alcalinidade</span>
            <div className={`text-2xl font-black mt-1 ${
              ultimoRegistro.alcalinidade >= 120 ? "text-emerald-400" : (ultimoRegistro.alcalinidade >= 90 ? "text-amber-400" : "text-rose-400")
            }`}>
              {ultimoRegistro.alcalinidade} <span className="text-xs text-white">mg/L</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {ultimoRegistro.alcalinidade >= 120 ? "Tamponamento estável" : "Baixa! Corrigir"}
            </span>
          </div>

          {/* Amônia Tóxica NH3 Real */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">NH3 Tóxica Real</span>
            <div className={`text-2xl font-black mt-1 ${
              amoniaToxicaRecente && amoniaToxicaRecente.nh3 < 0.05 ? "text-emerald-400" : "text-rose-400"
            }`}>
              {amoniaToxicaRecente?.nh3 || "--"} <span className="text-xs text-white">mg/L</span>
            </div>
            <span className="text-[10px] text-slate-400">
              NAT total: {ultimoRegistro.amoniaTotal} mg/L
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 text-center text-xs text-slate-400">
          Nenhuma medição de água registrada para este viveiro ainda.
        </div>
      )}

      {/* Tabela de Histórico de Medições */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Histórico de Análises de Água - {viveiroAtual?.nome || "Viveiro"}
          </span>
          <span className="text-xs text-slate-400 font-normal">
            {registrosViveiro.length} registros
          </span>
        </h3>

        {registrosViveiro.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Nenhum registro encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Data / Turno</th>
                  <th className="py-2.5 px-3">O2 (mg/L)</th>
                  <th className="py-2.5 px-3">Temp (°C)</th>
                  <th className="py-2.5 px-3">pH</th>
                  <th className="py-2.5 px-3">Salin. (ppt)</th>
                  <th className="py-2.5 px-3">Alcalinidade</th>
                  <th className="py-2.5 px-3">Amônia (NAT)</th>
                  <th className="py-2.5 px-3">Secchi (cm)</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {registrosViveiro.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">
                      <div>{q.data}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{q.horario}</div>
                    </td>
                    <td className={`py-3 px-3 font-black text-sm ${
                      q.oxigenio >= 4.0 ? "text-emerald-400" : (q.oxigenio >= 3.0 ? "text-amber-400" : "text-rose-400")
                    }`}>
                      {q.oxigenio}
                    </td>
                    <td className="py-3 px-3">{q.temperatura}°C</td>
                    <td className="py-3 px-3 font-bold text-white">{q.ph}</td>
                    <td className="py-3 px-3">{q.salinidade} ppt</td>
                    <td className={`py-3 px-3 font-semibold ${q.alcalinidade >= 110 ? "text-emerald-400" : "text-amber-400"}`}>
                      {q.alcalinidade}
                    </td>
                    <td className="py-3 px-3">{q.amoniaTotal} mg/L</td>
                    <td className="py-3 px-3">{q.transparencia || "--"} cm</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDelete(q.id)}
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

      {/* Modal de Nova Medição */}
      {(isModalOpen || isModalOpenExternal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-400" />
              Lançar Medição de Qualidade de Água
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Viveiro:</label>
                <select
                  value={selectedViveiroId}
                  onChange={(e) => setSelectedViveiroId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-cyan-500 focus:outline-none"
                >
                  {viveiros.map(v => (
                    <option key={v.id} value={v.id}>{v.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Data:</label>
                  <input
                    type="date"
                    required
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Horário / Turno:</label>
                  <select
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Manhã (06:00)">Manhã (Amanhecer ~06:00)</option>
                    <option value="Tarde (15:00)">Tarde (Sol forte ~15:00)</option>
                    <option value="Noite (22:00)">Noite (Aeração ~22:00)</option>
                    <option value="Madrugada (03:00)">Madrugada (Crítico ~03:00)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Oxigênio (mg/L):</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={oxigenio}
                    onChange={(e) => setOxigenio(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-black text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Temp. (°C):</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={temperatura}
                    onChange={(e) => setTemperatura(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-black text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">pH:</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={ph}
                    onChange={(e) => setPh(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-black text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Salinidade (ppt):</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={salinidade}
                    onChange={(e) => setSalinidade(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-black text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Alcalinidade:</label>
                  <input
                    type="number"
                    step="5"
                    required
                    value={alcalinidade}
                    onChange={(e) => setAlcalinidade(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-black text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400">mg/L CaCO3</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Amônia Total:</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={amoniaTotal}
                    onChange={(e) => setAmoniaTotal(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-black text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400">mg/L NAT</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nitrito:</label>
                  <input
                    type="number"
                    step="0.05"
                    value={nitrito}
                    onChange={(e) => setNitrito(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-black text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400">mg/L</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Transparência:</label>
                  <input
                    type="number"
                    step="1"
                    value={transparencia}
                    onChange={(e) => setTransparencia(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-black text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400">cm (Secchi)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Observações do Viveiro:</label>
                <textarea
                  rows="2"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ex: Cor da água esverdeada, aeração ligada das 22h às 06h..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-cyan-500 focus:outline-none"
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
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-700/30"
                >
                  Salvar Medição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
