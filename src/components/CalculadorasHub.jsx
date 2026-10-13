import React, { useState, useEffect } from "react";
import {
  Droplets,
  Sprout,
  FlaskConical,
  Calculator,
  Info,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Scale,
  TrendingUp,
  Atom,
  Wind,
  Leaf,
  ChevronRight,
  Store,
  ShoppingBag,
  BadgeCheck
} from "lucide-react";
import { FeedTrayIcon } from "./icons/CustomAquacultureIcons.jsx";
import CalcCalibre from "./calculadoras/CalcCalibre.jsx";
import CalcCrescimento from "./calculadoras/CalcCrescimento.jsx";
import CalcIonico from "./calculadoras/CalcIonico.jsx";
import CalcAeracao from "./calculadoras/CalcAeracao.jsx";
import CalcBioflocos from "./calculadoras/CalcBioflocos.jsx";
import BannerPatrocinador from "./BannerPatrocinador.jsx";
import { FABRICANTES_RACAO } from "../data/fabricantesRacao.js";
import { calcularManejoProbioticoSolo } from "../services/probioticoService.js";
import { DADOS_PROBIOTICOS_SOLO } from "../data/probioticosSolo.js";
import {
  CampoNumero,
  CampoSelect,
  TituloEntrada,
  FaixaAutomatica,
  CartaoResultado,
  CartaoSaida,
  PainelInterno,
  ListaAvisos,
  DicaTecnica
} from "./calculadoras/CalculadoraUI.jsx";
import { 
  calculateDailyFeed, 
  calculateWaterCorrection, 
  calculateToxicAmmonia, 
  calculateSoilLiming, 
  calculateStocking,
  getFeedingRateInfo
} from "../services/calculatorService.js";
import { AJUSTE_BANDEJAS_ALIMENTACAO } from "../data/carcinoData.js";

const CALCULADORAS = [
  { id: "racao", label: "Alimentação / Ração", shortLabel: "Ração", icon: FeedTrayIcon, cor: "amber" },
  { id: "agua", label: "Tratamento de Água", shortLabel: "Água", icon: Droplets, cor: "cyan" },
  { id: "solo", label: "Calagem de Solo", shortLabel: "Solo", icon: Sprout, cor: "emerald" },
  { id: "amonia", label: "Amônia Tóxica (NH3)", shortLabel: "Amônia", icon: FlaskConical, cor: "rose" },
  { id: "povoamento", label: "Povoamento & Metas", shortLabel: "Povoamento", icon: Sparkles, cor: "indigo" },
  { id: "calibre", label: "Calibre & Despesca", shortLabel: "Calibre", icon: Scale, cor: "lime" },
  { id: "crescimento", label: "Crescimento & Índices", shortLabel: "Crescimento", icon: TrendingUp, cor: "emerald" },
  { id: "ionico", label: "Balanço Iônico", shortLabel: "Íons", icon: Atom, cor: "cyan" },
  { id: "aeracao", label: "Aeração & Sistema", shortLabel: "Aeração", icon: Wind, cor: "indigo" },
  { id: "bioflocos", label: "Bioflocos (C:N)", shortLabel: "Bioflocos", icon: Leaf, cor: "violet" },
];

