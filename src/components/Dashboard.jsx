import React from "react";
import { 
  Layers, 
  Weight, 
  Utensils, 
  AlertTriangle, 
  PlusCircle, 
  TrendingUp, 
  Droplets,
  Calendar,
  ChevronRight,
  Fish
} from "lucide-react";

export default function Dashboard({ 
  viveiros = [], 
  biometrias = [], 
  qualidadeAgua = [], 
  onNavigate,
  onOpenNewBiometria,
  onOpenNewAgua,
  onOpenNewViveiro
}) {
  // Viveiros ativos
  const viveirosAtivos = viveiros.filter(v => v.status === "ativo");

  // Calcular métricas agregadas
  let totalBiomassaKg = 0;
  let totalRacaoHojeKg = 0;
  let pesoMedioGlobalSoma = 0;
  let contagemBiometriasRecentes = 0;

  // Mapa com a última biometria de cada viveiro
  const ultimaBiometriaPorViveiro = {};
  biometrias.forEach(b => {
    if (!ultimaBiometriaPorViveiro[b.viveiroId] || new Date(b.data) > new Date(ultimaBiometriaPorViveiro[b.viveiroId].data)) {
      ultimaBiometriaPorViveiro[b.viveiroId] = b;
    }
  });

  // Mapa com a última medição de água de cada viveiro
  const ultimaAguaPorViveiro = {};
  qualidadeAgua.forEach(q => {
    if (!ultimaAguaPorViveiro[q.viveiroId] || new Date(q.data) > new Date(ultimaAguaPorViveiro[q.viveiroId].data)) {
      ultimaAguaPorViveiro[q.viveiroId] = q;
    }
  });

  // Alertas críticos
  const alertas = [];

  viveirosAtivos.forEach(v => {
    const bio = ultimaBiometriaPorViveiro[v.id];
    if (bio && bio.biomassaKg) {
      totalBiomassaKg += Number(bio.biomassaKg);
      pesoMedioGlobalSoma += Number(bio.pesoMedioG);
      contagemBiometriasRecentes++;

      // Estimativa de ração diária aproximada (taxa padrão ~3.5%)
      const taxaAprox = bio.pesoMedioG > 12 ? 0.03 : (bio.pesoMedioG > 7 ? 0.045 : 0.07);
      totalRacaoHojeKg += Number(bio.biomassaKg) * taxaAprox;
    }

    const agua = ultimaAguaPorViveiro[v.id];
    if (agua) {
      if (agua.oxigenio < 3.5) {
        alertas.push({
          tipo: "danger",
          viveiro: v.nome,
          mensagem: `Oxigênio Crítico (${agua.oxigenio} mg/L). Risco iminente de anoxia!`
        });
      }
      if (agua.alcalinidade < 100) {
        alertas.push({
          tipo: "warning",
          viveiro: v.nome,
          mensagem: `Alcalinidade Baixa (${agua.alcalinidade} mg/L). Corrigir com Bicarbonato.`
        });
      }
      if (agua.ph > 8.8 || agua.ph < 7.2) {
        alertas.push({
          tipo: "warning",
          viveiro: v.nome,
          mensagem: `pH fora da faixa ideal (${agua.ph}).`
        });
      }
    }
  });

  const pesoMedioGeral = contagemBiometriasRecentes > 0 
    ? (pesoMedioGlobalSoma / contagemBiometriasRecentes).toFixed(1) 
    : "0.0";

  // Calcular dias de cultivo (DOC)
  const getDOC = (dataPovoamento) => {
    if (!dataPovoamento) return 0;
    const inicio = new Date(dataPovoamento);
    const hoje = new Date();
    const diffTime = Math.abs(hoje - inicio);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-800/40 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Monitoramento Ativo em Campo
            </span>
            <h2 className="text-xl md:text-2xl font-black text-white">
              Painel Geral de Carcinicultura
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Dados salvos localmente no seu aparelho. Cálculos de arraçoamento, biometria e qualidade de água atualizados.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onOpenNewBiometria}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-700/30 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Biometria</span>
            </button>

            <button
              onClick={onOpenNewAgua}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-lg shadow-cyan-700/30 transition-all active:scale-95"
            >
              <Droplets className="w-4 h-4" />
              <span>+ Qualidade Água</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Viveiros Ativos */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Viveiros Ativos</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-white">{viveirosAtivos.length}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              de {viveiros.length} cadastrados
            </div>
          </div>
        </div>

        {/* Card 2: Biomassa Total */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Biomassa Estimada</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Weight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-white">
              {totalBiomassaKg > 1000 
                ? `${(totalBiomassaKg / 1000).toFixed(2)} ton`
                : `${totalBiomassaKg.toFixed(0)} kg`}
            </div>
            <div className="text-xs text-teal-400 font-medium mt-0.5">
              Camarão em cultivo
            </div>
          </div>
        </div>

        {/* Card 3: Ração Diária Prevista */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Ração Hoje (Prev.)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-white">
              {totalRacaoHojeKg.toFixed(0)} <span className="text-sm font-semibold text-slate-400">kg/dia</span>
            </div>
            <div className="text-xs text-amber-400 font-medium mt-0.5">
              Soma de todos os viveiros
            </div>
          </div>
        </div>

        {/* Card 4: Peso Médio */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Peso Médio Geral</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Fish className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-white">
              {pesoMedioGeral} <span className="text-sm font-semibold text-slate-400">g</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Últimas biometrias
            </div>
          </div>
        </div>
      </div>

      {/* Alertas Críticos (se houver) */}
      {alertas.length > 0 && (
        <div className="bg-slate-800/80 border border-amber-600/30 rounded-2xl p-4 shadow-md space-y-2.5">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Atenção nos Viveiros ({alertas.length})</span>
          </div>
          <div className="space-y-2">
            {alertas.map((a, i) => (
              <div 
                key={i} 
                className={`text-xs p-2.5 rounded-xl flex items-center justify-between ${
                  a.tipo === "danger" 
                    ? "bg-rose-950/40 text-rose-300 border border-rose-800/40" 
                    : "bg-amber-950/40 text-amber-300 border border-amber-800/40"
                }`}
              >
                <div>
                  <span className="font-bold underline mr-1.5">{a.viveiro}:</span>
                  {a.mensagem}
                </div>
                <button 
                  onClick={() => onNavigate("agua")}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium text-[11px]"
                >
                  Ver Água
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status dos Viveiros */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Viveiros em Produção
          </h3>
          <button
            onClick={() => onNavigate("viveiros")}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {viveiros.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="text-base font-bold text-white">Nenhum viveiro cadastrado</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Cadastre seu primeiro viveiro com a área, data de povoamento e quantidade de pós-larvas para automatizar os cálculos.
            </p>
            <button
              onClick={onOpenNewViveiro}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
            >
              <PlusCircle className="w-4 h-4" />
              Cadastrar Primeiro Viveiro
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {viveiros.map((v) => {
              const bio = ultimaBiometriaPorViveiro[v.id];
              const agua = ultimaAguaPorViveiro[v.id];
              const doc = getDOC(v.dataPovoamento);

              return (
                <div
                  key={v.id}
                  className="bg-slate-800/70 border border-slate-700/70 hover:border-emerald-600/50 transition-all rounded-2xl p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">{v.nome}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          v.status === "ativo" 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                            : "bg-slate-700 text-slate-300"
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                        <span>Área: {(v.areaM2 / 10000).toFixed(2)} ha ({v.areaM2.toLocaleString()} m²)</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          DOC: <b>{doc} dias</b>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resumo Rápido da Biometria e Água */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-center">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Peso Atual</div>
                      <div className="text-sm font-black text-emerald-400 mt-0.5">
                        {bio ? `${bio.pesoMedioG} g` : "Sem bio"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Biomassa</div>
                      <div className="text-sm font-black text-white mt-0.5">
                        {bio?.biomassaKg ? `${Math.round(bio.biomassaKg)} kg` : "--"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Oxigênio</div>
                      <div className={`text-sm font-black mt-0.5 ${
                        !agua ? "text-slate-400" : (agua.oxigenio >= 4.0 ? "text-emerald-400" : "text-rose-400")
                      }`}>
                        {agua ? `${agua.oxigenio} mg/L` : "--"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/50">
                    <span className="text-slate-400 text-[11px]">
                      {bio ? `Última biometria: ${bio.data}` : "Nenhuma biometria ainda"}
                    </span>
                    <button
                      onClick={() => onNavigate("calculadoras")}
                      className="text-emerald-400 font-semibold hover:text-emerald-300 flex items-center gap-1"
                    >
                      Calcular Ração <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
