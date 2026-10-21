import React, { useEffect, useRef, useState } from "react";
import { 
  ShieldAlert, 
  CheckSquare, 
  Search, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  Info, 
  Flame, 
  ChevronDown, 
  ChevronUp, 
  FileCheck2, 
  BookOpen, 
  Sprout, 
  Store,
  Camera,
  Maximize2,
  X
} from "lucide-react";
import { DOENCAS_CAMARAO, BOAS_PRATICAS_ABCC } from "../data/carcinoData.js";
import { DADOS_PROBIOTICOS_SOLO } from "../data/probioticosSolo.js";
import { loadChecklist, saveChecklist } from "../services/checklistService.js";
import { useDatabase } from './AccountProvider.jsx';

const formatImgUrl = (path) => {
  if (!path) return "";
  const base = import.meta.env.BASE_URL || "/";
  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
};

export default function SanidadeView({ onNavigate }) {
  const database = useDatabase();
  const [activeSubTab, setActiveSubTab] = useState("doencas"); // doencas, bpm, inovacoes
  const [buscaSintoma, setBuscaSintoma] = useState("");
  const [expandedDoencaId, setExpandedDoencaId] = useState("wssv");
  const [selectedImageModal, setSelectedImageModal] = useState(null);

  useEffect(() => {
    if (!selectedImageModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedImageModal(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedImageModal]);

  const [checkedItens, setCheckedItens] = useState({});
  const checkedRef = useRef({});
  const [checklistReady, setChecklistReady] = useState(false);
  const [checklistError, setChecklistError] = useState("");

  useEffect(() => {
    let active = true;
    setChecklistReady(false);
    loadChecklist(database).then(saved => {
      if (!active) return;
      checkedRef.current = saved;
      setCheckedItens(saved);
      setChecklistReady(true);
    }).catch(() => {
      if (active) setChecklistError("Não foi possível carregar o checklist salvo. Volte a esta aba para tentar novamente.");
    });
    return () => { active = false; };
  }, [database]);

  const toggleCheckItem = async (id) => {
    const novo = { ...checkedRef.current, [id]: !checkedRef.current[id] };
    checkedRef.current = novo;
    setCheckedItens(novo);
    setChecklistError("");
    try {
      await saveChecklist(novo, database);
    } catch {
      setChecklistError("Não foi possível salvar a alteração. Verifique o espaço disponível no aparelho e tente novamente.");
    }
  };

  // Calcular pontuação de conformidade ABCC
  const totalItens = BOAS_PRATICAS_ABCC.reduce((acc, cat) => acc + cat.itens.length, 0);
  const marcadosCount = BOAS_PRATICAS_ABCC.flatMap(cat => cat.itens).filter(item => checkedItens[item.id]).length;
  const porcentagemBPM = totalItens > 0 ? Math.round((marcadosCount / totalItens) * 100) : 0;

  // Filtro de doenças por nome ou sintomas
  const doencasFiltradas = DOENCAS_CAMARAO.filter(d => {
    const termo = buscaSintoma.toLowerCase();
    const matchNome = d.nome.toLowerCase().includes(termo) || d.sigla.toLowerCase().includes(termo);
    const matchSintoma = d.sintomas.some(s => s.toLowerCase().includes(termo));
    return matchNome || matchSintoma;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {checklistError && <p role="alert" className="p-3 rounded-xl bg-rose-50 text-rose-700">{checklistError}</p>}
      {/* Header da Aba */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-700" />
              Sanidade, Doenças e Boas Práticas ABCC
            </h2>
            <p className="text-sm text-slate-700 mt-1 max-w-2xl">
              Manual de campo para identificação de patologias do camarão (*Litopenaeus vannamei*), ações emergenciais e checklist oficial de biossegurança.
            </p>
          </div>

          {/* Sub-navegação */}
          <div aria-label="Seções de sanidade" className="flex w-full min-w-0 flex-col sm:flex-row md:w-auto md:flex-wrap gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveSubTab("doencas")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === "doencas"
                  ? "bg-rose-600 text-white shadow-sm "
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Guia de Doenças</span>
            </button>

            <button
              onClick={() => setActiveSubTab("bpm")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === "bpm"
                  ? "bg-emerald-600 text-white shadow-sm "
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Checklist BPM ABCC</span>
            </button>

            <button
              onClick={() => setActiveSubTab("inovacoes")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === "inovacoes"
                  ? "bg-emerald-600 text-white shadow-sm "
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Novidades & Futuro</span>
            </button>

            <button
              onClick={() => setActiveSubTab("probioticos")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === "probioticos"
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sprout className="w-4 h-4" />
              <span>Probióticos de Solo & H2S</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-ABA 1: GUIA VISUAL DE DOENÇAS                              */}
      {/* ============================================================== */}
      {activeSubTab === "doencas" && (
        <div className="space-y-4">
          {/* Barra de Busca de Sintomas */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Pesquisar doenças por nome ou sintoma"
              value={buscaSintoma}
              onChange={(e) => setBuscaSintoma(e.target.value)}
              placeholder="Pesquise por sintoma (ex: manchas brancas, músculo branco, hepatopâncreas pálido, casca mole, retardo)..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-sm"
            />
          </div>

          {/* Lista de Doenças com Cards Detalhados */}
          <div className="space-y-3.5">
            {doencasFiltradas.map((doenca) => {
              const isExpanded = expandedDoencaId === doenca.id;

              return (
                <div
                  key={doenca.id}
                  className={`bg-white border transition-all rounded-3xl overflow-hidden shadow-sm ${
                    isExpanded 
                      ? "border-rose-600/50 bg-white" 
                  : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Cabeçalho do Card */}
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`doenca-${doenca.id}`}
                    onClick={() => setExpandedDoencaId(isExpanded ? null : doenca.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left cursor-pointer select-none"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center font-semibold text-sm shadow-sm ${
                        doenca.cor === "rose" 
                          ? "bg-rose-500/20 text-rose-700 border border-rose-500/30" 
                          : (doenca.cor === "amber" 
                              ? "bg-amber-500/20 text-amber-700 border border-amber-500/30" 
                              : "bg-teal-500/20 text-teal-700 border border-teal-500/30")
                      }`}>
                        {doenca.sigla.slice(0, 4)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{doenca.nome}</h3>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700">
                            {doenca.tipo}
                          </span>
                          {doenca.imagem && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <Camera className="w-3 h-3 text-emerald-600" />
                              Foto ABCC
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-rose-700 font-medium mt-0.5">
                          {doenca.gravidade}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="hidden sm:inline text-xs text-slate-600 font-medium">
                        {isExpanded ? "Recolher detalhes" : "Ver diagnóstico e foto"}
                      </span>
                      <span className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </div>
                  </button>

                  {/* Corpo Expansível com Sinais Clínicos e Ação de Emergência */}
                  {isExpanded && (
                    <div id={`doenca-${doenca.id}`} className="p-5 pt-0 border-t border-slate-200 space-y-4">
                      {/* Período Crítico */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                        <span className="font-bold text-amber-700 block mb-0.5">Período Crítico de Risco:</span>
                        <p className="text-slate-700">{doenca.periodoCritico}</p>
                      </div>

                      {/* Registro Fotográfico e Fonte Oficial */}
                      {doenca.imagem && (
                        <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                              <Camera className="w-4 h-4 text-emerald-600" />
                              Registro Fotográfico de Campo (ABCC):
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedImageModal({
                                src: formatImgUrl(doenca.imagem),
                                title: doenca.nome,
                                sigla: doenca.sigla,
                                legenda: doenca.legendaImagem,
                                fonte: doenca.fonteImagem
                              })}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-xl transition-all shadow-xs cursor-pointer"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Ampliar Foto</span>
                            </button>
                          </div>

                          {/* Foto Interativa com clique para ampliar */}
                          <div
                            role="button"
                            tabIndex={0}
                            aria-label={`Ampliar foto clínica de ${doenca.nome}`}
                            onClick={() => setSelectedImageModal({
                              src: formatImgUrl(doenca.imagem),
                              title: doenca.nome,
                              sigla: doenca.sigla,
                              legenda: doenca.legendaImagem,
                              fonte: doenca.fonteImagem
                            })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedImageModal({
                                  src: formatImgUrl(doenca.imagem),
                                  title: doenca.nome,
                                  sigla: doenca.sigla,
                                  legenda: doenca.legendaImagem,
                                  fonte: doenca.fonteImagem
                                });
                              }
                            }}
                            className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-900 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <img
                              src={formatImgUrl(doenca.imagem)}
                              alt={`Identificação patológica de ${doenca.nome} (${doenca.sigla})`}
                              loading="lazy"
                              className="w-full h-48 sm:h-64 object-cover object-center group-hover:scale-102 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                              <span className="text-[11px] text-white/95 font-medium flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                                <Maximize2 className="w-3 h-3 text-emerald-400" />
                                Toque na imagem para ampliar em alta definição
                              </span>
                            </div>
                          </div>

                          {/* Legenda Diagnóstica e Fonte Citada Logo Abaixo */}
                          <div className="space-y-1.5 pt-0.5">
                            {doenca.legendaImagem && (
                              <p className="text-xs text-slate-700 leading-relaxed">
                                <strong className="font-semibold text-slate-900">Sinal Patológico:</strong> {doenca.legendaImagem}
                              </p>
                            )}
                            {doenca.fonteImagem && (
                              <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                                <BookOpen className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <div>
                                  <span className="font-semibold text-slate-800">Fonte: </span>
                                  <span className="text-slate-600">{doenca.fonteImagem}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sinais Clínicos Visuais */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                          Sintomas e Sinais Visuais no Campo:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {doenca.sintomas.map((sintoma, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0 mt-1.5"></span>
                              <span>{sintoma}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ação Emergencial de Campo */}
                      <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-rose-700" />
                          Protocolo de Ação Imediata (Emergência):
                        </span>
                        <p className="text-xs text-rose-700 leading-relaxed">
                          {doenca.acaoEmergencia}
                        </p>
                      </div>

                      {/* Prevenção e Biossegurança */}
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-700" />
                          Prevenção Recomendada (Padrão ABCC/MAPA):
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {doenca.prevencao}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-ABA 2: CHECKLIST BPM DA ABCC                               */}
      {/* ============================================================== */}
      {activeSubTab === "bpm" && (
        <div className="space-y-5">
          {/* Placar de Conformidade de Biossegurança */}
          <div className="bg-gradient-to-r from-emerald-50 via-slate-50 to-teal-50 border border-emerald-100 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center justify-center sm:justify-start gap-1.5">
                <FileCheck2 className="w-4 h-4" />
                Conformidade de Biossegurança da Fazenda
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Índice de Boas Práticas ABCC: {porcentagemBPM}%
              </h3>
              <p className="text-xs text-slate-700">
                {marcadosCount} de {totalItens} práticas implementadas neste aparelho.
              </p>
            </div>

            <div className="w-24 h-24 rounded-full border-4 border-slate-200 flex items-center justify-center relative bg-slate-50 shadow-sm">
              <div 
                className="absolute inset-0 rounded-full border-4 border-emerald-500" 
                style={{ clipPath: `polygon(0 0, 100% 0, 100% ${porcentagemBPM}%, 0 ${porcentagemBPM}%)` }}
              ></div>
              <span className="text-2xl font-semibold text-slate-900">{porcentagemBPM}%</span>
            </div>
          </div>

          {/* Categorias do Checklist */}
          <div className="space-y-4">
            {BOAS_PRATICAS_ABCC.map((categoria) => (
              <div key={categoria.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-emerald-700" />
                    {categoria.fase}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {categoria.descricao}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {categoria.itens.map((item) => {
                    const isChecked = !!checkedItens[item.id];

                    return (
                      <label
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isChecked 
                            ? "bg-emerald-50 border-emerald-700/60 text-slate-900" 
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!checklistReady}
                          checked={isChecked}
                          onChange={() => toggleCheckItem(item.id)}
                          aria-label={item.titulo}
                          className="w-5 h-5 min-h-5 shrink-0 rounded-lg text-emerald-600 bg-white border-slate-300 focus:ring-0 mt-0.5 cursor-pointer accent-emerald-500"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-sm font-bold ${isChecked ? "text-emerald-700" : "text-slate-900"}`}>
                              {item.titulo}
                            </span>
                            {item.obrigatorio && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 border border-rose-500/30 font-bold">
                                Obrigatório
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {item.detalhe}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-ABA 3: INOVAÇÕES & FUTURO DA CARCINICULTURA                */}
      {/* ============================================================== */}
      {activeSubTab === "inovacoes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-emerald-600/30 rounded-3xl p-5 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-700" />
              Cultivo Multifásico (Berçários Hiperintensivos)
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Redução de Ciclo e Blindagem Imunológica
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Manter as pós-larvas por 15 a 25 dias em tanques berçários circulares com aeração intensa e bioflocos até atingirem 0.5 a 1.0g.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200 space-y-1">
              <div className="font-bold text-emerald-800">Vantagens comprovadas:</div>
              <div>• Reduz o tempo de permanência no viveiro de terra de 90 para 65 dias;</div>
              <div>• Aumenta a sobrevivência geral em até 15%;</div>
              <div>• Protege os animais na fase de maior vulnerabilidade contra o AHPND/EMS.</div>
            </div>
          </div>

          <div className="bg-white border border-teal-600/30 rounded-3xl p-5 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              Biorremediação com Cepas de Bacillus
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Exclusão Competitiva contra Vibrios
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              O uso profilático semanal de probióticos concentrados (*Bacillus subtilis, B. licheniformis*) atua consumindo matéria orgânica no fundo do viveiro e impedindo que bactérias patogênicas colonizem o trato digestivo dos camarões.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200 space-y-1">
              <div className="font-bold text-teal-700">Impacto na Qualidade da Água:</div>
              <div>• Menor acúmulo de lodo negro anaeróbio;</div>
              <div>• Estabilização natural da amônia e do nitrito;</div>
              <div>• Melhora no Fator de Conversão Alimentar (FCA).</div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-ABA 4: BIORREMEDIAÇÃO DE SOLO & PROBIÓTICOS (H2S & LODO)   */}
      {/* ============================================================== */}
      {activeSubTab === "probioticos" && (
        <div className="space-y-5">
          {/* Banner de Apresentação */}
          <div className="light-panel bg-blue-50 text-slate-900 rounded-3xl p-5 sm:p-6 shadow-md border border-teal-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2.5 py-0.5 rounded-full inline-block">
                  Manejo Sanitário do Sedimento
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {DADOS_PROBIOTICOS_SOLO.visaoGeral.titulo}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {DADOS_PROBIOTICOS_SOLO.visaoGeral.resumo}
                </p>
              </div>

              {onNavigate && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => onNavigate("calculadoras")}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs"
                  >
                    Calcular Doses no Viveiro
                  </button>
                  <button
                    onClick={() => onNavigate("mercado")}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Onde Comprar Probióticos</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Grid com Cepas Bacterianas */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Sprout className="w-4 h-4 text-teal-700" />
              Consórcios Bacterianos Essenciais para Solo:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DADOS_PROBIOTICOS_SOLO.cepasBacterianas.map((cepa, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="text-base font-bold text-slate-900">{cepa.nome}</h5>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {cepa.tipo}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{cepa.funcao}</p>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div><strong>Enzimas ativas:</strong> {cepa.enzimas}</div>
                    <div><strong>Condição ótima:</strong> {cepa.condicaoIdeal}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Protocolo de Ativação / Biofermentação */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              {DADOS_PROBIOTICOS_SOLO.protocoloAtivacaoBiofermentacao.titulo}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DADOS_PROBIOTICOS_SOLO.protocoloAtivacaoBiofermentacao.ingredientes.map((ing, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-xs font-bold text-slate-800 block">{ing.item}</span>
                  <span className="text-xs text-emerald-700 font-semibold">{ing.proporcao}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block mb-1">Passo a Passo de Aplicação no Campo:</span>
              {DADOS_PROBIOTICOS_SOLO.protocoloAtivacaoBiofermentacao.passos.map((p, idx) => (
                <p key={idx} className="leading-relaxed">{p}</p>
              ))}
            </div>
          </div>

          {/* Tabela de Toxicidade do H2S e Potencial Redox */}
          <div className="bg-white border border-rose-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Gás Sulfídrico (H2S) e Escala de Potencial Redox (ORP)</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {DADOS_PROBIOTICOS_SOLO.impactoRedoxEH2S.gasSulfidrico.explicacao}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2">
              {DADOS_PROBIOTICOS_SOLO.impactoRedoxEH2S.potencialRedox.faixas.map((f, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <span className="text-xs font-black text-slate-900 block">{f.faixa}</span>
                  <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">{f.status}</span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">{f.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal / Lightbox de Visualização em Alta Resolução */}
      {selectedImageModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto em alta resolução de ${selectedImageModal.title}`}
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200"
          >
            {/* Header do Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-bold rounded-lg bg-rose-100 text-rose-800 border border-rose-200">
                    {selectedImageModal.sigla}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    {selectedImageModal.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Identificação Patológica e Diagnóstico Visual</p>
              </div>

              <button
                type="button"
                aria-label="Fechar visualização"
                onClick={() => setSelectedImageModal(null)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Imagem em Alta Resolução */}
            <div className="flex-1 min-h-0 bg-slate-950 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
              <img
                src={selectedImageModal.src}
                alt={selectedImageModal.title}
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            {/* Rodapé com Legenda e Fonte Técnica */}
            <div className="p-4 sm:p-5 bg-white border-t border-slate-200 space-y-2">
              {selectedImageModal.legenda && (
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong className="font-semibold text-slate-900">Sinal Patológico: </strong>
                  {selectedImageModal.legenda}
                </p>
              )}
              {selectedImageModal.fonte && (
                <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <BookOpen className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Fonte: </span>
                    <span>{selectedImageModal.fonte}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
