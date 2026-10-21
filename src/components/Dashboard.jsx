import React, { useState } from "react";
import ProductionTasks from "./ProductionTasks.jsx";
import GrowthOverview from "./GrowthOverview.jsx";
import { useAccount } from "./AccountProvider.jsx";
import { 
  Layers, 
  Scale, 
  AlertTriangle, 
  PlusCircle, 
  Droplets,
  Calendar,
  ChevronRight
} from "lucide-react";
import { ShrimpGroupIcon, FeedPelletsIcon, EarthenPondIcon } from "./icons/CustomAquacultureIcons.jsx";
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
  const { access } = useAccount();
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
      <section className="production-heading flex flex-wrap items-end justify-between gap-4 pt-5">
        <div><h2 className="text-3xl font-bold tracking-tight text-slate-900">Olá, {access?.fullName?.split(' ')[0] || 'produtor'}</h2><p className="mt-2 text-base text-emerald-900">Minha produção · {viveirosAtivos.length} viveiro(s) ativo(s)</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={handleCliqueBiometria} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900"><PlusCircle className="size-5"/>Registrar biometria</button><button onClick={handleCliqueAgua} className="flex min-h-12 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-800"><Droplets className="size-5"/>Registrar água</button></div>
      </section>

      {/* KPI Grid de Telemetria Zootécnica */}
      <div className="production-metrics grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Biomassa Estimada */}
        <div className="bg-white border border-emerald-200/90 hover:border-emerald-400 card-hover-lift rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-lg hover:shadow-emerald-900/10 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Biomassa Estimada</span>
            <div className="p-2.5 rounded-2xl bg-emerald-800 text-white shadow-sm shadow-emerald-600/30 group-hover:scale-110 transition-transform">
              <ShrimpGroupIcon className="w-5 h-5 -m-0.5" />
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
        <div className="bg-white border border-amber-200/90 hover:border-amber-400 card-hover-lift rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-lg hover:shadow-amber-900/10 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Ração Hoje (Prev.)</span>
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-950 text-white shadow-sm shadow-amber-600/30 group-hover:scale-110 transition-transform">
              <FeedPelletsIcon className="w-5 h-5 -m-0.5" />
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
        <div className="bg-white border border-sky-200/90 hover:border-sky-400 card-hover-lift rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-lg hover:shadow-sky-900/10 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Peso Médio Geral</span>
            <div className="p-2.5 rounded-2xl bg-blue-700 text-white shadow-sm shadow-sky-600/30 group-hover:scale-110 transition-transform">
              <Scale className="w-5 h-5 -m-0.5" />
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
        <div className="bg-white border border-teal-200/90 hover:border-teal-400 card-hover-lift rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-lg hover:shadow-teal-900/10 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Viveiros Ativos</span>
            <div className="p-2.5 rounded-2xl bg-emerald-800 text-white shadow-sm shadow-teal-600/30 group-hover:scale-110 transition-transform">
              <EarthenPondIcon className="w-5 h-5 -m-0.5" />
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
      <ProductionTasks onNavigate={onNavigate} />

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
                        <span>Área: {v.areaM2 == null ? 'não informada' : <>{(v.areaM2 / 10000).toFixed(2)} ha ({Number(v.areaM2).toLocaleString()} m²)</>}</span>
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

      <GrowthOverview viveiros={viveiros} biometrias={biometrias} />
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
