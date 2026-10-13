import React, { useState, useEffect } from "react";
import { Droplets, Plus, AlertTriangle, CheckCircle, Trash2, Calendar, Clock, Sparkles } from "lucide-react";
import { db } from "../services/db.js";
import { calculateToxicAmmonia } from "../services/calculatorService.js";
import { PARAMETROS_QUALIDADE_AGUA } from "../data/carcinoData.js";
import ModalAvisoViveiroObrigatorio from "./ModalAvisoViveiroObrigatorio.jsx";

export default function QualidadeAguaView({ 
  viveiros = [], 
  qualidadeAgua = [], 
  onReload,
  isModalOpenExternal = false,
  onCloseExternalModal = null,
  novoViveiroCriadoId = null,
  onSolicitarCadastroViveiro = null
}) {
  const [selectedViveiroId, setSelectedViveiroId] = useState(
    viveiros.length > 0 ? String(viveiros[0].id) : ""
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAvisoAberto, setModalAvisoAberto] = useState(false);

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
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Droplets className="w-6 h-6 text-cyan-700" />
            Qualidade da Água & Diagnósticos
          </h2>
          <p className="text-xs md:text-sm text-slate-700 mt-1">
            Monitoramento de rotina do viveiro. Amônia tóxica calculada em tempo real com alertas visuais.
          </p>
        </div>

        <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-2">
          {viveiros.length > 0 && (
            <select
              value={selectedViveiroId}
              onChange={(e) => setSelectedViveiroId(e.target.value)}
              className="min-w-0 w-full min-[480px]:w-auto min-[480px]:flex-1 bg-white text-slate-900 font-bold text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {viveiros.map(v => (
                <option key={v.id} value={v.id}>{v.nome}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm "
          >
            <Plus className="w-4 h-4" />
            <span>Nova Medição</span>
          </button>
        </div>
      </div>

      {viveiros.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 shadow-sm">
          <Droplets className="w-10 h-10 text-cyan-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Nenhum viveiro cadastrado</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Para monitorar oxigênio, pH, temperatura, salinidade e amônia tóxica, cadastre primeiro o viveiro correspondente da sua fazenda.
          </p>
          <button
            onClick={() => {
              if (onSolicitarCadastroViveiro) {
                onSolicitarCadastroViveiro("agua");
              } else {
                setModalAvisoAberto(true);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Viveiro</span>
          </button>
        </div>
      ) : (
        <>
          {/* Cartões de Parâmetros Atuais do Viveiro Selecionado */}
          {ultimoRegistro ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Oxigênio */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-600 uppercase">Oxigênio (O2)</span>
            <div className={`text-2xl font-semibold mt-1 ${
              ultimoRegistro.oxigenio >= 4.0 ? "text-emerald-700" : (ultimoRegistro.oxigenio >= 3.0 ? "text-amber-700" : "text-rose-700")
            }`}>
              {ultimoRegistro.oxigenio} <span className="text-xs text-slate-900">mg/L</span>
            </div>
            <span className="text-[10px] text-slate-600">
              {ultimoRegistro.oxigenio >= 4.0 ? "Ótimo para arraçoamento" : "Atenção aeração"}
            </span>
          </div>

          {/* pH */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-600 uppercase">pH</span>
            <div className={`text-2xl font-semibold mt-1 ${
              ultimoRegistro.ph >= 7.8 && ultimoRegistro.ph <= 8.5 ? "text-emerald-700" : "text-amber-700"
            }`}>
              {ultimoRegistro.ph}
            </div>
            <span className="text-[10px] text-slate-600">Faixa ideal: 7.8 a 8.5</span>
          </div>

          {/* Alcalinidade */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-600 uppercase">Alcalinidade</span>
            <div className={`text-2xl font-semibold mt-1 ${
              ultimoRegistro.alcalinidade >= 120 ? "text-emerald-700" : (ultimoRegistro.alcalinidade >= 90 ? "text-amber-700" : "text-rose-700")
            }`}>
              {ultimoRegistro.alcalinidade} <span className="text-xs text-slate-900">mg/L</span>
            </div>
            <span className="text-[10px] text-slate-600">
              {ultimoRegistro.alcalinidade >= 120 ? "Tamponamento estável" : "Baixa! Corrigir"}
            </span>
          </div>

          {/* Amônia Tóxica NH3 Real */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-600 uppercase">NH3 Tóxica Real</span>
            <div className={`text-2xl font-semibold mt-1 ${
              amoniaToxicaRecente && amoniaToxicaRecente.nh3 < 0.05 ? "text-emerald-700" : "text-rose-700"
            }`}>
              {amoniaToxicaRecente?.nh3 || "--"} <span className="text-xs text-slate-900">mg/L</span>
            </div>
            <span className="text-[10px] text-slate-600">
              NAT total: {ultimoRegistro.amoniaTotal} mg/L
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-600">
          Nenhuma medição de água registrada para este viveiro ainda.
        </div>
      )}

      {/* Tabela de Histórico de Medições */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-700" />
            Histórico de Análises de Água - {viveiroAtual?.nome || "Viveiro"}
          </span>
          <span className="text-xs text-slate-600 font-normal">
            {registrosViveiro.length} registros
          </span>
        </h3>

        {registrosViveiro.length === 0 ? (
          <div className="text-center py-6 text-slate-600 text-xs">
            Nenhum registro encontrado.
          </div>
      ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-800 text-slate-800">
                {registrosViveiro.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-100 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div>{q.data}</div>
                      <div className="text-[10px] text-slate-600 font-normal">{q.horario}</div>
                    </td>
                    <td className={`py-3 px-3 font-semibold text-sm ${
                      q.oxigenio >= 4.0 ? "text-emerald-700" : (q.oxigenio >= 3.0 ? "text-amber-700" : "text-rose-700")
                    }`}>
                      {q.oxigenio}
                    </td>
                    <td className="py-3 px-3">{q.temperatura}°C</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{q.ph}</td>
                    <td className="py-3 px-3">{q.salinidade} ppt</td>
                    <td className={`py-3 px-3 font-semibold ${q.alcalinidade >= 110 ? "text-emerald-700" : "text-amber-700"}`}>
                      {q.alcalinidade}
                    </td>
                    <td className="py-3 px-3">{q.amoniaTotal} mg/L</td>
                    <td className="py-3 px-3">{q.transparencia || "--"} cm</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-rose-700 hover:text-rose-700 p-1 rounded hover:bg-white"
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

      {/* Modal de Nova Medição */}
      {(isModalOpen || isModalOpenExternal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-xl max-h-[90dvh] overflow-y-auto my-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-700" />
              Lançar Medição de Qualidade de Água
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Viveiro:</label>
                <select
                  value={selectedViveiroId}
                  onChange={(e) => setSelectedViveiroId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:border-cyan-500 focus:outline-none"
                >
                  {viveiros.map(v => (
                    <option key={v.id} value={v.id}>{v.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Data da Coleta:</label>
                  <input
                    type="date"
                    required
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Horário / Turno:</label>
                  <select
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:border-cyan-500 focus:outline-none"
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Oxigênio (mg/L):</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={oxigenio}
                    onChange={(e) => setOxigenio(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Temp. (°C):</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={temperatura}
                    onChange={(e) => setTemperatura(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">pH da Água:</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={ph}
                    onChange={(e) => setPh(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Salinidade (ppt):</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={salinidade}
                    onChange={(e) => setSalinidade(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Alcalinidade:</label>
                  <input
                    type="number"
                    step="5"
                    required
                    value={alcalinidade}
                    onChange={(e) => setAlcalinidade(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-600">mg/L CaCO3</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Amônia Total:</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={amoniaTotal}
                    onChange={(e) => setAmoniaTotal(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-600">mg/L NAT</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nitrito (NO2):</label>
                  <input
                    type="number"
                    step="0.05"
                    value={nitrito}
                    onChange={(e) => setNitrito(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-600">mg/L</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Transparência:</label>
                  <input
                    type="number"
                    step="1"
                    value={transparencia}
                    onChange={(e) => setTransparencia(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-600">cm (Secchi)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Observações do Viveiro:</label>
                <textarea
                  rows="2"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ex: Cor da água esverdeada, aeração ligada das 22h às 06h..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-cyan-500 focus:outline-none"
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
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm "
                >
                  Salvar Medição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Aviso quando não há viveiros */}
      <ModalAvisoViveiroObrigatorio
        isOpen={modalAvisoAberto}
        tipo="agua"
        onClose={() => setModalAvisoAberto(false)}
        onCadastrarViveiro={() => {
          setModalAvisoAberto(false);
          onSolicitarCadastroViveiro?.("agua");
        }}
      />
    </div>
  );
}
