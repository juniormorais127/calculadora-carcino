import React, { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { avaliarCrescimento, avaliarIndicesZootecnicos } from "../../services/agroService.js";
import { calculateStocking } from "../../services/calculatorService.js";
import {
  CampoNumero,
  TituloEntrada,
  FaixaAutomatica,
  CartaoResultado,
  CartaoSaida,
  PainelInterno,
  DicaTecnica,
  LinhaIndicador
} from "./CalculadoraUI.jsx";

const DIAS_MS = 86400000;

export default function CalcCrescimento({ viveiroAtual, bioAtual }) {
  const [pesoMedio, setPesoMedio] = useState(11.9);
  const [diasCultivo, setDiasCultivo] = useState(63);
  const [sobrevivencia, setSobrevivencia] = useState(75);
  const [fca, setFca] = useState(1.4);
  const [pesoAlvo, setPesoAlvo] = useState(14);

  useEffect(() => {
    if (bioAtual?.pesoMedioG) setPesoMedio(Number(bioAtual.pesoMedioG));
    if (bioAtual?.sobrevivenciaEstimada) setSobrevivencia(Number(bioAtual.sobrevivenciaEstimada));
    if (viveiroAtual?.dataPovoamento) {
      setDiasCultivo(Math.max(0, Math.round((Date.now() - new Date(viveiroAtual.dataPovoamento).getTime()) / DIAS_MS)));
    }
  }, [bioAtual?.id, viveiroAtual?.id]);

  const crescimento = avaliarCrescimento({ pesoMedioG: pesoMedio, diasCultivo });

  const areaHa = viveiroAtual?.areaM2 ? Number(viveiroAtual.areaM2) / 10000 : 0;
  const produtividadeAtual = areaHa > 0 && bioAtual?.biomassaKg ? Number(bioAtual.biomassaKg) / areaHa : 0;

  // Produtividade que o viveiro deveria entregar com a densidade e a sobrevivência reais
  const esperado = viveiroAtual?.densidadePovoamento
    ? calculateStocking({
        areaM2: Number(viveiroAtual.areaM2) || 0,
        densidadeAlvoM2: Number(viveiroAtual.densidadePovoamento) || 0,
        pesoFinalAlvoG: pesoAlvo,
        sobrevivenciaEsperadaPercent: sobrevivencia
      })
    : null;

  const metaProdutividade = esperado?.produtividadeKgHa
    ? {
        otimo: Math.round(esperado.produtividadeKgHa * 0.9),
        bom: Math.round(esperado.produtividadeKgHa * 0.7),
        atencao: Math.round(esperado.produtividadeKgHa * 0.5),
        observacao: `Esperado para ${viveiroAtual.densidadePovoamento} cam/m² com ${sobrevivencia}% de sobrevivência e ${pesoAlvo} g: ${esperado.produtividadeKgHa} kg/ha/ciclo.`
      }
    : undefined;

  const indices = avaliarIndicesZootecnicos(
    {
      sobrevivenciaPercent: sobrevivencia,
      fca,
      gpdG: crescimento.gpdRealG,
      produtividadeKgHaCiclo: produtividadeAtual,
      pesoDespescaG: pesoMedio
    },
    metaProdutividade ? { produtividadeKgHaCiclo: metaProdutividade } : {}
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <TituloEntrada icone={TrendingUp} titulo="Desempenho do lote" cor="emerald" auto={bioAtual ? "Auto (do Viveiro)" : null} />

        {viveiroAtual && (
          <FaixaAutomatica
            cor="emerald"
            rotulo={`Cultivo em ${viveiroAtual.nome}:`}
            itens={[
              { rotulo: "Dias de cultivo", valor: diasCultivo },
              { rotulo: "Biomassa atual", valor: `${bioAtual?.biomassaKg || 0} kg` },
              { rotulo: "Área", valor: `${((Number(viveiroAtual.areaM2) || 0) / 10000).toFixed(2)} ha` },
              { rotulo: "Densidade", valor: `${viveiroAtual.densidadePovoamento || 0} cam/m²` }
            ]}
          />
        )}

        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <CampoNumero label="Peso médio (g)" valor={pesoMedio} onChange={setPesoMedio} step="0.1" cor="emerald" />
            <CampoNumero label="Dias de cultivo" valor={diasCultivo} onChange={setDiasCultivo} cor="emerald" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CampoNumero label="Sobrevivência (%)" valor={sobrevivencia} onChange={setSobrevivencia} cor="emerald" />
            <CampoNumero label="FCA do ciclo" valor={fca} onChange={setFca} step="0.05" cor="emerald" />
          </div>
          <CampoNumero
            label="Peso alvo na despesca (g)"
            valor={pesoAlvo}
            onChange={setPesoAlvo}
            step="0.5"
            cor="emerald"
            ajuda="Usado para calcular a produtividade que o viveiro deveria atingir."
          />
        </div>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <CartaoSaida titulo="Comparação com a curva de crescimento de referência" cor="emerald">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CartaoResultado
              titulo={`Semana ${crescimento.semana} — peso esperado`}
              valor={crescimento.pesoEsperadoG}
              unidade="g"
              cor="cyan"
              detalhe={`Lote está com ${crescimento.percentualDoEsperado}% do esperado para a semana`}
            />
            <CartaoResultado
              titulo="Ganho de peso diário real"
              valor={crescimento.gpdRealG}
              unidade="g/dia"
              cor={crescimento.cor === "slate" ? "cyan" : crescimento.cor === "orange" ? "amber" : crescimento.cor}
              selo={crescimento.status}
              detalhe={`Referência da curva: ${crescimento.gpdEsperadoG} g/dia`}
            />
          </div>

          <PainelInterno titulo="Diagnóstico do crescimento:">
            <p>{crescimento.orientacao}</p>
          </PainelInterno>

          {produtividadeAtual > 0 && (
            <p className="text-[11px] text-slate-600">
              Biomassa atual equivale a <b className="text-slate-900">{produtividadeAtual.toFixed(0)} kg/ha</b>
              {esperado?.produtividadeKgHa ? ` — esperado para este viveiro: ${esperado.produtividadeKgHa} kg/ha/ciclo.` : "."}
            </p>
          )}
        </CartaoSaida>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Índices zootécnicos do ciclo
          </h4>
          {indices.length === 0 ? (
            <p className="text-xs text-slate-600">Informe os dados do lote para avaliar os índices.</p>
          ) : (
            <div className="space-y-2">
              {indices.map((i) => (
                <LinhaIndicador
                  key={i.indice}
                  nome={i.nome}
                  valor={i.valor}
                  unidade={i.unidade}
                  status={i.status}
                  cor={i.cor}
                  observacao={i.observacao}
                />
              ))}
            </div>
          )}
        </div>

        <DicaTecnica
          cor="emerald"
          titulo="Referência da curva:"
          texto="a curva usada aqui é de manejo semi-intensivo tropical. Na literatura brasileira, um lote normal cresce de 0,6 a 0,8 g por semana no início e de 1,5 a 2,5 g por semana no meio do ciclo. Semanas com ganho zero costumam indicar pico de muda, oxigênio baixo à noite ou ração mal ajustada."
        />
      </div>
    </div>
  );
}
