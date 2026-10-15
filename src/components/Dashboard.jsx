import React, { useState } from "react";
import { 
  Layers, 
  Scale, 
  AlertTriangle, 
  PlusCircle, 
  TrendingUp, 
  Droplets,
  Calendar,
  ChevronRight,
  Store,
  Sprout
} from "lucide-react";
import { ShrimpIcon, FeedTrayIcon } from "./icons/CustomAquacultureIcons.jsx";
import ModalAvisoViveiroObrigatorio from "./ModalAvisoViveiroObrigatorio.jsx";
import { calculateDailyFeed, calculateToxicAmmonia } from "../services/calculatorService.js";
import { avaliarQualidadeAgua, NIVEIS } from "../services/qualidadeAguaService.js";

export default function Dashboard({ 
  viveiros = [], 
  biometrias = [], 
  qualidadeAgua = [], 
  onNavigate,
  onOpenNewBiometria,
  onOpenNewAgua,
  onOpenNewViveiro,
  onIniciarCadastroComIntencao,
  onCarregarExemplos
}) {
  const [modalAvisoAberto, setModalAvisoAberto] = useState(false);
  const [tipoAviso, setTipoAviso] = useState("biometria");

  const handleCliqueBiometria = () => {
    if (viveiros.length === 0) {
      setTipoAviso("biometria");
      setModalAvisoAberto(true);
    } else {
      onOpenNewBiometria?.();
    }
  };

  const handleCliqueAgua = () => {
    if (viveiros.length === 0) {
      setTipoAviso("agua");
      setModalAvisoAberto(true);
    } else {
      onOpenNewAgua?.();
    }
  };
  // Viveiros ativos
  const viveirosAtivos = viveiros.filter(v => v.status === "ativo");

  // Calcular métricas agregadas
  let totalBiomassaKg = 0;
  let totalRacaoHojeKg = 0;
  let pesoMedioGlobalSoma = 0;
  let contagemBiometriasRecentes = 0;

  // Mais recente por data e, quando o dia empata (medição da manhã e da tarde),
  // pela última cadastrada — senão a referência do viveiro ficava sendo a antiga
  const ehMaisRecente = (candidato, atual) => {
    if (!atual) return true;
    const diferencaDeData = new Date(candidato.data) - new Date(atual.data);
    if (diferencaDeData !== 0) return diferencaDeData > 0;
    return (Number(candidato.id) || 0) > (Number(atual.id) || 0);
  };

  // Mapa com a última biometria de cada viveiro
  const ultimaBiometriaPorViveiro = {};
  biometrias.forEach(b => {
    if (ehMaisRecente(b, ultimaBiometriaPorViveiro[b.viveiroId])) ultimaBiometriaPorViveiro[b.viveiroId] = b;
  });

  // Mapa com a última medição de água de cada viveiro
  const ultimaAguaPorViveiro = {};
  qualidadeAgua.forEach(q => {
    if (ehMaisRecente(q, ultimaAguaPorViveiro[q.viveiroId])) ultimaAguaPorViveiro[q.viveiroId] = q;
  });

  // Alertas críticos
  const alertas = [];

  // Ordem de exibição dos alertas: o mais grave primeiro
  const ORDEM_ALERTA = { emergencial: 0, critico: 1, atencao: 2 };

  viveirosAtivos.forEach(v => {
    const bio = ultimaBiometriaPorViveiro[v.id];
    const agua = ultimaAguaPorViveiro[v.id];

    if (bio && bio.biomassaKg) {
      totalBiomassaKg += Number(bio.biomassaKg);
      pesoMedioGlobalSoma += Number(bio.pesoMedioG);
      contagemBiometriasRecentes++;

      // Ração do dia pela MESMA calculadora da aba Cálculos (tabela de
      // arraçoamento + correções de temperatura e oxigênio). Antes havia aqui
      // uma aproximação fixa que subestimava a ração acima de 12 g.
      const racao = calculateDailyFeed({
        biomassaKg: Number(bio.biomassaKg),
        pesoMedioG: Number(bio.pesoMedioG),
        temperaturaC: Number(agua?.temperatura) || 29,
        oxigenioMgL: Number(agua?.oxigenio) || 5
      });
      totalRacaoHojeKg += racao.racaoFinalKg;
    }

    if (agua) {
      // Alertas gerados pela tabela de referência (agora cobre temperatura,
      // salinidade, amônia e nitrito, além de oxigênio, pH e alcalinidade).
      // O nitrito é julgado pela salinidade da própria medição.
      // Itens contextuais (ex.: salinidade baixa em água de poço) não viram alerta.
      avaliarQualidadeAgua(agua).resultados
        .filter(r => !r.contextual && [NIVEIS.ATENCAO, NIVEIS.CRITICO, NIVEIS.EMERGENCIAL].includes(r.nivel))
        .forEach(r => {
          alertas.push({
            tipo: r.nivel === NIVEIS.EMERGENCIAL ? "danger" : "warning",
            nivel: r.nivel,
            viveiro: v.nome,
            mensagem: `${r.nome} em nível ${r.rotulo.toLowerCase()}: ${r.valor}${r.unidade ? ` ${r.unidade}` : ""}`,
            detalhe: r.impacto
          });
        });

      // Amônia tóxica real (NH3): a amônia total sozinha não revela o risco
      const amoniaToxica = calculateToxicAmmonia(agua.amoniaTotal, agua.ph, agua.temperatura, agua.salinidade);
      if (amoniaToxica.nh3 >= 0.05) {
        alertas.push({
          tipo: amoniaToxica.nh3 >= 0.10 ? "danger" : "warning",
          nivel: amoniaToxica.nh3 >= 0.10 ? "emergencial" : "critico",
          viveiro: v.nome,
          mensagem: `Amônia tóxica (NH3) em ${amoniaToxica.nh3} mg/L: ${amoniaToxica.status}`,
          detalhe: amoniaToxica.orientacao
        });
      }
    }
  });

  alertas.sort((a, b) => (ORDEM_ALERTA[a.nivel] ?? 3) - (ORDEM_ALERTA[b.nivel] ?? 3));

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
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 border border-emerald-800/40 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-950/15 relative overflow-hidden">
        {/* Subtle decorative aquatic light bursts */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-32 -bottom-16 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Painel de Operações da Fazenda
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs animate-water-ripple">
                <span className="relative flex h-2 w-2">
                  <span className="radar-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {viveirosAtivos.length} {viveirosAtivos.length === 1 ? "viveiro ativo" : "viveiros ativos"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Acompanhamento zootécnico e telemetria de viveiros. Dados salvos 100% no seu aparelho, sem depender de internet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCliqueBiometria}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/40 hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Biometria</span>
            </button>

            <button
              onClick={handleCliqueAgua}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-950/40 hover:shadow-sky-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Droplets className="w-4 h-4" />
              <span>+ Qualidade Água</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid de Telemetria Zootécnica */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Biomassa Estimada */}
        <div className="bg-gradient-to-br from-white via-white to-emerald-50/50 border border-emerald-200/90 hover:border-emerald-400 card-hover-lift rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-lg hover:shadow-emerald-900/10 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Biomassa Estimada</span>
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-600/30 group-hover:scale-110 transition-transform">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight">
              {totalBiomassaKg > 1000 
                ? `${(totalBiomassaKg / 1000).toFixed(2)}`
                : `${totalBiomassaKg.toFixed(0)}`}{" "}
              <span className="text-xs sm:text-sm font-bold text-emerald-700">
                {totalBiomassaKg > 1000 ? "ton" : "kg"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Camarão em cultivo
            </div>
          </div>
        </div>

        {/* Card 2: Ração do Dia */}
        <div className="bg-gradient-to-br from-white via-white to-amber-50/50 border border-amber-200/90 hover:border-amber-400 card-hover-lift rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-lg hover:shadow-amber-900/10 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Ração Hoje (Prev.)</span>
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-600/30 group-hover:scale-110 transition-transform">
              <FeedTrayIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight">
              {totalRacaoHojeKg.toFixed(0)}{" "}
              <span className="text-xs sm:text-sm font-bold text-amber-700">kg/dia</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Soma de todos os viveiros
            </div>
          </div>
        </div>

        {/* Card 3: Peso Médio Geral */}
        <div className="bg-gradient-to-br from-white via-white to-sky-50/50 border border-sky-200/90 hover:border-sky-400 card-hover-lift rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-lg hover:shadow-sky-900/10 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Peso Médio Geral</span>
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-600/30 group-hover:scale-110 transition-transform">
              <ShrimpIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight">
              {pesoMedioGeral}{" "}
              <span className="text-xs sm:text-sm font-bold text-sky-700">g</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Últimas biometrias
            </div>
          </div>
        </div>

        {/* Card 4: Viveiros em Produção */}
        <div className="bg-gradient-to-br from-white via-white to-teal-50/50 border border-teal-200/90 hover:border-teal-400 card-hover-lift rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-lg hover:shadow-teal-900/10 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Viveiros Ativos</span>
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-sm shadow-teal-600/30 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight">
              {viveirosAtivos.length}{" "}
              <span className="text-xs sm:text-sm font-bold text-slate-500">
                / {viveiros.length}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Viveiros cadastrados
            </div>
          </div>
        </div>
      </div>

      {/* Atalhos Rápidos: Mercado / Vendedores e Probióticos de Solo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div 
          onClick={() => onNavigate("mercado")}
          className="bg-white border border-slate-200 hover:border-emerald-500/50 card-hover-lift rounded-2xl p-4 shadow-2xs cursor-pointer transition-all flex items-start justify-between gap-3 group"
        >
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">
              Guia Comercial
            </span>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              Representantes Locais por Estado
            </h4>
            <p className="text-xs text-slate-600 line-clamp-2">
              Contatos de WhatsApp de vendedores de rações (ADM, Guabi, AquaNutri), probióticos e corretivos.
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 flex-shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
            <Store className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate("calculadoras")}
          className="bg-white border border-slate-200 hover:border-amber-500/50 card-hover-lift rounded-2xl p-4 shadow-2xs cursor-pointer transition-all flex items-start justify-between gap-3 group"
        >
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">
              Manejo do Fundo
            </span>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
              Biorremediação & Probióticos de Solo
            </h4>
            <p className="text-xs text-slate-600 line-clamp-2">
              Calcule doses de Bacillus e protocolo de ativação com melaço para combater lodo negro e H2S.
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700 flex-shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-all">
            <Sprout className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Alertas Críticos (se houver) */}
      {alertas.length > 0 && (
        <div className="bg-white border border-amber-600/30 rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Atenção nos Viveiros ({alertas.length})</span>
          </div>
          <div className="space-y-2">
            {alertas.slice(0, 6).map((a, i) => (
              <div
                key={i}
                className={`text-xs p-2.5 rounded-xl flex items-start justify-between gap-2 ${
                  a.tipo === "danger"
                    ? "bg-rose-50 text-rose-700 border border-rose-100"
                    : "bg-amber-50 text-amber-700 border border-amber-100"
                }`}
              >
                <div className="min-w-0">
                  <div>
                    <span className="font-bold underline mr-1.5">{a.viveiro}:</span>
                    {a.mensagem}
                  </div>
                  {a.detalhe && <p className="mt-0.5 text-[11px] opacity-80">{a.detalhe}</p>}
                </div>
                <button
                  onClick={() => onNavigate("agua")}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-900 font-medium text-[11px] flex-shrink-0"
                >
                  Ver Água
                </button>
              </div>
            ))}
            {alertas.length > 6 && (
              <p className="text-[11px] text-slate-600">
                + {alertas.length - 6} alerta(s) em outros viveiros. Abra a aba Água para o detalhe.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status dos Viveiros */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            Viveiros em Produção
          </h3>
          <button
            onClick={() => onNavigate("viveiros")}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-700 flex items-center gap-0.5"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {viveiros.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">Nenhum viveiro cadastrado</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Cadastre seu primeiro viveiro com a área, data de povoamento e quantidade de pós-larvas para automatizar os cálculos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={onOpenNewViveiro}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 active:scale-95 transition-all shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Cadastrar primeiro viveiro
              </button>
              {onCarregarExemplos && (
                <button
                  onClick={onCarregarExemplos}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold active:scale-95 transition-all border border-slate-200"
                >
                  Carregar dados de exemplo
                </button>
              )}
            </div>
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
                  className="bg-white border border-slate-200 hover:border-emerald-500/50 card-hover-lift transition-all rounded-2xl p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{v.nome}</span>
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
                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        <span>Área: {(v.areaM2 / 10000).toFixed(2)} ha ({v.areaM2.toLocaleString()} m²)</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-700">
                          <Calendar className="w-3 h-3 text-slate-600" />
                          DOC: <b>{doc} dias</b>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resumo Rápido da Biometria e Água */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200 text-center">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-600 uppercase">Peso Atual</div>
                      <div className="text-sm font-semibold text-emerald-700 mt-0.5">
                        {bio ? `${bio.pesoMedioG} g` : "Sem bio"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-600 uppercase">Biomassa</div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">
                        {bio?.biomassaKg ? `${Math.round(bio.biomassaKg)} kg` : "--"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-600 uppercase">Oxigênio</div>
                      <div className={`text-sm font-semibold mt-0.5 ${
                        !agua ? "text-slate-600" : (agua.oxigenio >= 4.0 ? "text-emerald-700" : "text-rose-700")
                      }`}>
                        {agua ? `${agua.oxigenio} mg/L` : "--"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-600 text-[11px]">
                      {bio ? `Última biometria: ${bio.data}` : "Nenhuma biometria ainda"}
                    </span>
                    <button
                      onClick={() => onNavigate("calculadoras")}
                      className="text-emerald-700 font-semibold hover:text-emerald-700 flex items-center gap-1"
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

      {/* Modal de Aviso de Viveiro Obrigatório */}
      <ModalAvisoViveiroObrigatorio
        isOpen={modalAvisoAberto}
        tipo={tipoAviso}
        onClose={() => setModalAvisoAberto(false)}
        onCadastrarViveiro={() => {
          setModalAvisoAberto(false);
          onIniciarCadastroComIntencao?.(tipoAviso);
        }}
        onCarregarExemplos={onCarregarExemplos ? async () => {
          setModalAvisoAberto(false);
          await onCarregarExemplos();
        } : null}
      />
    </div>
  );
}
