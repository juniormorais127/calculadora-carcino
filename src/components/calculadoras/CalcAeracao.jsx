import React, { useState, useEffect } from "react";
import { Wind } from "lucide-react";
import { dimensionarAeracao } from "../../services/agroService.js";
import { TIPOS_AERADOR } from "../../data/carcinoData.js";
import {
  CampoNumero,
  CampoSelect,
  TituloEntrada,
  FaixaAutomatica,
  CartaoResultado,
  CartaoSaida,
  DicaTecnica
} from "./CalculadoraUI.jsx";

export default function CalcAeracao({ viveiroAtual }) {
  const [areaM2, setAreaM2] = useState(10000);
  const [densidadeM2, setDensidadeM2] = useState(12);
  const [tipoAerador, setTipoAerador] = useState(TIPOS_AERADOR[0].tipo);

  useEffect(() => {
    if (viveiroAtual?.areaM2) setAreaM2(Number(viveiroAtual.areaM2));
    if (viveiroAtual?.densidadePovoamento) setDensidadeM2(Number(viveiroAtual.densidadePovoamento));
  }, [viveiroAtual?.id]);

  const resultado = dimensionarAeracao({ areaM2, densidadeM2, tipoAerador });
  const aeradorSelecionado = TIPOS_AERADOR.find(t => t.tipo === tipoAerador) || TIPOS_AERADOR[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-4">
        <TituloEntrada icone={Wind} titulo="Estrutura do viveiro" cor="indigo" auto={viveiroAtual ? "Auto (do Viveiro)" : null} />

        {viveiroAtual && (
          <FaixaAutomatica
            cor="indigo"
            rotulo={`${viveiroAtual.nome}:`}
            itens={[
              { rotulo: "Área", valor: `${((Number(viveiroAtual.areaM2) || 0) / 10000).toFixed(2)} ha` },
              { rotulo: "Densidade de povoamento", valor: `${viveiroAtual.densidadePovoamento || 0} cam/m²` },
              { rotulo: "Volume", valor: `${(Number(viveiroAtual.volumeM3) || 0).toLocaleString("pt-BR")} m³` },
              { rotulo: "Profundidade", valor: `${viveiroAtual.profundidadeM || 0} m` }
            ]}
          />
        )}

        <div className="space-y-3.5">
          <CampoNumero label="Área do viveiro" valor={areaM2} onChange={setAreaM2} step="100" sufixo="m²" cor="indigo" ajuda={`${(areaM2 / 10000).toFixed(2)} hectares`} />
          <CampoNumero
            label="Densidade de povoamento"
            valor={densidadeM2}
            onChange={setDensidadeM2}
            step="0.5"
            sufixo="cam/m²"
            cor="indigo"
            ajuda="Densidade define o sistema e a demanda de aeração."
          />
          <CampoSelect
            label="Tipo de aerador"
            valor={tipoAerador}
            onChange={setTipoAerador}
            cor="indigo"
            opcoes={TIPOS_AERADOR.map(t => ({ valor: t.tipo, rotulo: t.tipo }))}
            ajuda={aeradorSelecionado.observacao}
          />
        </div>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <CartaoSaida titulo="Dimensionamento de aeração" cor="indigo">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CartaoResultado
              titulo="Potência por hectare"
              valor={resultado.hpPorHaMin === resultado.hpPorHaMax ? resultado.hpPorHaMin : `${resultado.hpPorHaMin} a ${resultado.hpPorHaMax}`}
              unidade="HP/ha"
              cor="indigo"
              detalhe={`Sistema identificado: ${resultado.sistema || "—"}`}
            />
            <CartaoResultado
              titulo="Potência total do viveiro"
              valor={resultado.hpTotalMin === resultado.hpTotalMax ? resultado.hpTotalMin : `${resultado.hpTotalMin} a ${resultado.hpTotalMax}`}
              unidade="HP"
              cor="cyan"
              detalhe={resultado.faixaDensidade ? `Faixa do sistema: ${resultado.faixaDensidade}` : undefined}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-indigo-500/20">
              <div className="text-xs text-slate-400 font-medium">Regime de operação</div>
              <div className="text-lg font-black text-white mt-1">{resultado.regimeAeracao || "—"}</div>
            </div>
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-indigo-500/20">
              <div className="text-xs text-slate-400 font-medium">Produtividade esperada do sistema</div>
              <div className="text-sm font-black text-white mt-1">{resultado.produtividadeKgHaCiclo || "—"}</div>
            </div>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200 space-y-1">
            <div className="font-bold text-indigo-300">Manejo recomendado:</div>
            <p>{resultado.observacao}</p>
          </div>
        </CartaoSaida>

        <DicaTecnica
          cor="indigo"
          titulo="Aeração é o teto da densidade."
          texto="A tabela usada é a da Cartilha de IMNV (ABCCam): até 30 camarões/m² pedem apenas 2 a 4 HP/ha, mas 100/m² exigem 26 HP/ha e 150/m² chegam a 40 HP/ha, com aeração 24 h/dia. Difusores entregam o mesmo oxigênio com cerca de um terço da potência dos aeradores de pás, ao custo de tubulação e soprador."
        />
      </div>
    </div>
  );
}
