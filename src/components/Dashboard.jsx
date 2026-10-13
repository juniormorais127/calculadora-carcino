import React, { useState } from "react";
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
  Fish,
  Store,
  Sprout,
  Megaphone,
  FileText
} from "lucide-react";
import BannerPatrocinador from "./BannerPatrocinador.jsx";
import ModalAvisoViveiroObrigatorio from "./ModalAvisoViveiroObrigatorio.jsx";
import { gerarRelatorioFazendaPdf } from "../services/relatorioPdfService.js";

export default function Dashboard({ 
  viveiros = [], 
  biometrias = [], 
  qualidadeAgua = [], 
  farmProfile,
  onFeedback,
  onNavigate,
  onOpenNewBiometria,
  onOpenNewAgua,
  onOpenNewViveiro,
  onIniciarCadastroComIntencao,
  onCarregarExemplos
}) {
  const [modalAvisoAberto, setModalAvisoAberto] = useState(false);
  const [tipoAviso, setTipoAviso] = useState("biometria");

  const handleExportarPdf = () => {
    try {
      gerarRelatorioFazendaPdf({
        farmProfile,
        viveiros,
        biometrias,
        qualidadeAgua,
        baixar: true
      });
      onFeedback?.({
        tipo: "sucesso",
        texto: "Relatório da fazenda em PDF gerado com sucesso! O download foi iniciado."
      });
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Não foi possível gerar o PDF: " + err.message);
    }
  };

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
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Sua produção, em um só lugar
            </span>
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
              Visão geral
            </h2>
            <p className="text-sm text-slate-700 mt-1 max-w-xl">
              Acompanhe viveiros, crescimento e qualidade da água. Seus registros ficam salvos com segurança no seu aparelho.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCliqueBiometria}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Biometria</span>
            </button>

            <button
              onClick={handleCliqueAgua}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Droplets className="w-4 h-4" />
              <span>+ Qualidade Água</span>
            </button>

            <button
              onClick={handleExportarPdf}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm shadow-sm transition-all active:scale-95 border border-slate-200 cursor-pointer"
              title="Salvar relatório técnico da fazenda em PDF"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Salvar em PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Patrocinadores e Fabricantes Homologados */}
      <BannerPatrocinador onNavigateMercado={() => onNavigate("mercado")} />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Viveiros Ativos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Viveiros Ativos</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-slate-900">{viveirosAtivos.length}</div>
            <div className="text-xs text-slate-600 mt-0.5">
              de {viveiros.length} cadastrados
            </div>
          </div>
        </div>

        {/* Card 2: Biomassa Total */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Biomassa Estimada</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-700">
              <Weight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-slate-900">
              {totalBiomassaKg > 1000 
                ? `${(totalBiomassaKg / 1000).toFixed(2)} ton`
                : `${totalBiomassaKg.toFixed(0)} kg`}
            </div>
            <div className="text-xs text-teal-700 font-medium mt-0.5">
              Camarão em cultivo
            </div>
          </div>
        </div>

        {/* Card 3: Ração Diária Prevista */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Ração Hoje (Prev.)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-slate-900">
              {totalRacaoHojeKg.toFixed(0)} <span className="text-sm font-semibold text-slate-600">kg/dia</span>
            </div>
            <div className="text-xs text-amber-700 font-medium mt-0.5">
              Soma de todos os viveiros
            </div>
          </div>
        </div>

        {/* Card 4: Peso Médio */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Peso Médio Geral</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-700">
              <Fish className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-slate-900">
              {pesoMedioGeral} <span className="text-sm font-semibold text-slate-600">g</span>
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Últimas biometrias
            </div>
          </div>
        </div>
      </div>

      {/* Atalhos Rápidos: Mercado / Vendedores e Probióticos de Solo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div 
          onClick={() => onNavigate("mercado")}
          className="bg-white border border-slate-200 hover:border-emerald-500/50 rounded-2xl p-4 shadow-2xs cursor-pointer transition-all flex items-start justify-between gap-3 group"
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
          className="bg-white border border-slate-200 hover:border-amber-500/50 rounded-2xl p-4 shadow-2xs cursor-pointer transition-all flex items-start justify-between gap-3 group"
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
            {alertas.map((a, i) => (
              <div 
                key={i} 
                className={`text-xs p-2.5 rounded-xl flex items-center justify-between ${
                  a.tipo === "danger" 
                    ? "bg-rose-50 text-rose-700 border border-rose-100" 
                    : "bg-amber-50 text-amber-700 border border-amber-100"
                }`}
              >
                <div>
                  <span className="font-bold underline mr-1.5">{a.viveiro}:</span>
                  {a.mensagem}
                </div>
                <button 
                  onClick={() => onNavigate("agua")}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-900 font-medium text-[11px]"
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
                  className="bg-white border border-slate-200 hover:border-emerald-600/50 transition-all rounded-2xl p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{v.nome}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          v.status === "ativo" 
                            ? "bg-emerald-500/20 text-emerald-700 border border-emerald-500/30" 
                    : "bg-slate-100 text-slate-700"
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-3 mt-1">
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
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
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