export default function CalculadorasHub({ viveiros = [], biometrias = [], qualidadeAgua = [], onNavigate }) {
  const [subTab, setSubTab] = useState("racao");
  const [selectedViveiroId, setSelectedViveiroId] = useState("");

  // Mapas com os últimos dados
  const ultimaBiometriaPorViveiro = {};
  biometrias.forEach(b => {
    if (!ultimaBiometriaPorViveiro[b.viveiroId] || new Date(b.data) > new Date(ultimaBiometriaPorViveiro[b.viveiroId].data)) {
      ultimaBiometriaPorViveiro[b.viveiroId] = b;
    }
  });

  const ultimaAguaPorViveiro = {};
  qualidadeAgua.forEach(q => {
    if (!ultimaAguaPorViveiro[q.viveiroId] || new Date(q.data) > new Date(ultimaAguaPorViveiro[q.viveiroId].data)) {
      ultimaAguaPorViveiro[q.viveiroId] = q;
    }
  });

  // Se houver viveiros, seleciona o primeiro por padrão
  useEffect(() => {
    if (viveiros.length > 0 && !selectedViveiroId) {
      setSelectedViveiroId(String(viveiros[0].id));
    }
  }, [viveiros]);

  const viveiroAtual = viveiros.find(v => String(v.id) === String(selectedViveiroId));
  const bioAtual = viveiroAtual ? ultimaBiometriaPorViveiro[viveiroAtual.id] : null;
  const aguaAtual = viveiroAtual ? ultimaAguaPorViveiro[viveiroAtual.id] : null;
  const biometriasDoViveiro = viveiroAtual
    ? biometrias.filter(b => String(b.viveiroId) === String(viveiroAtual.id))
    : [];

  // Função para trocar de calculadora e rolar suavemente para a área de edição na tela
  const mudarCalculadora = (novaTab) => {
    setSubTab(novaTab);
    setTimeout(() => {
      const el = document.getElementById("painel-calculadora-ativo");
      if (el) {
        const yOffset = -20;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }
    }, 40);
  };

  // Estados da Calculadora de Ração
  const [racaoBiomassa, setRacaoBiomassa] = useState(1000);
  const [racaoPesoMedio, setRacaoPesoMedio] = useState(10.0);
  const [racaoTemp, setRacaoTemp] = useState(29.0);
  const [racaoO2, setRacaoO2] = useState(5.0);
  const [racaoBandejaAjuste, setRacaoBandejaAjuste] = useState(0);
  const [racaoTratos, setRacaoTratos] = useState(3);
  const [modoAutomaticoRacao, setModoAutomaticoRacao] = useState(true);
  const [fabricanteRacaoId, setFabricanteRacaoId] = useState("generico");
  const [faseRacaoManual, setFaseRacaoManual] = useState("auto"); // "auto", "juvenil", "engorda"

  // Sincronizar inputs quando o viveiro mudar no modo automático
  useEffect(() => {
    if (modoAutomaticoRacao && viveiroAtual) {
      if (bioAtual?.biomassaKg) setRacaoBiomassa(Number(bioAtual.biomassaKg));
      if (bioAtual?.pesoMedioG) setRacaoPesoMedio(Number(bioAtual.pesoMedioG));
      if (aguaAtual?.temperatura) setRacaoTemp(Number(aguaAtual.temperatura));
      if (aguaAtual?.oxigenio) setRacaoO2(Number(aguaAtual.oxigenio));
      const infoFaixa = getFeedingRateInfo(bioAtual?.pesoMedioG || 10);
      setRacaoTratos(infoFaixa.frequenciaTratos);
    }
  }, [selectedViveiroId, modoAutomaticoRacao]);

  // Estados da Calculadora de Água
  const [aguaVolumeM3, setAguaVolumeM3] = useState(12000);
  const [aguaAlcalinidadeAtual, setAguaAlcalinidadeAtual] = useState(90);
  const [aguaAlcalinidadeMeta, setAguaAlcalinidadeMeta] = useState(130);
  const [aguaPh, setAguaPh] = useState(7.9);
  const [modoAutomaticoAgua, setModoAutomaticoAgua] = useState(true);

  useEffect(() => {
    if (modoAutomaticoAgua && viveiroAtual) {
      if (viveiroAtual.volumeM3) setAguaVolumeM3(Number(viveiroAtual.volumeM3));
      if (aguaAtual?.alcalinidade) setAguaAlcalinidadeAtual(Number(aguaAtual.alcalinidade));
      if (aguaAtual?.ph) setAguaPh(Number(aguaAtual.ph));
    }
  }, [selectedViveiroId, modoAutomaticoAgua]);

  // Estados da Calculadora de Solo
  const [soloAreaM2, setSoloAreaM2] = useState(10000);
  const [soloPh, setSoloPh] = useState(5.8);
  const [subModoSolo, setSubModoSolo] = useState("calagem"); // "calagem" | "probioticos"
  const [probFinalidade, setProbFinalidade] = useState("manutencao"); // "manutencao", "choque", "preparo"
  const [probNivelLodo, setProbNivelLodo] = useState("moderado"); // "leve", "moderado", "severo"
  const [probTemH2S, setProbTemH2S] = useState(false);
  const [probAtivado, setProbAtivado] = useState(true);

  useEffect(() => {
    if (viveiroAtual?.areaM2) {
      setSoloAreaM2(Number(viveiroAtual.areaM2));
    }
  }, [selectedViveiroId]);

  // Estados da Calculadora de Amônia Tóxica
  const [amoniaNat, setAmoniaNat] = useState(1.2);
  const [amoniaPh, setAmoniaPh] = useState(8.2);
  const [amoniaTemp, setAmoniaTemp] = useState(30.0);

  // Estados de Povoamento
  const [povoAreaM2, setPovoAreaM2] = useState(10000);
  const [povoDensidade, setPovoDensidade] = useState(12);
  const [povoSobrevivencia, setPovoSobrevivencia] = useState(80);
  const [povoPesoAlvo, setPovoPesoAlvo] = useState(13.5);

  // Dados do Fabricante de Ração e Fase selecionada
  const fabricanteAtual = FABRICANTES_RACAO.find(f => f.id === fabricanteRacaoId) || null;
  const faseAtiva = faseRacaoManual === "auto" 
    ? (racaoPesoMedio <= 3.2 ? "juvenil" : "engorda") 
    : faseRacaoManual;
  const dadosFaseAtual = fabricanteAtual ? fabricanteAtual.fases[faseAtiva] : null;

  // Executar cálculos
  const resRacao = calculateDailyFeed({
    biomassaKg: racaoBiomassa,
    pesoMedioG: racaoPesoMedio,
    temperaturaC: racaoTemp,
    oxigenioMgL: racaoO2,
    ajusteBandejaPercent: racaoBandejaAjuste,
    tratosCustomizados: racaoTratos
  });

  const resAgua = calculateWaterCorrection({
    volumeM3: aguaVolumeM3,
    alcalinidadeAtual: aguaAlcalinidadeAtual,
    alcalinidadeMeta: aguaAlcalinidadeMeta,
    phAtual: aguaPh
  });

  const resSolo = calculateSoilLiming(soloAreaM2, soloPh);

  const resProbiotico = calcularManejoProbioticoSolo({
    areaM2: soloAreaM2,
    finalidade: probFinalidade,
    nivelLodo: probNivelLodo,
    modoAtivado: probAtivado,
    temCheiroH2S: probTemH2S
  });

  const resAmonia = calculateToxicAmmonia(amoniaNat, amoniaPh, amoniaTemp);

  const resPovo = calculateStocking({
    areaM2: povoAreaM2,
    densidadeAlvoM2: povoDensidade,
    pesoFinalAlvoG: povoPesoAlvo,
    sobrevivenciaEsperadaPercent: povoSobrevivencia
  });

  const calAtualInfo = CALCULADORAS.find(c => c.id === subTab) || CALCULADORAS[0];

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header & Seletor de Ferramentas */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-emerald-700 flex-shrink-0" />
              <span>Calculadoras Zootécnicas</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Escolha uma opção para abrir os dados diretamente na tela:
            </p>
          </div>

          <div className="w-full sm:w-auto min-w-0">
            {/* Seletor Global de Viveiro para Automação */}
            {viveiros.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 min-w-0">
                <span className="text-xs font-bold text-slate-600 pl-2 whitespace-nowrap">Viveiro:</span>
                <select
                  value={selectedViveiroId}
                  onChange={(e) => setSelectedViveiroId(e.target.value)}
                  className="flex-1 min-w-0 max-w-[200px] sm:max-w-xs bg-white text-slate-900 font-bold text-xs rounded-xl px-3 py-1.5 border border-slate-300 focus:outline-none focus:border-emerald-500 shadow-2xs truncate"
                >
                  {viveiros.map(v => (
                    <option key={v.id} value={v.id}>{v.nome}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Carrossel de Abas / Pílulas Horizontais (Mobile desliza com dedo; Desktop quebra em chips) */}
        <div className="w-full max-w-full overflow-x-auto no-scrollbar scroll-smooth snap-x flex gap-2 pt-3 mt-3 border-t border-slate-100 sm:flex-wrap">
          {CALCULADORAS.map((calc) => {
            const Icone = calc.icon;
            const isAtivo = subTab === calc.id;
            return (
              <button
                key={calc.id}
                onClick={() => mudarCalculadora(calc.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all snap-start flex-shrink-0 active:scale-95 shadow-2xs ${
                  isAtivo
                    ? "bg-slate-900 text-white shadow-sm ring-2 ring-emerald-500/30"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80"
                }`}
              >
                <Icone className={`w-4 h-4 ${isAtivo ? "text-emerald-400" : "text-slate-500"}`} />
                <span>{calc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* PAINEL DA CALCULADORA ATIVA (Com âncora suave para celular)   */}
      {/* ============================================================== */}
      <div id="painel-calculadora-ativo" className="scroll-mt-4">
        {/* ============================================================== */}
        {/* ABA 1: ALIMENTAÇÃO E ARRAÇOAMENTO                              */}
        {/* ============================================================== */}
        {subTab === "racao" && (
          <div className="space-y-4">
            {/* Resumo Rápido no Topo (Visível de imediato no celular) */}
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-slate-900 shadow-2xs">
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                  Ração Diária Calculada
                </span>
                <div className="text-xl sm:text-2xl font-black text-amber-900 leading-tight">
                  {resRacao.racaoFinalKg} <span className="text-xs font-bold text-slate-700">kg/dia</span>
                </div>
                <span className="text-[11px] text-slate-600 block mt-0.5 truncate">
                  Taxa base: {resRacao.taxaPercentual}% ({resRacao.faseCultivo})
                </span>
              </div>
              <div className="text-right sm:text-right flex-shrink-0 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-amber-500/20 self-start sm:self-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Por Trato ({resRacao.numeroTratos}x)
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900">
                  {resRacao.racaoPorTratoKg} <span className="text-xs font-bold text-amber-700">kg</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Card Esquerdo: Inputs */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FeedTrayIcon className="w-5 h-5 text-amber-700" />
                    O que fornecer para calcular:
                  </h3>
                  {viveiroAtual && (
                    <button
                      onClick={() => setModoAutomaticoRacao(!modoAutomaticoRacao)}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-all ${
                        modoAutomaticoRacao 
                          ? "bg-amber-500/20 text-amber-700 border border-amber-500/40" 
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <RefreshCw className={`w-3 h-3 ${modoAutomaticoRacao ? "animate-spin" : ""}`} />
                      {modoAutomaticoRacao ? "Auto (do Viveiro)" : "Manual"}
                    </button>
                  )}
                </div>

                {modoAutomaticoRacao && viveiroAtual && (
                  <FaixaAutomatica
                    cor="amber"
                    rotulo={`Dados automáticos de: ${viveiroAtual.nome}`}
                    itens={[
                      { rotulo: "Biomassa", valor: `${bioAtual?.biomassaKg || "0"} kg` },
                      { rotulo: "Peso Médio", valor: `${bioAtual?.pesoMedioG || "0"} g` },
                      { rotulo: "Temp. Água", valor: `${aguaAtual?.temperatura || "29"} °C` },
                      { rotulo: "Oxigênio", valor: `${aguaAtual?.oxigenio || "5.0"} mg/L` },
                    ]}
                  />
                )}

                <div className="space-y-3.5">
                  <CampoNumero
                    label="1. Biomassa Total Estimada"
                    valor={racaoBiomassa}
                    onChange={setRacaoBiomassa}
                    step="50"
                    min="1"
                    sufixo="kg"
                    cor="amber"
                    disabled={modoAutomaticoRacao && !!bioAtual}
                    ajuda="Peso total estimado de todos os camarões vivos no viveiro."
                  />

                  <CampoNumero
                    label="2. Peso Médio Atual do Camarão"
                    valor={racaoPesoMedio}
                    onChange={setRacaoPesoMedio}
                    step="0.5"
                    min="0.1"
                    sufixo="g"
                    cor="amber"
                    disabled={modoAutomaticoRacao && !!bioAtual}
                    ajuda={`Define a taxa zootécnica (${resRacao.taxaPercentual}% para ${racaoPesoMedio}g).`}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <CampoNumero
                      label="Temp. Água"
                      valor={racaoTemp}
                      onChange={setRacaoTemp}
                      step="0.5"
                      min="15"
                      sufixo="°C"
                      cor="amber"
                    />
                    <CampoNumero
                      label="Oxigênio"
                      valor={racaoO2}
                      onChange={setRacaoO2}
                      step="0.2"
                      min="0.5"
                      sufixo="mg/L"
                      cor="amber"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Ajuste de Manejo por Bandejas (Comedouros):
                    </label>
                    <select
                      value={racaoBandejaAjuste}
                      onChange={(e) => setRacaoBandejaAjuste(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-slate-900 font-bold text-xs focus:border-amber-500 focus:outline-none"
                    >
                      {AJUSTE_BANDEJAS_ALIMENTACAO.map((item, idx) => (
                        <option key={idx} value={item.ajustePercentual}>
                          {item.status} ({item.ajustePercentual > 0 ? `+${item.ajustePercentual}%` : `${item.ajustePercentual}%`})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Número de Tratos (refeições) por dia:
                    </label>
                    <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                      {[2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRacaoTratos(n)}
                          className={`py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black transition-all active:scale-95 text-center truncate ${
                            racaoTratos === n 
                              ? "bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-500/30" 
                              : "bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200"
                          }`}
                        >
                          {n}x / dia
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seletor de Fabricante de Ração e Fases (Juvenil / Engorda) */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                          Marca / Fabricante da Ração:
                        </span>
                        <span className="text-[10px] text-amber-800 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                          Ajuda Técnica
                        </span>
                      </label>
                      <select
                        value={fabricanteRacaoId}
                        onChange={(e) => {
                          setFabricanteRacaoId(e.target.value);
                          setFaseRacaoManual("auto");
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-900 font-bold text-xs focus:border-amber-500 focus:outline-none"
                      >
                        <option value="generico">Padrão Zootécnico (Curva Geral)</option>
                        <option value="adm">ADM Nutrição Animal (Camanutri & Density)</option>
                        <option value="guabi">Guabi Aqua (Linha Poti / Poti Guaçu)</option>
                        <option value="aquanutri">AquaNutri Nutrição Especializada</option>
                      </select>
                    </div>

                    {fabricanteAtual && (
                      <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">Fase Nutricional:</span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-md">
                            {faseRacaoManual === "auto" ? `Auto (${racaoPesoMedio}g)` : "Manual"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setFaseRacaoManual("juvenil")}
                            className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all ${
                              faseAtiva === "juvenil"
                                ? "bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-500/30"
                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Juvenil (0.2g a 3.2g)
                          </button>
                          <button
                            type="button"
                            onClick={() => setFaseRacaoManual("engorda")}
                            className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all ${
                              faseAtiva === "engorda"
                                ? "bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-500/30"
                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Engorda (&gt; 3.2g)
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium pt-0.5">
                          Linha: <strong className="text-slate-800">{dadosFaseAtual?.nomeLinha}</strong> ({dadosFaseAtual?.pbPercent}% PB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Direito: Resultados */}
              <div className="lg:col-span-7 space-y-4">
                <CartaoSaida titulo="Resultado Automatizado da Ração" cor="amber">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CartaoResultado
                      titulo="Ração Total Diária"
                      valor={resRacao.racaoFinalKg}
                      unidade="kg/dia"
                      detalhe={`Taxa base: ${resRacao.taxaPercentual}% da biomassa (${resRacao.faseCultivo})`}
                      cor="amber"
                    />

                    <CartaoResultado
                      titulo="Quantidade por Trato"
                      valor={resRacao.racaoPorTratoKg}
                      unidade="kg"
                      detalhe={`Dividido em ${resRacao.numeroTratos} horários iguais`}
                      cor="amber"
                    />
                  </div>

                  {/* Programação Sugerida de Horários */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide mb-2.5">
                      Programação Sugerida de Horários
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      {resRacao.numeroTratos === 2 && (
                        <>
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="text-[11px] text-slate-500 font-bold">07:30 (1º)</div>
                            <div className="text-sm font-black text-amber-700 mt-0.5">{resRacao.racaoPorTratoKg} kg</div>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="text-[11px] text-slate-500 font-bold">16:30 (2º)</div>
                            <div className="text-sm font-black text-amber-700 mt-0.5">{resRacao.racaoPorTratoKg} kg</div>
                          </div>
                        </>
                      )}
                      {resRacao.numeroTratos === 3 && (
                        <>
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="text-[11px] text-slate-500 font-bold">07:00 (1º)</div>
                            <div className="text-sm font-black text-amber-700 mt-0.5">{resRacao.racaoPorTratoKg} kg</div>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="text-[11px] text-slate-500 font-bold">11:30 (2º)</div>
                            <div className="text-sm font-black text-amber-700 mt-0.5">{resRacao.racaoPorTratoKg} kg</div>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="text-[11px] text-slate-500 font-bold">16:30 (3º)</div>
                            <div className="text-sm font-black text-amber-700 mt-0.5">{resRacao.racaoPorTratoKg} kg</div>
                          </div>
                        </>
                      )}
                      {resRacao.numeroTratos >= 4 && (
                        <>
                          <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="text-[10px] text-slate-500 font-bold">06:30 (1º)</div>
                            <div className="text-xs sm:text-sm font-black text-amber-700 mt-0.5">{resRacao.racaoPorTratoKg} kg</div>
                          </div>
                          <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="text-[10px] text-slate-500 font-bold">10:30 (2º)</div>
                            <div className="text-xs sm:text-sm font-black text-amber-700 mt-0.5">{resRacao.racaoPorTratoKg} kg</div>
                          </div>
                          <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="text-[10px] text-slate-500 font-bold">14:30 (3º)</div>
                            <div className="text-xs sm:text-sm font-black text-amber-700 mt-0.5">{resRacao.racaoPorTratoKg} kg</div>
                          </div>
                          <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="text-[10px] text-slate-500 font-bold">18:00 (4º)</div>
                            <div className="text-xs sm:text-sm font-black text-amber-700 mt-0.5">{resRacao.racaoPorTratoKg} kg</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Alertas e Avisos de Manejo */}
                  <ListaAvisos avisos={resRacao.avisos} cor="amber" />
                </CartaoSaida>

                <DicaTecnica
                  titulo="Regra de Ouro da Carcinicultura:"
                  texto="Ração que sobra no fundo não alimenta camarão; consome oxigênio e vira amônia tóxica. Priorize o ajuste das bandejas de 2h a 2h30 após a distribuição."
                  cor="amber"
                />

                {/* Card de Ficha Técnica, Níveis de Garantia e Ajuda Técnica do Fabricante */}
                {fabricanteAtual && dadosFaseAtual && (
                  <div className="bg-white border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                            {fabricanteAtual.logoText}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            Ficha Técnica & Garantia
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mt-1">
                          {dadosFaseAtual.nomeLinha} ({dadosFaseAtual.fase})
                        </h4>
                      </div>

                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() => onNavigate("mercado")}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>Comprar {fabricanteAtual.logoText} no seu Estado</span>
                        </button>
                      )}
                    </div>

                    {/* Grid com Níveis Nutricionais de Garantia */}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                        Níveis de Garantia Oficiais (por kg de ração):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-2.5">
                          <span className="text-[10px] font-bold text-slate-500 block">Proteína (PB)</span>
                          <span className="text-base font-black text-amber-900">{dadosFaseAtual.pbPercent}%</span>
                          <span className="text-[9px] text-slate-500 block">mínimo</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                          <span className="text-[10px] font-bold text-slate-500 block">Extrato Etéreo</span>
                          <span className="text-base font-black text-slate-800">{dadosFaseAtual.eePercent}%</span>
                          <span className="text-[9px] text-slate-500 block">gordura mín.</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                          <span className="text-[10px] font-bold text-slate-500 block">Fibra Bruta</span>
                          <span className="text-base font-black text-slate-800">{dadosFaseAtual.fbPercent}%</span>
                          <span className="text-[9px] text-slate-500 block">máximo</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                          <span className="text-[10px] font-bold text-slate-500 block">Granulometria</span>
                          <span className="text-xs font-black text-slate-800 mt-1 block truncate">{dadosFaseAtual.pelletMm}</span>
                          <span className="text-[9px] text-slate-500 block">tamanho pellet</span>
                        </div>
                      </div>
                    </div>

                    {/* Ajuda Técnica Oficial para Ajuste de Ração */}
                    <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-200/80 rounded-2xl p-3.5 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                        <BadgeCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>Ajuda Técnica de Manejo ({fabricanteAtual.nome}):</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {dadosFaseAtual.ajudaTecnica}
                      </p>
                      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Frequência sugerida: <strong>{dadosFaseAtual.tratosSugeridos}</strong></span>
                        <span>Faixa ideal: <strong>{dadosFaseAtual.pesoMinG}g a {dadosFaseAtual.pesoMaxG}g</strong></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 2: TRATAMENTO DE ÁGUA (ALCALINIDADE & pH)                  */}
        {/* ============================================================== */}
        {subTab === "agua" && (
          <div className="space-y-4">
            {/* Resumo Rápido no Topo */}
            <div className="bg-gradient-to-r from-cyan-500/15 via-cyan-500/10 to-transparent border border-cyan-500/30 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-slate-900 shadow-2xs">
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 block">
                  Correção de Alcalinidade
                </span>
                <div className="text-xl sm:text-2xl font-black text-cyan-900 leading-tight">
                  {resAgua.bicarbonatoKg} <span className="text-xs font-bold text-slate-700">kg NaHCO3</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold block mt-0.5 truncate">
                  Opção segura (não altera pH)
                </span>
              </div>
              <div className="text-right flex-shrink-0 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-cyan-500/20 self-start sm:self-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Dose Máx / Dia
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900">
                  {resAgua.doseMaximaDiariaKg} <span className="text-xs font-bold text-cyan-700">kg/dia</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-cyan-700" />
                    O que fornecer para a correção:
                  </h3>
                  {viveiroAtual && (
                    <button
                      onClick={() => setModoAutomaticoAgua(!modoAutomaticoAgua)}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                        modoAutomaticoAgua 
                          ? "bg-cyan-500/20 text-cyan-700 border border-cyan-500/40" 
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <RefreshCw className={`w-3 h-3 ${modoAutomaticoAgua ? "animate-spin" : ""}`} />
                      {modoAutomaticoAgua ? "Auto (do Viveiro)" : "Manual"}
                    </button>
                  )}
                </div>

                {modoAutomaticoAgua && viveiroAtual && (
                  <FaixaAutomatica
                    cor="cyan"
                    rotulo={`Dados do viveiro: ${viveiroAtual.nome}`}
                    itens={[
                      { rotulo: "Volume", valor: `${viveiroAtual.volumeM3 || aguaVolumeM3} m³` },
                      { rotulo: "Alcalinidade", valor: `${aguaAtual?.alcalinidade || aguaAlcalinidadeAtual} mg/L` },
                      { rotulo: "pH", valor: `${aguaAtual?.ph || aguaPh}` },
                    ]}
                  />
                )}

                <div className="space-y-3.5">
                  <CampoNumero
                    label="1. Volume de Água do Viveiro"
                    valor={aguaVolumeM3}
                    onChange={setAguaVolumeM3}
                    step="500"
                    min="100"
                    sufixo="m³"
                    cor="cyan"
                    ajuda="Calculado: Área (m²) × Profundidade média (m)."
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <CampoNumero
                      label="Alcalinidade Atual"
                      valor={aguaAlcalinidadeAtual}
                      onChange={setAguaAlcalinidadeAtual}
                      step="5"
                      min="10"
                      sufixo="mg/L"
                      cor="cyan"
                    />
                    <CampoNumero
                      label="Alcalinidade Meta"
                      valor={aguaAlcalinidadeMeta}
                      onChange={setAguaAlcalinidadeMeta}
                      step="5"
                      min="50"
                      sufixo="mg/L"
                      cor="cyan"
                      ajuda="Padrão: 120-150 mg/L"
                    />
                  </div>

                  <CampoNumero
                    label="4. pH Atual da Água"
                    valor={aguaPh}
                    onChange={setAguaPh}
                    step="0.1"
                    min="6.0"
                    cor="cyan"
                    ajuda="Decide a segurança entre Bicarbonato vs. Cal Hidratada."
                  />
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <CartaoSaida titulo="Prescrição de Correção de Alcalinidade" cor="cyan">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CartaoResultado
                      titulo="Bicarbonato de Sódio (NaHCO3)"
                      valor={resAgua.bicarbonatoKg}
                      unidade="kg"
                      detalhe="Opção Mais Segura (Não dispara o pH)"
                      cor="cyan"
                    />

                    <CartaoResultado
                      titulo="Cal Hidratada (Ca(OH)2)"
                      valor={resAgua.calHidratadaKg}
                      unidade="kg"
                      detalhe={aguaPh >= 8.2 ? "NÃO RECOMENDADO com pH ≥ 8.2" : "Usar com cautela em leite de cal"}
                      cor="cyan"
                    />
                  </div>

                  <PainelInterno titulo="Diagnóstico de Manejo" cor="cyan">
                    <p>{resAgua.recomendacao}</p>
                    <p className="text-slate-600 text-[11px] mt-1">
                      <b>Dose máxima fracionada sugerida:</b> até {resAgua.doseMaximaDiariaKg} kg/dia para evitar choque osmótico.
                    </p>
                  </PainelInterno>
                </CartaoSaida>

                <DicaTecnica
                  titulo="Por que a alcalinidade importa?"
                  texto="O camarão precisa absorver íons bicarbonato e cálcio durante a muda (ecdise). Abaixo de 100 mg/L, ocorrem carapaças moles e canibalismo."
                  cor="cyan"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 3: MANEJO DE SOLO DO FUNDO (CALAGEM & PROBIÓTICOS)         */}
        {/* ============================================================== */}
        {subTab === "solo" && (
          <div className="space-y-4">
            {/* Seletor de Manejo: Calagem Dolomítica vs Biorremediação com Probióticos */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                aria-label="Calagem Dolomítica"
                onClick={() => setSubModoSolo("calagem")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                  subModoSolo === "calagem"
                    ? "bg-white text-emerald-800 shadow-xs border border-emerald-500/30 ring-2 ring-emerald-500/20"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🌾 Calagem Dolomítica (Calcário)
              </button>
              <button
                type="button"
                aria-label="Biorremediação com Probióticos"
                onClick={() => setSubModoSolo("probioticos")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                  subModoSolo === "probioticos"
                    ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🦠 Biorremediação com Probióticos (Lodo & H2S)
              </button>
            </div>

            {/* MODO 1: CALAGEM DOLOMÍTICA TRADICIONAL */}
            {subModoSolo === "calagem" && (
              <>
                {/* Resumo Rápido no Topo */}
                <div className="bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border border-emerald-500/30 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-slate-900 shadow-2xs">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                      Calcário Dolomítico Necessário
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-emerald-900 leading-tight">
                      {resSolo.doseTotalKg.toLocaleString()} <span className="text-xs font-bold text-slate-700">kg</span>
                    </div>
                    <span className="text-[11px] text-slate-600 block mt-0.5 truncate">
                      Área: {(soloAreaM2 / 10000).toFixed(2)} ha ({soloAreaM2.toLocaleString()} m²)
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-emerald-500/20 self-start sm:self-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Dose por Hectare
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {resSolo.doseKgPorHa} <span className="text-xs font-bold text-emerald-700">kg/ha</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
                    <TituloEntrada
                      icone={Sprout}
                      titulo="Dados do Solo Seco (Pós-Despesca)"
                      cor="emerald"
                    />

                    <div className="space-y-3.5">
                      <CampoNumero
                        label="1. Área do Viveiro"
                        valor={soloAreaM2}
                        onChange={setSoloAreaM2}
                        step="1000"
                        min="500"
                        sufixo="m²"
                        cor="emerald"
                        ajuda={`Equivale a ${(soloAreaM2 / 10000).toFixed(2)} hectares.`}
                      />

                      <CampoNumero
                        label="2. pH do Solo do Fundo"
                        valor={soloPh}
                        onChange={setSoloPh}
                        step="0.1"
                        min="3.5"
                        cor="emerald"
                        ajuda="Medição feita em amostra do solo seco do fundo."
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-4">
                    <CartaoSaida titulo="Recomendação de Calagem de Fundo" cor="emerald">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CartaoResultado
                          titulo="Calcário Dolomítico Total"
                          valor={resSolo.doseTotalKg.toLocaleString()}
                          unidade="kg"
                          detalhe={`Dose recomendada: ${resSolo.doseKgPorHa} kg/ha (${((resSolo.doseKgPorHa)/1000).toFixed(1)} t/ha)`}
                          cor="emerald"
                        />

                        <CartaoResultado
                          titulo="Tempo de Dessecação (Sol)"
                          valor="10 a 15"
                          unidade="dias"
                          detalhe="Até abrir rachaduras de 2 a 5 cm no lodo"
                          cor="emerald"
                        />
                      </div>

                      <PainelInterno titulo="Manejo de Preparação" cor="emerald">
                        <p>{resSolo.recomendacao}</p>
                        <p className="text-slate-600 text-[11px] mt-1">
                          Distribua o calcário uniformemente e faça leve gradagem (10 cm) para neutralizar a camada redutora de sulfetos.
                        </p>
                      </PainelInterno>
                    </CartaoSaida>
                  </div>
                </div>
              </>
            )}

            {/* MODO 2: BIORREMEDIAÇÃO COM PROBIÓTICOS (LODO & H2S) */}
            {subModoSolo === "probioticos" && (
              <>
                {/* Resumo Rápido no Topo */}
                <div className="bg-gradient-to-r from-emerald-600/20 via-teal-500/10 to-transparent border border-emerald-500/30 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-slate-900 shadow-2xs">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                      Dose de Probiótico ({resProbiotico.frequencia})
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-emerald-950 leading-tight">
                      {resProbiotico.doseDiariaKg} <span className="text-xs font-bold text-slate-700">kg/dia</span>
                    </div>
                    <span className="text-[11px] text-slate-600 block mt-0.5 truncate">
                      Taxa: {resProbiotico.doseBaseKgHa} kg/ha ({resProbiotico.areaHa} ha de viveiro)
                    </span>
                  </div>

                  <div className="text-right flex-shrink-0 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-emerald-500/20 self-start sm:self-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Ativação (Melaço)
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {resProbiotico.melacoKg > 0 ? `${resProbiotico.melacoKg} kg` : "Direto em pó"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Coluna Esquerda: Parâmetros do Sedimento e Probiótico */}
                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
                    <TituloEntrada
                      icone={Sprout}
                      titulo="Parâmetros de Biorremediação"
                      cor="emerald"
                    />

                    <div className="space-y-3.5">
                      <CampoNumero
                        label="1. Área do Viveiro"
                        valor={soloAreaM2}
                        onChange={setSoloAreaM2}
                        step="1000"
                        min="500"
                        sufixo="m²"
                        cor="emerald"
                        ajuda={`Equivale a ${(soloAreaM2 / 10000).toFixed(2)} hectares.`}
                      />

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          2. Finalidade da Aplicação:
                        </label>
                        <select
                          value={probFinalidade}
                          onChange={(e) => setProbFinalidade(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="manutencao">Manutenção Preventiva Semanal (Rotina)</option>
                          <option value="choque">Tratamento de Choque (Lodo Negro / Crítico)</option>
                          <option value="preparo">Preparo entre Safras (Primeira Lâmina d'água)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          3. Nível de Lodo Acumulado no Fundo:
                        </label>
                        <select
                          value={probNivelLodo}
                          onChange={(e) => setProbNivelLodo(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="leve">Leve (Pequenas manchas claras)</option>
                          <option value="moderado">Moderado (Acúmulo nos alimentadores)</option>
                          <option value="severo">Severo (Camada espessa de lodo preto)</option>
                        </select>
                      </div>

                      {/* Odor de Ovo Podre (H2S) */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            Presença de Cheiro de Ovo Podre (H2S)?
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Sinal grave de bactérias redutoras de sulfato
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProbTemH2S(!probTemH2S)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                            probTemH2S
                              ? "bg-rose-600 text-white shadow-xs"
                              : "bg-white text-slate-700 border border-slate-200"
                          }`}
                        >
                          {probTemH2S ? "SIM (H2S)" : "NÃO"}
                        </button>
                      </div>

                      {/* Método de Aplicação: Ativado vs Direto */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          Método de Aplicação:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setProbAtivado(true)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all ${
                              probAtivado
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-slate-50 text-slate-700 border border-slate-200"
                            }`}
                          >
                            Biofermentado (Ativado)
                          </button>
                          <button
                            type="button"
                            onClick={() => setProbAtivado(false)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all ${
                              !probAtivado
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-slate-50 text-slate-700 border border-slate-200"
                            }`}
                          >
                            Pó Hidratado Direto
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coluna Direita: Resultados, Protocolo e Cepas */}
                  <div className="lg:col-span-7 space-y-4">
                    <CartaoSaida titulo="Protocolo de Biorremediação do Fundo" cor="emerald">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CartaoResultado
                          titulo="Dose de Probiótico / Dia"
                          valor={resProbiotico.doseDiariaKg}
                          unidade="kg/dia"
                          detalhe={`Taxa: ${resProbiotico.doseBaseKgHa} kg/ha (${resProbiotico.frequencia})`}
                          cor="emerald"
                        />

                        {resProbiotico.modoAtivado ? (
                          <CartaoResultado
                            titulo="Melaço para Biofermentação"
                            valor={resProbiotico.melacoKg}
                            unidade="kg"
                            detalhe={`Diluir em ${resProbiotico.aguaAtivacaoL} L de água doce aerada por ${resProbiotico.tempoAeracaoHoras}h`}
                            cor="emerald"
                          />
                        ) : (
                          <CartaoResultado
                            titulo="Modo de Aplicação"
                            valor="Direto"
                            unidade="Pó hidratado"
                            detalhe="Hidratar em baldes com água do próprio viveiro por 30 min"
                            cor="emerald"
                          />
                        )}
                      </div>

                      <PainelInterno titulo="Instruções Práticas de Campo" cor="emerald">
                        <p>{resProbiotico.recomendacaoManejo}</p>
                        <p className="text-slate-600 text-[11px] mt-1.5">
                          <b>Horário ideal:</b> Aplicar entre 08h00 e 10h00 da manhã, com aeradores ligados para distribuir as bactérias heterotróficas uniformemente sobre o sedimento.
                        </p>
                      </PainelInterno>

                      <ListaAvisos avisos={resProbiotico.avisos} cor="emerald" />
                    </CartaoSaida>

                    {/* Guia de Cepas e Mecanismos Bioquímicos */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <BadgeCheck className="w-4 h-4 text-emerald-600" />
                        Ação das Cepas no Lodo e Controle de H2S:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="font-black text-emerald-800 block">Bacillus subtilis</span>
                          <span className="text-[11px] text-slate-600">Produz proteases para degradar restos de ração e fezes. Bloqueia Vibrio por competição.</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="font-black text-emerald-800 block">Bacillus licheniformis</span>
                          <span className="text-[11px] text-slate-600">Ativo no lodo denso com baixo oxigênio, decompondo matéria orgânica profunda.</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="font-black text-teal-800 block">Rhodopseudomonas (Fototróficas)</span>
                          <span className="text-[11px] text-slate-600">Oxida quimicamente o gás sulfídrico (H2S), transformando-o em sulfato inócuo.</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="font-black text-cyan-800 block">Consórcio Nitrificante</span>
                          <span className="text-[11px] text-slate-600">Oxida a amônia liberada pela decomposição do lodo em nitrito e depois nitrato.</span>
                        </div>
                      </div>

                      {/* Escala Redox de Referência */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Potencial Redox ideal: <strong>&gt; +50 mV</strong> (Fundo oxidado)</span>
                        {onNavigate && (
                          <button
                            type="button"
                            onClick={() => onNavigate("mercado")}
                            className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                          >
                            <Store className="w-3.5 h-3.5" />
                            <span>Vendedores de Probióticos</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 4: AMÔNIA TÓXICA NÃO-IONIZADA (NH3)                         */}
        {/* ============================================================== */}
        {subTab === "amonia" && (
          <div className="space-y-4">
            {/* Resumo Rápido no Topo */}
            <div className="bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-transparent border border-rose-500/30 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-slate-900 shadow-2xs">
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                  Fração Tóxica Real (NH3 Gasosa)
                </span>
                <div className="text-xl sm:text-2xl font-black text-rose-900 leading-tight">
                  {resAmonia.nh3} <span className="text-xs font-bold text-slate-700">mg/L</span>
                </div>
                <span className="text-[11px] text-slate-600 block mt-0.5 truncate">
                  {resAmonia.porcentagemToxica}% da amônia total é letal
                </span>
              </div>
              <div className="text-right flex-shrink-0 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-rose-500/20 self-start sm:self-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Status de Risco
                </span>
                <span className={`text-sm sm:text-base font-black ${resAmonia.nh3 < 0.05 ? "text-emerald-700" : "text-rose-700"}`}>
                  {resAmonia.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
                <TituloEntrada
                  icone={FlaskConical}
                  titulo="Parâmetros para Fração Tóxica"
                  cor="rose"
                />

                <div className="space-y-3.5">
                  <CampoNumero
                    label="Amônia Total (NAT) do teste"
                    valor={amoniaNat}
                    onChange={setAmoniaNat}
                    step="0.1"
                    min="0"
                    sufixo="mg/L"
                    cor="rose"
                    ajuda="Medido com kit colorimétrico comercial."
                  />

                  <CampoNumero
                    label="pH da Água no Horário"
                    valor={amoniaPh}
                    onChange={setAmoniaPh}
                    step="0.1"
                    min="6.0"
                    cor="rose"
                    ajuda="Quanto mais alto o pH, maior a proporção tóxica de NH3."
                  />

                  <CampoNumero
                    label="Temperatura da Água"
                    valor={amoniaTemp}
                    onChange={setAmoniaTemp}
                    step="0.5"
                    min="15"
                    sufixo="°C"
                    cor="rose"
                  />
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <CartaoSaida titulo="Amônia Não-Ionizada Real (NH3 Gasosa)" cor="rose">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CartaoResultado
                      titulo="NH3 Tóxica Real"
                      valor={resAmonia.nh3}
                      unidade="mg/L"
                      detalhe={`${resAmonia.porcentagemToxica}% da amônia total é tóxica`}
                      cor="rose"
                    />

                    <CartaoResultado
                      titulo="Status de Risco"
                      valor={resAmonia.status}
                      detalhe="Limite máximo tolerável: 0.05 mg/L"
                      cor="rose"
                    />
                  </div>

                  <PainelInterno titulo="Ação Recomendada" cor="rose">
                    <p>{resAmonia.orientacao}</p>
                  </PainelInterno>
                </CartaoSaida>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 5: POVOAMENTO & METAS                                      */}
        {/* ============================================================== */}
        {subTab === "povoamento" && (
          <div className="space-y-4">
            {/* Resumo Rápido no Topo */}
            <div className="bg-gradient-to-r from-indigo-500/15 via-indigo-500/10 to-transparent border border-indigo-500/30 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-slate-900 shadow-2xs">
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">
                  Pós-Larvas para Compra
                </span>
                <div className="text-xl sm:text-2xl font-black text-indigo-900 leading-tight">
                  {resPovo.totalPLs.toLocaleString()} <span className="text-xs font-bold text-slate-700">PLs</span>
                </div>
                <span className="text-[11px] text-slate-600 block mt-0.5 truncate">
                  Para área de {povoAreaM2.toLocaleString()} m² ({povoDensidade} cam/m²)
                </span>
              </div>
              <div className="text-right flex-shrink-0 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-indigo-500/20 self-start sm:self-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Biomassa Prevista
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900">
                  {resPovo.biomassaEsperadaKg.toLocaleString()} <span className="text-xs font-bold text-indigo-700">kg</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
                <TituloEntrada
                  icone={Sparkles}
                  titulo="Planejamento do Ciclo"
                  cor="indigo"
                />

                <div className="space-y-3.5">
                  <CampoNumero
                    label="Área do Viveiro"
                    valor={povoAreaM2}
                    onChange={setPovoAreaM2}
                    step="1000"
                    min="500"
                    sufixo="m²"
                    cor="indigo"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <CampoNumero
                      label="Densidade Alvo"
                      valor={povoDensidade}
                      onChange={setPovoDensidade}
                      step="1"
                      min="1"
                      sufixo="cam/m²"
                      cor="indigo"
                    />
                    <CampoNumero
                      label="Sobrevivência"
                      valor={povoSobrevivencia}
                      onChange={setPovoSobrevivencia}
                      step="5"
                      min="10"
                      sufixo="%"
                      cor="indigo"
                    />
                  </div>

                  <CampoNumero
                    label="Peso Médio Final Alvo"
                    valor={povoPesoAlvo}
                    onChange={setPovoPesoAlvo}
                    step="0.5"
                    min="5"
                    sufixo="g"
                    cor="indigo"
                    ajuda="Peso comercial planejado para a despesca."
                  />
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <CartaoSaida titulo="Projeção de Pós-Larvas e Colheita" cor="indigo">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CartaoResultado
                      titulo="PLs Necessárias para Compra"
                      valor={resPovo.totalPLs.toLocaleString()}
                      unidade="PLs"
                      detalhe={`Estimativa para povoar ${povoAreaM2.toLocaleString()} m²`}
                      cor="indigo"
                    />

                    <CartaoResultado
                      titulo="Biomassa Prevista na Despesca"
                      valor={resPovo.biomassaEsperadaKg.toLocaleString()}
                      unidade="kg"
                      detalhe={`Produtividade estimada: ${resPovo.produtividadeKgHa} kg/ha`}
                      cor="indigo"
                    />
                  </div>
                </CartaoSaida>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 6: CALIBRE COMERCIAL & DESPESCA                            */}
        {/* ============================================================== */}
        {subTab === "calibre" && (
          <CalcCalibre
            viveiroAtual={viveiroAtual}
            bioAtual={bioAtual}
            biometriasDoViveiro={biometriasDoViveiro}
          />
        )}

        {/* ============================================================== */}
        {/* ABA 7: CRESCIMENTO & ÍNDICES ZOOTÉCNICOS                        */}
        {/* ============================================================== */}
        {subTab === "crescimento" && (
          <CalcCrescimento viveiroAtual={viveiroAtual} bioAtual={bioAtual} />
        )}

        {/* ============================================================== */}
        {/* ABA 8: BALANÇO IÔNICO (ÁGUA DE BAIXA SALINIDADE)               */}
        {/* ============================================================== */}
        {subTab === "ionico" && (
          <CalcIonico viveiroAtual={viveiroAtual} aguaAtual={aguaAtual} />
        )}

        {/* ============================================================== */}
        {/* ABA 9: AERAÇÃO & SISTEMA DE CULTIVO                            */}
        {/* ============================================================== */}
        {subTab === "aeracao" && (
          <CalcAeracao viveiroAtual={viveiroAtual} />
        )}

        {/* ============================================================== */}
        {/* ABA 10: BIOFLOCOS E RELAÇÃO C:N                                */}
        {/* ============================================================== */}
        {subTab === "bioflocos" && (
          <CalcBioflocos viveiroAtual={viveiroAtual} bioAtual={bioAtual} aguaAtual={aguaAtual} />
        )}
      </div>
    </div>
  );
}
