import React, { useState, useEffect } from "react";
import { Scale } from "lucide-react";
import { classificarCalibreMercado, projetarDespesca, calcularFCA, calcularCustoProducao } from "../../services/agroService.js";
import {
  CampoNumero,
  TituloEntrada,
  FaixaAutomatica,
  CartaoResultado,
  CartaoSaida,
  PainelInterno,
  ListaAvisos,
  DicaTecnica,
  LinhaIndicador
} from "./CalculadoraUI.jsx";

const DIAS_MS = 86400000;

/**
 * Ganho de peso diário observado: usa o intervalo entre a primeira e a última
 * biometria do viveiro; sem histórico, cai na média desde o povoamento.
 */
function gpdObservado(biometriasDoViveiro, pesoAtual, diasCultivo) {
  const ordenadas = [...biometriasDoViveiro].sort((a, b) => new Date(a.data) - new Date(b.data));
  if (ordenadas.length >= 2) {
    const primeira = ordenadas[0];
    const ultima = ordenadas[ordenadas.length - 1];
    const dias = (new Date(ultima.data) - new Date(primeira.data)) / DIAS_MS;
    if (dias > 0 && Number(ultima.pesoMedioG) > Number(primeira.pesoMedioG)) {
      return (Number(ultima.pesoMedioG) - Number(primeira.pesoMedioG)) / dias;
    }
  }
  if (Number(diasCultivo) > 0 && Number(pesoAtual) > 0) return Number(pesoAtual) / Number(diasCultivo);
  return 0;
}

