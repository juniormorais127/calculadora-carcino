import React, { useState } from "react";
import { 
  ShieldAlert, 
  CheckSquare, 
  Search, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  Info, 
  Flame, 
  ChevronDown, 
  ChevronUp,
  FileCheck2,
  BookOpen
} from "lucide-react";
import { DOENCAS_CAMARAO, BOAS_PRATICAS_ABCC } from "../data/carcinoData.js";

export default function SanidadeView() {
  const [activeSubTab, setActiveSubTab] = useState("doencas"); // doencas, bpm, inovacoes
  const [buscaSintoma, setBuscaSintoma] = useState("");
  const [expandedDoencaId, setExpandedDoencaId] = useState("wssv");

  // Estado do checklist BPM armazenado em memória local
  const [checkedItens, setCheckedItens] = useState(() => {
    try {
      const saved = localStorage.getItem("carcino_bpm_checklist");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleCheckItem = (id) => {
    const novo = { ...checkedItens, [id]: !checkedItens[id] };
    setCheckedItens(novo);
    try {
      localStorage.setItem("carcino_bpm_checklist", JSON.stringify(novo));
    } catch {}
  };

  // Calcular pontuação de conformidade ABCC
  const totalItens = BOAS_PRATICAS_ABCC.reduce((acc, cat) => acc + cat.itens.length, 0);
  const marcadosCount = Object.values(checkedItens).filter(Boolean).length;
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
      {/* Header da Aba */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
              Sanidade, Doenças e Boas Práticas ABCC
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Manual de campo para identificação de patologias do camarão (*Litopenaeus vannamei*), ações emergenciais e checklist oficial de biossegurança.
            </p>
          </div>

          {/* Sub-navegação */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={() => setActiveSubTab("doencas")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === "doencas"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Guia de Doenças</span>
            </button>

            <button
              onClick={() => setActiveSubTab("bpm")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === "bpm"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Checklist BPM ABCC</span>
            </button>

            <button
              onClick={() => setActiveSubTab("inovacoes")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === "inovacoes"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Novidades & Futuro</span>
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
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={buscaSintoma}
              onChange={(e) => setBuscaSintoma(e.target.value)}
              placeholder="Pesquise por sintoma (ex: manchas brancas, músculo branco, hepatopâncreas pálido, casca mole, retardo)..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-md"
            />
          </div>

          {/* Lista de Doenças com Cards Detalhados */}
          <div className="space-y-3.5">
            {doencasFiltradas.map((doenca) => {
              const isExpanded = expandedDoencaId === doenca.id;

              return (
                <div
                  key={doenca.id}
                  className={`bg-slate-800/80 border transition-all rounded-3xl overflow-hidden shadow-lg ${
                    isExpanded 
                      ? "border-rose-600/50 bg-slate-800/95" 
                      : "border-slate-700/70 hover:border-slate-600"
                  }`}
                >
                  {/* Cabeçalho do Card */}
                  <div
                    onClick={() => setExpandedDoencaId(isExpanded ? null : doenca.id)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-md ${
                        doenca.cor === "rose" 
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" 
                          : (doenca.cor === "amber" 
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" 
                              : "bg-teal-500/20 text-teal-300 border border-teal-500/30")
                      }`}>
                        {doenca.sigla.slice(0, 4)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-white">{doenca.nome}</h3>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                            {doenca.tipo}
                          </span>
                        </div>
                        <p className="text-xs text-rose-400 font-medium mt-0.5">
                          {doenca.gravidade}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline text-xs text-slate-400 font-medium">
                        {isExpanded ? "Recolher detalhes" : "Ver diagnóstico"}
                      </span>
                      <button className="p-1.5 rounded-xl bg-slate-700/60 text-slate-300">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Corpo Expansível com Sinais Clínicos e Ação de Emergência */}
                  {isExpanded && (
                    <div className="p-5 pt-0 border-t border-slate-700/60 space-y-4">
                      {/* Período Crítico */}
                      <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs">
                        <span className="font-bold text-amber-300 block mb-0.5">Período Crítico de Risco:</span>
                        <p className="text-slate-300">{doenca.periodoCritico}</p>
                      </div>

                      {/* Sinais Clínicos Visuais */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          Sintomas e Sinais Visuais no Campo:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {doenca.sintomas.map((sintoma, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0 mt-1.5"></span>
                              <span>{sintoma}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ação Emergencial de Campo */}
                      <div className="bg-rose-950/40 border border-rose-800/40 p-4 rounded-2xl space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-rose-400" />
                          Protocolo de Ação Imediata (Emergência):
                        </span>
                        <p className="text-xs text-rose-200 leading-relaxed">
                          {doenca.acaoEmergencia}
                        </p>
                      </div>

                      {/* Prevenção e Biossegurança */}
                      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          Prevenção Recomendada (Padrão ABCC/MAPA):
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
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
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-800/40 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-center sm:justify-start gap-1.5">
                <FileCheck2 className="w-4 h-4" />
                Conformidade de Biossegurança da Fazenda
              </span>
              <h3 className="text-xl font-bold text-white">
                Índice de Boas Práticas ABCC: {porcentagemBPM}%
              </h3>
              <p className="text-xs text-slate-300">
                {marcadosCount} de {totalItens} práticas implementadas neste aparelho.
              </p>
            </div>

            <div className="w-24 h-24 rounded-full border-4 border-slate-800 flex items-center justify-center relative bg-slate-900/80 shadow-lg">
              <div 
                className="absolute inset-0 rounded-full border-4 border-emerald-500" 
                style={{ clipPath: `polygon(0 0, 100% 0, 100% ${porcentagemBPM}%, 0 ${porcentagemBPM}%)` }}
              ></div>
              <span className="text-2xl font-black text-white">{porcentagemBPM}%</span>
            </div>
          </div>

          {/* Categorias do Checklist */}
          <div className="space-y-4">
            {BOAS_PRATICAS_ABCC.map((categoria) => (
              <div key={categoria.id} className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-3">
                <div className="border-b border-slate-700 pb-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                    {categoria.fase}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {categoria.descricao}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {categoria.itens.map((item) => {
                    const isChecked = !!checkedItens[item.id];

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleCheckItem(item.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isChecked 
                            ? "bg-emerald-950/30 border-emerald-700/60 text-white" 
                            : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-5 h-5 rounded-lg text-emerald-600 bg-slate-800 border-slate-600 focus:ring-0 mt-0.5 cursor-pointer accent-emerald-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${isChecked ? "text-emerald-300" : "text-white"}`}>
                              {item.titulo}
                            </span>
                            {item.obrigatorio && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                                Obrigatório
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {item.detalhe}
                          </p>
                        </div>
                      </div>
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
          <div className="bg-slate-800/80 border border-indigo-600/30 rounded-3xl p-5 shadow-lg space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Cultivo Multifásico (Berçários Hiperintensivos)
            </span>
            <h3 className="text-base font-bold text-white">
              Redução de Ciclo e Blindagem Imunológica
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Manter as pós-larvas por 15 a 25 dias em tanques berçários circulares com aeração intensa e bioflocos até atingirem 0.5 a 1.0g.
            </p>
            <div className="p-3 bg-slate-900/60 rounded-xl text-xs text-slate-300 border border-slate-800 space-y-1">
              <div className="font-bold text-indigo-300">Vantagens comprovadas:</div>
              <div>• Reduz o tempo de permanência no viveiro de terra de 90 para 65 dias;</div>
              <div>• Aumenta a sobrevivência geral em até 15%;</div>
              <div>• Protege os animais na fase de maior vulnerabilidade contra o AHPND/EMS.</div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-teal-600/30 rounded-3xl p-5 shadow-lg space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              Biorremediação com Cepas de Bacillus
            </span>
            <h3 className="text-base font-bold text-white">
              Exclusão Competitiva contra Vibrios
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              O uso profilático semanal de probióticos concentrados (*Bacillus subtilis, B. licheniformis*) atua consumindo matéria orgânica no fundo do viveiro e impedindo que bactérias patogênicas colonizem o trato digestivo dos camarões.
            </p>
            <div className="p-3 bg-slate-900/60 rounded-xl text-xs text-slate-300 border border-slate-800 space-y-1">
              <div className="font-bold text-teal-300">Impacto na Qualidade da Água:</div>
              <div>• Menor acúmulo de lodo negro anaeróbio;</div>
              <div>• Estabilização natural da amônia e do nitrito;</div>
              <div>• Melhora no Fator de Conversão Alimentar (FCA).</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
