import React, { useState, useEffect } from "react";
import { Leaf } from "lucide-react";
import { calcularManejoBFT, getRacaoFaseCompleta } from "../../services/agroService.js";
import { calculateDailyFeed } from "../../services/calculatorService.js";
import { FONTES_CARBONO_BFT, TABELA_ALIMENTACAO_VANNAMEI } from "../../data/carcinoData.js";
import {
  CampoNumero,
  CampoSelect,
  TituloEntrada,
  FaixaAutomatica,
  CartaoResultado,
  CartaoSaida,
  PainelInterno,
  DicaTecnica
} from "./CalculadoraUI.jsx";

/** Média dos valores de uma faixa textual como "32 a 35%". */
function mediaDaFaixa(texto, padrao) {
  const numeros = String(texto || "").match(/\d+(?:[.,]\d+)?/g);
  if (!numeros || numeros.length === 0) return padrao;
  const valores = numeros.map(n => Number(n.replace(",", ".")));
  return Math.round(valores.reduce((soma, v) => soma + v, 0) / valores.length);
}

const OPCOES_CN = [
  { valor: 10, rotulo: "10:1 — bioflocos já mantidos" },
  { valor: 12.5, rotulo: "12,5:1 — fertilização inicial (ABCC)" },
  { valor: 15, rotulo: "15:1 — Avnimelech (1999)" },
  { valor: 20, rotulo: "20:1 — máxima remoção de nitrogênio" }
];