export default function CalcCalibre({ viveiroAtual, bioAtual, biometriasDoViveiro = [] }) {
  const [pesoMedio, setPesoMedio] = useState(11.9);
  const [pesoAlvo, setPesoAlvo] = useState(14);
  const [racaoAcumulada, setRacaoAcumulada] = useState(0);
  const [precoRacao, setPrecoRacao] = useState(0);
  const [outrosCustos, setOutrosCustos] = useState(0);
  const [biomassaFinal, setBiomassaFinal] = useState(0);

  // Alimenta os campos com o que já existe no banco local
  useEffect(() => {
    if (bioAtual?.pesoMedioG) setPesoMedio(Number(bioAtual.pesoMedioG));
    if (bioAtual?.biomassaKg) setBiomassaFinal(Number(bioAtual.biomassaKg));
  }, [bioAtual?.id, viveiroAtual?.id]);

  const diasCultivo = viveiroAtual?.dataPovoamento
    ? Math.max(0, Math.round((Date.now() - new Date(viveiroAtual.dataPovoamento).getTime()) / DIAS_MS))
    : 0;

  const calibre = classificarCalibreMercado(pesoMedio);
  const gpd = gpdObservado(biometriasDoViveiro, pesoMedio, diasCultivo);
  const projecao = projetarDespesca({ pesoAtualG: pesoMedio, pesoAlvoG: pesoAlvo, gpdObservadoG: gpd });
  const fca = calcularFCA({ racaoAcumuladaKg: racaoAcumulada, biomassaFinalKg: biomassaFinal });
  const custo = calcularCustoProducao({
    racaoConsumidaKg: racaoAcumulada,
    precoRacaoKg: precoRacao,
    outrosCustos,
    biomassaProduzidaKg: biomassaFinal
  });

  const corProjecao = projecao.diasEstimados === 0 ? "cyan" : projecao.diasEstimados <= 21 ? "emerald" : "amber";
  const avisos = racaoAcumulada > 0 && biomassaFinal <= 0
    ? ["Informe a biomassa final para o FCA e o custo por kg fazerem sentido."]
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <TituloEntrada icone={Scale} titulo="Dados do lote" cor="lime" auto={bioAtual ? "Auto (do Viveiro)" : null} />

        {bioAtual && (
          <FaixaAutomatica
            cor="lime"
            rotulo={`Biometria de ${new Date(bioAtual.data).toLocaleDateString("pt-BR")}:`}
            itens={[
              { rotulo: "Peso médio", valor: `${bioAtual.pesoMedioG} g` },
              { rotulo: "Biomassa", valor: `${bioAtual.biomassaKg} kg` },
              { rotulo: "Dias de cultivo", valor: diasCultivo },
              { rotulo: "GPD observado", valor: `${gpd.toFixed(3)} g/dia` }
            ]}
          />
        )}

        <div className="space-y-3.5">
          <CampoNumero
            label="1. Peso médio atual (g)"
            valor={pesoMedio}
            onChange={setPesoMedio}
            step="0.1"
            cor="lime"
            ajuda={calibre.encontrado ? `Classificado como calibre ${calibre.calibre}.` : calibre.classe}
          />
          <CampoNumero
            label="2. Peso que o comprador pede (g)"
            valor={pesoAlvo}
            onChange={setPesoAlvo}
            step="0.5"
            cor="lime"
            ajuda="13 a 15 g caem no calibre 31/35 ou 26/30, os mais valorizados."
          />
          <div className="grid grid-cols-2 gap-3">
            <CampoNumero
              label="Ração acumulada (kg)"
              valor={racaoAcumulada}
              onChange={setRacaoAcumulada}
              cor="lime"
              ajuda="Total ofertado no ciclo"
            />
            <CampoNumero
              label="Preço da ração (R$/kg)"
              valor={precoRacao}
              onChange={setPrecoRacao}
              step="0.1"
              cor="lime"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CampoNumero
              label="Outros custos (R$)"
              valor={outrosCustos}
              onChange={setOutrosCustos}
              step="100"
              cor="lime"
              ajuda="PLs, energia, mão de obra"
            />
            <CampoNumero
              label="Biomassa final (kg)"
              valor={biomassaFinal}
              onChange={setBiomassaFinal}
              cor="lime"
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <CartaoSaida titulo="Classificação comercial e projeção de despesca" cor="lime">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CartaoResultado
              titulo="Calibre comercial (HOSO)"
              valor={calibre.encontrado ? calibre.calibre : "—"}
              cor={calibre.encontrado ? "lime" : "amber"}
              detalhe={
                calibre.encontrado
                  ? `${calibre.unPorKg} un/kg · faixa de ${calibre.pesoMinG} a ${calibre.pesoMaxG} g`
                  : calibre.observacao
              }
            />
            <CartaoResultado
              titulo="Dias até o peso alvo"
              valor={projecao.diasEstimados || null}
              unidade={projecao.diasEstimados ? "dias" : ""}
              cor={corProjecao}
              detalhe={
                projecao.diasEstimados
                  ? `Faltam ${projecao.faltaG} g a ${projecao.gpdConsiderado} g/dia`
                  : projecao.observacao
              }
            />
          </div>

          <PainelInterno titulo="Destino do calibre:" cor="lime">
            <p>{calibre.destino || "—"}</p>
            {calibre.observacao && <p className="text-[11px] text-slate-600">{calibre.observacao}</p>}
          </PainelInterno>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CartaoResultado
              titulo="Conversão alimentar (FCA)"
              valor={fca.fca || null}
              unidade={fca.fca ? "kg/kg" : ""}
              cor={fca.cor === "slate" ? "cyan" : fca.cor}
              detalhe={fca.orientacao}
            />
            <CartaoResultado
              titulo="Custo por kg produzido"
              valor={custo.custoPorKg ? custo.custoPorKg.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : null}
              cor="amber"
              detalhe={
                custo.custoTotal > 0
                  ? `Ração representa ${custo.participacaoRacaoPercent}% do custo total`
                  : "Informe a ração e os custos do ciclo"
              }
            />
          </div>

          {fca.fca > 0 && (
            <LinhaIndicador
              nome="FCA do ciclo"
              valor={fca.fca}
              unidade="kg/kg"
              status={fca.status}
              cor={fca.cor}
              observacao={`Meta: até ${fca.meta.bom} para o sistema`}
            />
          )}

          <ListaAvisos avisos={avisos} />
        </CartaoSaida>

        <DicaTecnica
          cor="lime"
          titulo="Quanto mais tempo o lote fica no viveiro, maior o FCA."
          texto="No estudo comercial brasileiro de referência, cada quilo de camarão exigiu entre 1,2 e 1,25 kg de ração. Quando o crescimento entra em platô, a ração consumida continua subindo e a conversão piora: é o sinal clássico de que a despesca já deveria ter acontecido."
        />
      </div>
    </div>
  );
}
