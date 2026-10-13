import React, { useState, useEffect } from "react";
import { 
  Utensils, 
  Droplets, 
  Sprout, 
  FlaskConical, 
  Calculator, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { 
  calculateDailyFeed, 
  calculateWaterCorrection, 
  calculateToxicAmmonia, 
  calculateSoilLiming, 
  calculateStocking,
  getFeedingRateInfo
} from "../services/calculatorService.js";
import { AJUSTE_BANDEJAS_ALIMENTACAO } from "../data/carcinoData.js";

export default function CalculadorasHub({ viveiros = [], biometrias = [], qualidadeAgua = [] }) {
  const [subTab, setSubTab] = useState("racao"); // racao, agua, solo, amonia, povoamento
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

  // Estados dos inputs da Calculadora de Ração
  const [racaoBiomassa, setRacaoBiomassa] = useState(1000);
  const [racaoPesoMedio, setRacaoPesoMedio] = useState(10.0);
  const [racaoTemp, setRacaoTemp] = useState(29.0);
  const [racaoO2, setRacaoO2] = useState(5.0);
  const [racaoBandejaAjuste, setRacaoBandejaAjuste] = useState(0);
  const [racaoTratos, setRacaoTratos] = useState(3);
  const [modoAutomaticoRacao, setModoAutomaticoRacao] = useState(true);

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

  const resAmonia = calculateToxicAmmonia(amoniaNat, amoniaPh, amoniaTemp);

  const resPovo = calculateStocking({
    areaM2: povoAreaM2,
    densidadeAlvoM2: povoDensidade,
    pesoFinalAlvoG: povoPesoAlvo,
    sobrevivenciaEsperadaPercent: povoSobrevivencia
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Seletor de Abas */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Calculator className="w-6 h-6 text-emerald-400" />
              Calculadoras Especializadas de Carcinicultura
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Fórmulas zootécnicas automatizadas. Escolha o assunto desejado abaixo:
            </p>
          </div>

          {/* Seletor Global de Viveiro para Automação */}
          {viveiros.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-700">
              <span className="text-xs font-semibold text-slate-400 pl-2">Viveiro:</span>
              <select
                value={selectedViveiroId}
                onChange={(e) => setSelectedViveiroId(e.target.value)}
                className="bg-slate-800 text-white font-bold text-xs rounded-xl px-3 py-1.5 border border-slate-600 focus:outline-none focus:border-emerald-500"
              >
                {viveiros.map(v => (
                  <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Sub-Tabs de Assuntos Direcionados */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-3 border-t border-slate-700/60 no-scrollbar">
          <button
            onClick={() => setSubTab("racao")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              subTab === "racao" 
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20" 
                : "bg-slate-900/60 text-slate-400 hover:text-white"
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Alimentação / Ração</span>
          </button>

          <button
            onClick={() => setSubTab("agua")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              subTab === "agua" 
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20" 
                : "bg-slate-900/60 text-slate-400 hover:text-white"
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>Tratamento de Água</span>
          </button>

          <button
            onClick={() => setSubTab("solo")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              subTab === "solo" 
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20" 
                : "bg-slate-900/60 text-slate-400 hover:text-white"
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>Calagem de Solo</span>
          </button>

          <button
            onClick={() => setSubTab("amonia")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              subTab === "amonia" 
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" 
                : "bg-slate-900/60 text-slate-400 hover:text-white"
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Amônia Tóxica (NH3)</span>
          </button>

          <button
            onClick={() => setSubTab("povoamento")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              subTab === "povoamento" 
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" 
                : "bg-slate-900/60 text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Povoamento & Metas</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ABA 1: ALIMENTAÇÃO E ARRAÇOAMENTO                              */}
      {/* ============================================================== */}
      {subTab === "racao" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Card Esquerdo: O que o produtor fornece */}
          <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-400" />
                O que fornecer para calcular:
              </h3>
              {viveiroAtual && (
                <button
                  onClick={() => setModoAutomaticoRacao(!modoAutomaticoRacao)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-all ${
                    modoAutomaticoRacao 
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" 
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${modoAutomaticoRacao ? "animate-spin" : ""}`} />
                  {modoAutomaticoRacao ? "Auto (do Viveiro)" : "Manual"}
                </button>
              )}
            </div>

            {modoAutomaticoRacao && viveiroAtual && (
              <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-3 text-xs text-amber-200">
                <span className="font-bold">Dados automáticos de:</span> {viveiroAtual.nome}
                <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-slate-300">
                  <div>Biomassa: <b>{bioAtual?.biomassaKg || "0"} kg</b></div>
                  <div>Peso Médio: <b>{bioAtual?.pesoMedioG || "0"} g</b></div>
                  <div>Temp. Água: <b>{aguaAtual?.temperatura || "29"} °C</b></div>
                  <div>Oxigênio: <b>{aguaAtual?.oxigenio || "5.0"} mg/L</b></div>
                </div>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  1. Biomassa Total Estimada (kg):
                </label>
                <input
                  type="number"
                  disabled={modoAutomaticoRacao && !!bioAtual}
                  value={racaoBiomassa}
                  onChange={(e) => setRacaoBiomassa(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Peso total de todos os camarões vivos no viveiro.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  2. Peso Médio Atual do Camarão (gramas):
                </label>
                <input
                  type="number"
                  step="0.1"
                  disabled={modoAutomaticoRacao && !!bioAtual}
                  value={racaoPesoMedio}
                  onChange={(e) => setRacaoPesoMedio(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Determina a taxa percentual de arraçoamento ({resRacao.taxaPercentual}% para {racaoPesoMedio}g).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Temperatura (°C):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={racaoTemp}
                    onChange={(e) => setRacaoTemp(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Oxigênio (mg/L):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={racaoO2}
                    onChange={(e) => setRacaoO2(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Ajuste de Manejo por Bandejas (Comedouros):
                </label>
                <select
                  value={racaoBandejaAjuste}
                  onChange={(e) => setRacaoBandejaAjuste(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold text-xs focus:border-amber-500 focus:outline-none"
                >
                  {AJUSTE_BANDEJAS_ALIMENTACAO.map((item, idx) => (
                    <option key={idx} value={item.ajustePercentual}>
                      {item.status} ({item.ajustePercentual > 0 ? `+${item.ajustePercentual}%` : `${item.ajustePercentual}%`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Número de Tratos (refeições) por dia:
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRacaoTratos(n)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        racaoTratos === n 
                          ? "bg-amber-500 text-slate-950 font-black shadow-md" 
                          : "bg-slate-900 text-slate-400 hover:text-white border border-slate-700"
                      }`}
                    >
                      {n}x / dia
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card Direito: Resultados Zootécnicos Transformados */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-900 border border-amber-600/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Resultado Automatizado da Ração
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-amber-500/20">
                  <div className="text-xs text-slate-400 font-medium">Ração Total Diária</div>
                  <div className="text-3xl font-black text-amber-400 mt-1">
                    {resRacao.racaoFinalKg} <span className="text-base text-white font-bold">kg/dia</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Taxa base: {resRacao.taxaPercentual}% da biomassa ({resRacao.faseCultivo})
                  </div>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-amber-500/20">
                  <div className="text-xs text-slate-400 font-medium">Quantidade por Trato</div>
                  <div className="text-3xl font-black text-white mt-1">
                    {resRacao.racaoPorTratoKg} <span className="text-base text-amber-400 font-bold">kg</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Dividido em {resRacao.numeroTratos} horários iguais
                  </div>
                </div>
              </div>

              {/* Tabela de Horários Sugeridos */}
              <div className="mt-4 bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">
                  Programação Sugerida de Horários
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  {resRacao.numeroTratos === 2 && (
                    <>
                      <div className="p-2 bg-slate-800/80 rounded-xl">
                        <div className="text-[11px] text-slate-400 font-bold">07:30</div>
                        <div className="text-sm font-black text-amber-400">{resRacao.racaoPorTratoKg} kg</div>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-xl">
                        <div className="text-[11px] text-slate-400 font-bold">16:30</div>
                        <div className="text-sm font-black text-amber-400">{resRacao.racaoPorTratoKg} kg</div>
                      </div>
                    </>
                  )}
                  {resRacao.numeroTratos === 3 && (
                    <>
                      <div className="p-2 bg-slate-800/80 rounded-xl">
                        <div className="text-[11px] text-slate-400 font-bold">07:00 (1º)</div>
                        <div className="text-sm font-black text-amber-400">{resRacao.racaoPorTratoKg} kg</div>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-xl">
                        <div className="text-[11px] text-slate-400 font-bold">11:30 (2º)</div>
                        <div className="text-sm font-black text-amber-400">{resRacao.racaoPorTratoKg} kg</div>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-xl">
                        <div className="text-[11px] text-slate-400 font-bold">16:30 (3º)</div>
                        <div className="text-sm font-black text-amber-400">{resRacao.racaoPorTratoKg} kg</div>
                      </div>
                    </>
                  )}
                  {resRacao.numeroTratos >= 4 && (
                    <>
                      <div className="p-2 bg-slate-800/80 rounded-xl">
                        <div className="text-[11px] text-slate-400 font-bold">06:30</div>
                        <div className="text-sm font-black text-amber-400">{resRacao.racaoPorTratoKg} kg</div>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-xl">
                        <div className="text-[11px] text-slate-400 font-bold">10:30</div>
                        <div className="text-sm font-black text-amber-400">{resRacao.racaoPorTratoKg} kg</div>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-xl">
                        <div className="text-[11px] text-slate-400 font-bold">14:30</div>
                        <div className="text-sm font-black text-amber-400">{resRacao.racaoPorTratoKg} kg</div>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-xl">
                        <div className="text-[11px] text-slate-400 font-bold">18:00</div>
                        <div className="text-sm font-black text-amber-400">{resRacao.racaoPorTratoKg} kg</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Alertas e Avisos de Manejo */}
              {resRacao.avisos.length > 0 && (
                <div className="mt-4 space-y-2">
                  {resRacao.avisos.map((aviso, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{aviso}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dica Técnica para o Produtor */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-300 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Regra de Ouro da Carcinicultura:</span>
                {" "}Ração que sobra no fundo do viveiro não alimenta camarão; consome oxigênio e vira amônia tóxica. Sempre priorize o ajuste das bandejas de 2h a 2h30 após a distribuição.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: TRATAMENTO DE ÁGUA (ALCALINIDADE & pH)                  */}
      {/* ============================================================== */}
      {subTab === "agua" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Droplets className="w-5 h-5 text-cyan-400" />
                O que fornecer para a correção:
              </h3>
              {viveiroAtual && (
                <button
                  onClick={() => setModoAutomaticoAgua(!modoAutomaticoAgua)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                    modoAutomaticoAgua 
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" 
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${modoAutomaticoAgua ? "animate-spin" : ""}`} />
                  {modoAutomaticoAgua ? "Auto (do Viveiro)" : "Manual"}
                </button>
              )}
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  1. Volume de Água do Viveiro (m³):
                </label>
                <input
                  type="number"
                  value={aguaVolumeM3}
                  onChange={(e) => setAguaVolumeM3(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:border-cyan-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Calculado: Área (m²) × Profundidade média (m). Ex: 10.000m² × 1.2m = 12.000 m³.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    2. Alcalinidade Atual:
                  </label>
                  <input
                    type="number"
                    value={aguaAlcalinidadeAtual}
                    onChange={(e) => setAguaAlcalinidadeAtual(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">mg/L de CaCO3</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    3. Alcalinidade Meta:
                  </label>
                  <input
                    type="number"
                    value={aguaAlcalinidadeMeta}
                    onChange={(e) => setAguaAlcalinidadeMeta(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Padrão: 120-150 mg/L</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  4. pH Atual da Água:
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={aguaPh}
                  onChange={(e) => setAguaPh(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-cyan-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Decide a segurança entre Bicarbonato de Sódio vs. Cal Hidratada.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-gradient-to-br from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-600/40 rounded-3xl p-6 shadow-xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Prescrição de Correção de Alcalinidade
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-cyan-500/20">
                  <div className="text-xs text-slate-400 font-medium">Bicarbonato de Sódio (NaHCO3)</div>
                  <div className="text-3xl font-black text-cyan-400 mt-1">
                    {resAgua.bicarbonatoKg} <span className="text-base text-white font-bold">kg</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Opção Mais Segura (Não dispara o pH)
                  </div>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-cyan-500/20">
                  <div className="text-xs text-slate-400 font-medium">Cal Hidratada (Ca(OH)2)</div>
                  <div className="text-3xl font-black text-slate-300 mt-1">
                    {resAgua.calHidratadaKg} <span className="text-base text-slate-400 font-bold">kg</span>
                  </div>
                  <div className={`text-[11px] mt-1 font-semibold ${aguaPh >= 8.2 ? "text-rose-400" : "text-amber-400"}`}>
                    {aguaPh >= 8.2 ? "NÃO RECOMENDADO com pH ≥ 8.2" : "Usar com cautela em leite de cal"}
                  </div>
                </div>
              </div>

              {/* Recomendação Técnica */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200 space-y-2">
                <div className="font-bold text-cyan-300">Diagnóstico de Manejo:</div>
                <p>{resAgua.recomendacao}</p>
                <p className="text-slate-400 text-[11px]">
                  <b>Dose máxima fracionada sugerida:</b> até {resAgua.doseMaximaDiariaKg} kg/dia para não causar estresse osmótico no lote.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-300 flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Por que a alcalinidade importa?</span>
                {" "}O camarão precisa absorver íons bicarbonato e cálcio da água durante a muda (*ecdise*). Se a alcalinidade estiver abaixo de 100 mg/L, o exoesqueleto fica mole e ocorrem deformações e canibalismo.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 3: CALAGEM E PREPARO DE SOLO DO FUNDO                      */}
      {/* ============================================================== */}
      {subTab === "solo" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-700">
              <Sprout className="w-5 h-5 text-emerald-400" />
              Dados do Solo Seco (Pós-Despesca):
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  1. Área do Viveiro (m²):
                </label>
                <input
                  type="number"
                  value={soloAreaM2}
                  onChange={(e) => setSoloAreaM2(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Equivale a {(soloAreaM2 / 10000).toFixed(2)} hectares.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  2. pH do Solo do Fundo:
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={soloPh}
                  onChange={(e) => setSoloPh(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Medição feita em amostra do solo seco ou com peagômetro de solo.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-600/40 rounded-3xl p-6 shadow-xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Recomendação de Calagem de Fundo
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-emerald-500/20">
                  <div className="text-xs text-slate-400 font-medium">Calcário Dolomítico Total</div>
                  <div className="text-3xl font-black text-emerald-400 mt-1">
                    {resSolo.doseTotalKg.toLocaleString()} <span className="text-base text-white font-bold">kg</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Dose recomendada: {resSolo.doseKgPorHa} kg/ha ({((resSolo.doseKgPorHa)/1000).toFixed(1)} t/ha)
                  </div>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-emerald-500/20">
                  <div className="text-xs text-slate-400 font-medium">Tempo de Dessecação (Sol)</div>
                  <div className="text-3xl font-black text-white mt-1">
                    10 a 15 <span className="text-base text-emerald-400 font-bold">dias</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Até abrir rachaduras de 2 a 5 cm no lodo
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200 space-y-2">
                <div className="font-bold text-emerald-300">Manejo de Preparação:</div>
                <p>{resSolo.recomendacao}</p>
                <p className="text-slate-400 text-[11px]">
                  Distribua o calcário uniformemente e faça uma leve gradagem (10 cm) para neutralizar a camada redutora de sulfetos do fundo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 4: AMÔNIA TÓXICA NÃO-IONIZADA (NH3)                         */}
      {/* ============================================================== */}
      {subTab === "amonia" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-700">
              <FlaskConical className="w-5 h-5 text-rose-400" />
              Parâmetros para Calcular a Fração Tóxica:
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Amônia Total (NAT) do teste colorimétrico (mg/L):
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={amoniaNat}
                  onChange={(e) => setAmoniaNat(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  pH da Água:
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={amoniaPh}
                  onChange={(e) => setAmoniaPh(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-rose-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Quanto maior o pH, maior a proporção da amônia tóxica NH3.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Temperatura (°C):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={amoniaTemp}
                  onChange={(e) => setAmoniaTemp(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-900 border border-rose-600/40 rounded-3xl p-6 shadow-xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Amônia Não-Ionizada Real (NH3 Gasosa)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-rose-500/20">
                  <div className="text-xs text-slate-400 font-medium">NH3 Tóxica Real</div>
                  <div className="text-3xl font-black text-rose-400 mt-1">
                    {resAmonia.nh3} <span className="text-base text-white font-bold">mg/L</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {resAmonia.porcentagemToxica}% da amônia total é tóxica
                  </div>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-rose-500/20">
                  <div className="text-xs text-slate-400 font-medium">Status de Risco</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {resAmonia.status}
                  </div>
                  <div className="text-[11px] text-rose-300 mt-1 font-semibold">
                    Limite máximo tolerável: 0.05 mg/L
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200 space-y-1">
                <div className="font-bold text-rose-300">Ação Recomendada:</div>
                <p>{resAmonia.orientacao}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 5: POVOAMENTO & METAS                                      */}
      {/* ============================================================== */}
      {subTab === "povoamento" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-700">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Planejamento do Ciclo:
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Área do Viveiro (m²):
                </label>
                <input
                  type="number"
                  value={povoAreaM2}
                  onChange={(e) => setPovoAreaM2(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Densidade (cam/m²):
                  </label>
                  <input
                    type="number"
                    value={povoDensidade}
                    onChange={(e) => setPovoDensidade(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Sobrevivência (%):
                  </label>
                  <input
                    type="number"
                    value={povoSobrevivencia}
                    onChange={(e) => setPovoSobrevivencia(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Peso Médio Final Alvo (g):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={povoPesoAlvo}
                  onChange={(e) => setPovoPesoAlvo(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-600/40 rounded-3xl p-6 shadow-xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Projeção de Pós-Larvas e Colheita
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-indigo-500/20">
                  <div className="text-xs text-slate-400 font-medium">PLs Necessárias para Compra</div>
                  <div className="text-3xl font-black text-indigo-400 mt-1">
                    {resPovo.totalPLs.toLocaleString()} <span className="text-base text-white font-bold">PLs</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Estimativa para povoar {povoAreaM2.toLocaleString()} m²
                  </div>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-indigo-500/20">
                  <div className="text-xs text-slate-400 font-medium">Biomassa Prevista na Despesca</div>
                  <div className="text-3xl font-black text-white mt-1">
                    {resPovo.biomassaEsperadaKg.toLocaleString()} <span className="text-base text-indigo-400 font-bold">kg</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Produtividade: {resPovo.produtividadeKgHa} kg/ha
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
