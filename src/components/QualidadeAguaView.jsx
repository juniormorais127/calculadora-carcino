import React, { useState, useEffect } from "react";
import { Droplets, Plus, AlertTriangle, CheckCircle, Trash2, Calendar, Clock, Sparkles } from "lucide-react";
import { useDatabase } from "./AccountProvider.jsx";
import { calculateToxicAmmonia } from "../services/calculatorService.js";
import { avaliarQualidadeAgua, avaliarParametro } from "../services/qualidadeAguaService.js";
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
  const db = useDatabase();
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
  // Ferro e manganês são opcionais: só fazem sentido em água de poço. Vazio = não medido.
  const [ferro, setFerro] = useState("");
  const [manganes, setManganes] = useState("");
  const [notas, setNotas] = useState("");

  const viveiroAtual = viveiros.find(v => String(v.id) === String(selectedViveiroId));

  const registrosViveiro = qualidadeAgua
    .filter(q => String(q.viveiroId) === String(selectedViveiroId))
    // Desempate por id: duas medições no mesmo dia (manhã e tarde) precisam
    // manter a mais recente como referência, e não a primeira cadastrada
    .sort((a, b) => new Date(b.data) - new Date(a.data) || (Number(b.id) || 0) - (Number(a.id) || 0));

  const ultimoRegistro = registrosViveiro.length > 0 ? registrosViveiro[0] : null;

  // Avaliação da última medição pelos limiares da tabela de referência
  // (o nitrito usa o limiar da salinidade da própria medição)
  const avaliacaoAtual = ultimoRegistro ? avaliarQualidadeAgua(ultimoRegistro) : null;
  const porChave = {};
  avaliacaoAtual?.resultados.forEach(r => { porChave[r.chave] = r; });

  const CORES_NIVEL = {
    otimo: "text-emerald-700",
    atencao: "text-amber-700",
    critico: "text-rose-700",
    emergencial: "text-rose-700",
    sem_dados: "text-slate-500"
  };
  const FUNDO_NIVEL = {
    otimo: "bg-emerald-50 text-emerald-700 border-emerald-100",
    atencao: "bg-amber-50 text-amber-700 border-amber-100",
    critico: "bg-rose-50 text-rose-700 border-rose-100",
    emergencial: "bg-rose-50 text-rose-700 border-rose-100",
    sem_dados: "bg-slate-50 text-slate-600 border-slate-200"
  };
  const nivelDe = (chave) => porChave[chave]?.nivel || "sem_dados";
  const rotuloDe = (chave) => porChave[chave]?.rotulo || "Sem dados";
  const idealDe = (chave) => porChave[chave]?.faixaOtima || "--";

  // Avaliação por linha do histórico: o nitrito de cada registro é julgado pela
  // salinidade daquele mesmo registro, não pela salinidade atual do viveiro
  const avaliacaoPorRegistro = {};
  registrosViveiro.forEach(q => {
    avaliacaoPorRegistro[q.id] = {
      oxigenio: avaliarParametro("oxigenio", q.oxigenio),
      alcalinidade: avaliarParametro("alcalinidade", q.alcalinidade),
      nitrito: avaliarParametro("nitrito", q.nitrito, { salinidadePpt: q.salinidade }),
      ferro: avaliarParametro("ferro", q.ferro),
      manganes: avaliarParametro("manganes", q.manganes)
    };
  });

  // Colunas de metais só entram na tabela se algum registro as tiver
  const temMetais = registrosViveiro.some(q => q.ferro !== undefined || q.manganes !== undefined);

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

    const medicao = {
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
    };

    // Só grava os metais quando foram medidos: gravar zero seria afirmar
    // "não há ferro", o que é diferente de "não medi".
    if (ferro !== "" && Number.isFinite(Number(ferro))) medicao.ferro = Number(ferro);
    if (manganes !== "" && Number.isFinite(Number(manganes))) medicao.manganes = Number(manganes);

    await db.qualidadeAgua.add(medicao);

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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Estado geral da última medição:
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${FUNDO_NIVEL[avaliacaoAtual?.nivelGeral] || FUNDO_NIVEL.sem_dados}`}>
              {avaliacaoAtual?.rotuloGeral || "Sem dados"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Oxigênio */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-600 uppercase">Oxigênio (O2)</span>
              <div className={`text-2xl font-semibold mt-1 ${CORES_NIVEL[nivelDe("oxigenio")]}`}>
                {ultimoRegistro.oxigenio} <span className="text-xs text-slate-900">mg/L</span>
              </div>
              <span className="text-[10px] text-slate-600">
                {rotuloDe("oxigenio")} · ideal {idealDe("oxigenio")}
              </span>
            </div>

            {/* pH */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-600 uppercase">pH</span>
              <div className={`text-2xl font-semibold mt-1 ${CORES_NIVEL[nivelDe("ph")]}`}>
                {ultimoRegistro.ph}
              </div>
              <span className="text-[10px] text-slate-600">
                {rotuloDe("ph")} · ideal {idealDe("ph")}
              </span>
            </div>

            {/* Alcalinidade */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-600 uppercase">Alcalinidade</span>
              <div className={`text-2xl font-semibold mt-1 ${CORES_NIVEL[nivelDe("alcalinidade")]}`}>
                {ultimoRegistro.alcalinidade} <span className="text-xs text-slate-900">mg/L</span>
              </div>
              <span className="text-[10px] text-slate-600">
                {rotuloDe("alcalinidade")} · ideal {idealDe("alcalinidade")}
              </span>
            </div>

            {/* Nitrito — o limite depende da salinidade da medição */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-600 uppercase">Nitrito (N-NO2)</span>
              <div className={`text-2xl font-semibold mt-1 ${CORES_NIVEL[nivelDe("nitrito")]}`}>
                {ultimoRegistro.nitrito ?? "--"} <span className="text-xs text-slate-900">mg/L</span>
              </div>
              <span className="text-[10px] text-slate-600">
                {porChave.nitrito?.aviso ? porChave.nitrito.aviso : `${rotuloDe("nitrito")} · seguro ${idealDe("nitrito")}`}
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

            {/* Metais: só aparecem quando foram medidos (água de poço) */}
            {porChave.ferro && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <span className="text-[11px] font-semibold text-slate-600 uppercase">Ferro total (Fe)</span>
                <div className={`text-2xl font-semibold mt-1 ${CORES_NIVEL[nivelDe("ferro")]}`}>
                  {ultimoRegistro.ferro} <span className="text-xs text-slate-900">mg/L</span>
                </div>
                <span className="text-[10px] text-slate-600">
                  {rotuloDe("ferro")} · ideal {idealDe("ferro")}
                </span>
              </div>
            )}

            {porChave.manganes && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <span className="text-[11px] font-semibold text-slate-600 uppercase">Manganês (Mn)</span>
                <div className={`text-2xl font-semibold mt-1 ${CORES_NIVEL[nivelDe("manganes")]}`}>
                  {ultimoRegistro.manganes} <span className="text-xs text-slate-900">mg/L</span>
                </div>
                <span className="text-[10px] text-slate-600">
                  {rotuloDe("manganes")} · ideal {idealDe("manganes")}
                </span>
              </div>
            )}
          </div>

          {/* Contexto de manejo: condição esperada do sistema, não falha */}
          {porChave.salinidade?.contextual && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-[11px] text-amber-700">
              <b>Salinidade de {ultimoRegistro.salinidade} ppt:</b> {porChave.salinidade.observacaoManejo}
            </div>
          )}
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
                  <th className="py-2.5 px-3">Nitrito (N-NO2)</th>
                  {temMetais && <th className="py-2.5 px-3">Ferro (mg/L)</th>}
                  {temMetais && <th className="py-2.5 px-3">Manganês (mg/L)</th>}
                  <th className="py-2.5 px-3">Secchi (cm)</th>
                  <th className="py-2.5 px-3">Obs.</th>
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
                    <td className={`py-3 px-3 font-semibold text-sm ${CORES_NIVEL[avaliacaoPorRegistro[q.id]?.oxigenio.nivel] || ""}`}>
                      {q.oxigenio}
                    </td>
                    <td className="py-3 px-3">{q.temperatura}°C</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{q.ph}</td>
                    <td className="py-3 px-3">{q.salinidade} ppt</td>
                    <td className={`py-3 px-3 font-semibold ${CORES_NIVEL[avaliacaoPorRegistro[q.id]?.alcalinidade.nivel] || ""}`}>
                      {q.alcalinidade}
                    </td>
                    <td className="py-3 px-3">{q.amoniaTotal} mg/L</td>
                    <td
                      className={`py-3 px-3 font-semibold ${CORES_NIVEL[avaliacaoPorRegistro[q.id]?.nitrito.nivel] || ""}`}
                      title={
                        avaliacaoPorRegistro[q.id]?.nitrito.limiteAplicado
                          ? `Nesta salinidade (${q.salinidade} ppt) o limite seguro é até ${avaliacaoPorRegistro[q.id].nitrito.limiteAplicado.otimoMax} mg/L de N-NO2`
                          : "Informe a salinidade para avaliar o nitrito deste registro"
                      }
                    >
                      {q.nitrito ?? "--"}
                    </td>
                    {temMetais && (
                      <td className={`py-3 px-3 font-semibold ${CORES_NIVEL[avaliacaoPorRegistro[q.id]?.ferro.nivel] || ""}`}>
                        {q.ferro ?? "--"}
                      </td>
                    )}
                    {temMetais && (
                      <td className={`py-3 px-3 font-semibold ${CORES_NIVEL[avaliacaoPorRegistro[q.id]?.manganes.nivel] || ""}`}>
                        {q.manganes ?? "--"}
                      </td>
                    )}
                    <td className="py-3 px-3">{q.transparencia || "--"} cm</td>
                    <td className="py-3 px-3 text-slate-600 max-w-[160px] truncate" title={q.notas || ""}>
                      {q.notas || "--"}
                    </td>
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
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setOxigenio(raw === "" ? "" : raw.replace(/^0+(?=\d)/, ""));
                    }}
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
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setTemperatura(raw === "" ? "" : raw.replace(/^0+(?=\d)/, ""));
                    }}
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
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setPh(raw === "" ? "" : raw.replace(/^0+(?=\d)/, ""));
                    }}
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
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setSalinidade(raw === "" ? "" : raw.replace(/^0+(?=\d)/, ""));
                    }}
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
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setAlcalinidade(raw === "" ? "" : raw.replace(/^0+(?=\d)/, ""));
                    }}
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
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setAmoniaTotal(raw === "" ? "" : raw.replace(/^0+(?=\d)/, ""));
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-600">mg/L NAT</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nitrito (N-NO2):</label>
                  <input
                    type="number"
                    step="0.05"
                    aria-label="Nitrito em base nitrogênio"
                    value={nitrito}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setNitrito(raw === "" ? "" : raw.replace(/^0+(?=\d)/, ""));
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-600">
                    mg/L na base nitrogênio. Se o kit lê NO2-, multiplique por 3,28.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Ferro total (opcional):</label>
                  <input
                    type="number"
                    step="0.05"
                    aria-label="Ferro total"
                    placeholder="só para água de poço"
                    value={ferro}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setFerro(raw === "" ? "" : raw.replace(/^0+(?=\d)/, ""));
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-600">mg/L — deixe vazio se não mediu</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Manganês (opcional):</label>
                  <input
                    type="number"
                    step="0.01"
                    aria-label="Manganês"
                    placeholder="só para água de poço"
                    value={manganes}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setManganes(raw === "" ? "" : raw.replace(/^0+(?=\d)/, ""));
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-600">mg/L — deixe vazio se não mediu</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Transparência:</label>
                  <input
                    type="number"
                    step="1"
                    value={transparencia}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setTransparencia(raw === "" ? "" : raw.replace(/^0+(?=\d)/, ""));
                    }}
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