export default function CalcBioflocos({ viveiroAtual, bioAtual, aguaAtual }) {
  const [racaoDiariaKg, setRacaoDiariaKg] = useState(60);
  const [proteinaBrutaPercent, setProteinaBrutaPercent] = useState(35);
  const [alvoCN, setAlvoCN] = useState(12.5);
  const [fonteCarbono, setFonteCarbono] = useState(FONTES_CARBONO_BFT[0].fonte);

  // Sugere a ração diária a partir da biometria e da última análise de água
  useEffect(() => {
    if (!bioAtual?.biomassaKg || !bioAtual?.pesoMedioG) return;
    const racao = calculateDailyFeed({
      biomassaKg: Number(bioAtual.biomassaKg),
      pesoMedioG: Number(bioAtual.pesoMedioG),
      temperaturaC: Number(aguaAtual?.temperatura) || 29,
      oxigenioMgL: Number(aguaAtual?.oxigenio) || 5
    });
    if (racao.racaoFinalKg > 0) setRacaoDiariaKg(racao.racaoFinalKg);

    const fase = getRacaoFaseCompleta(Number(bioAtual.pesoMedioG), TABELA_ALIMENTACAO_VANNAMEI);
    setProteinaBrutaPercent(mediaDaFaixa(fase.proteinaBrutaPercent, 35));
  }, [bioAtual?.id, aguaAtual?.id]);

  const resultado = calcularManejoBFT({ racaoDiariaKg, proteinaBrutaPercent, alvoCN, fonteCarbono });
  const fonte = FONTES_CARBONO_BFT.find(f => f.fonte === fonteCarbono) || FONTES_CARBONO_BFT[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <TituloEntrada icone={Leaf} titulo="Bioflocos / troca zero" cor="teal" auto={bioAtual ? "Auto (do Viveiro)" : null} />

        {(bioAtual || aguaAtual) && (
          <FaixaAutomatica
            cor="teal"
            rotulo="Ração diária sugerida pelo cálculo zootécnico:"
            itens={[
              { rotulo: "Biomassa", valor: `${bioAtual?.biomassaKg || 0} kg` },
              { rotulo: "Peso médio", valor: `${bioAtual?.pesoMedioG || 0} g` },
              { rotulo: "Temperatura", valor: `${aguaAtual?.temperatura ?? "—"} °C` },
              { rotulo: "Oxigênio", valor: `${aguaAtual?.oxigenio ?? "—"} mg/L` }
            ]}
          />
        )}

        <div className="space-y-3.5">
          <CampoNumero
            label="Ração ofertada por dia (kg)"
            valor={racaoDiariaKg}
            onChange={setRacaoDiariaKg}
            step="1"
            cor="teal"
            ajuda="Pode ajustar sobre a sugestão automática."
          />
          <CampoNumero
            label="Proteína bruta da ração (%)"
            valor={proteinaBrutaPercent}
            onChange={setProteinaBrutaPercent}
            step="0.5"
            cor="teal"
            ajuda="A ração é a principal fonte de nitrogênio do sistema."
          />
          <CampoSelect
            label="Relação C:N alvo"
            valor={alvoCN}
            onChange={(v) => setAlvoCN(Number(v))}
            opcoes={OPCOES_CN}
            cor="teal"
          />
          <CampoSelect
            label="Fonte de carbono"
            valor={fonteCarbono}
            onChange={setFonteCarbono}
            opcoes={FONTES_CARBONO_BFT.map(f => ({ valor: f.fonte, rotulo: `${f.fonte} (${f.carbonoPercent}% C)` }))}
            cor="teal"
            ajuda={fonte.observacao}
          />
        </div>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <CartaoSaida titulo="Demanda diária de carbono" cor="teal">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CartaoResultado
              titulo={`${fonte.fonte} por dia`}
              valor={resultado.fonteNecessariaKgDia || "0"}
              unidade="kg/dia"
              cor="teal"
              detalhe={
                resultado.percentualDaRacao > 0
                  ? `Equivale a ${resultado.percentualDaRacao}% da ração ofertada`
                  : "A ração já cobre o alvo de C:N"
              }
            />
            <CartaoResultado
              titulo="Nitrogênio entrando por dia"
              valor={resultado.nitrogenioKgDia}
              unidade="kg N/dia"
              cor="cyan"
              detalhe={`C:N da ração: ${resultado.relacaoCNRacao}:1 · necessário para o alvo: ${resultado.carbonoNecessarioKgDia} kg C/dia`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 p-3 rounded-2xl border border-teal-500/20">
              <div className="text-[11px] text-slate-600 font-medium">Carbono da ração</div>
              <div className="text-lg font-semibold text-slate-900">{resultado.carbonoRacaoKgDia} kg/dia</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-teal-500/20">
              <div className="text-[11px] text-slate-600 font-medium">Carbono faltante</div>
              <div className="text-lg font-semibold text-teal-700">{resultado.carbonoFaltanteKgDia} kg/dia</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-teal-500/20">
              <div className="text-[11px] text-slate-600 font-medium">Bicarbonato (sistema nitrificante)</div>
              <div className="text-lg font-semibold text-slate-900">{resultado.bicarbonatoKgDia} kg/dia</div>
            </div>
          </div>

          <PainelInterno titulo="Como aplicar:" cor="teal">
            <p>{resultado.observacao}</p>
            {resultado.conferenciaPratica && (
              <p className="text-[11px] text-slate-600">
                Conferência de campo ({resultado.conferenciaPratica.referencia}): cerca de{" "}
                <b>{resultado.conferenciaPratica.valorKgDia} kg/dia</b> para esta oferta de ração.
              </p>
            )}
          </PainelInterno>

          <details className="bg-slate-50 rounded-2xl border border-slate-200 p-3">
            <summary className="text-[11px] font-bold text-slate-700 cursor-pointer">
              Premissas do cálculo
            </summary>
            <ul className="mt-2 space-y-1 text-[11px] text-slate-600 list-disc list-inside">
              {resultado.premissas.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </details>
        </CartaoSaida>

        <DicaTecnica
          cor="teal"
          titulo="Carbono derruba oxigênio."
          texto="Aplicar sempre fracionado ao longo do dia, com aeração ligada e pela manhã. Ao aparecer nitrato, reduza a fonte de carbono aos poucos até parar: o sistema passou de heterotrófico para nitrificante e o bicarbonato passa a ser o insumo crítico (0,25 kg por kg de ração)."
        />
      </div>
    </div>
  );
}
