import React, { useState, useEffect } from "react";
import { Atom } from "lucide-react";
import { calcularBalancoIonico, calcularAlvosIonicosPorSalinidade } from "../../services/agroService.js";
import {
  CampoNumero,
  TituloEntrada,
  FaixaAutomatica,
  CartaoSaida,
  ListaAvisos,
  DicaTecnica,
  LinhaLeitura,
  BadgeStatus
} from "./CalculadoraUI.jsx";

const ROTULOS_IONS = [
  { chave: "potassio", rotulo: "Potássio (K+)" },
  { chave: "calcio", rotulo: "Cálcio (Ca2+)" },
  { chave: "magnesio", rotulo: "Magnésio (Mg2+)" },
  { chave: "sodio", rotulo: "Sódio (Na+)" }
];

export default function CalcIonico({ viveiroAtual, aguaAtual }) {
  const [volumeM3, setVolumeM3] = useState(12000);
  const [salinidade, setSalinidade] = useState(4);
  const [estimarPelaSalinidade, setEstimarPelaSalinidade] = useState(true);
  // Valores de laboratório (usados quando a estimativa pela salinidade está desligada)
  const [calcio, setCalcio] = useState(46);
  const [magnesio, setMagnesio] = useState(156);
  const [potassio, setPotassio] = useState(43);
  const [sodio, setSodio] = useState(1218);

  useEffect(() => {
    if (viveiroAtual?.volumeM3) setVolumeM3(Number(viveiroAtual.volumeM3));
  }, [viveiroAtual?.id]);

  useEffect(() => {
    if (aguaAtual?.salinidade) setSalinidade(Number(aguaAtual.salinidade));
  }, [aguaAtual?.id]);

  // Alvo de cada íon na água do mar diluída na salinidade informada
  const alvos = calcularAlvosIonicosPorSalinidade(salinidade).alvos;
  const derivado = (chave) => Number(alvos[chave]?.alvo) || 0;

  const calcioEfetivo = estimarPelaSalinidade ? derivado("calcio") : calcio;
  const magnesioEfetivo = estimarPelaSalinidade ? derivado("magnesio") : magnesio;
  const potassioEfetivo = estimarPelaSalinidade ? derivado("potassio") : potassio;
  const sodioEfetivo = estimarPelaSalinidade ? derivado("sodio") : sodio;

  // Ao sair do modo estimado, os campos começam preenchidos com o perfil esperado
  const alternarEstimativa = (ativar) => {
    if (!ativar) {
      setCalcio(derivado("calcio"));
      setMagnesio(derivado("magnesio"));
      setPotassio(derivado("potassio"));
      setSodio(derivado("sodio"));
    }
    setEstimarPelaSalinidade(ativar);
  };

  const resultado = calcularBalancoIonico({
    volumeM3,
    calcio: calcioEfetivo,
    magnesio: magnesioEfetivo,
    potassio: potassioEfetivo,
    sodio: sodioEfetivo,
    salinidadePpt: salinidade
  });

  const relacoes = [resultado.relacoes.naK, resultado.relacoes.mgCa, resultado.relacoes.caK];
  const ajuda = estimarPelaSalinidade
    ? "Estimado pela água do mar diluída nesta salinidade."
    : "Valor da análise laboratorial.";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <TituloEntrada icone={Atom} titulo="Perfil iônico da água" cor="cyan" auto={aguaAtual ? "Auto (do Viveiro)" : null} />

        {aguaAtual && (
          <FaixaAutomatica
            cor="cyan"
            rotulo="Última análise de água registrada:"
            itens={[
              { rotulo: "Salinidade", valor: `${aguaAtual.salinidade ?? "—"} ppt` },
              { rotulo: "Alcalinidade", valor: `${aguaAtual.alcalinidade ?? "—"} mg/L` },
              { rotulo: "pH", valor: aguaAtual.ph ?? "—" },
              { rotulo: "Data", valor: new Date(aguaAtual.data).toLocaleDateString("pt-BR") }
            ]}
          />
        )}

        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <CampoNumero label="Volume do viveiro" valor={volumeM3} onChange={setVolumeM3} sufixo="m³" cor="cyan" />
            <CampoNumero
              label="Salinidade"
              valor={salinidade}
              onChange={setSalinidade}
              step="0.5"
              sufixo="ppt"
              cor="cyan"
              ajuda="Define automaticamente o alvo de cada íon."
            />
          </div>

          <label className="flex items-start gap-2 text-[11px] font-semibold text-slate-700 bg-cyan-50 border border-cyan-100 rounded-xl p-3">
            <input
              type="checkbox"
              checked={estimarPelaSalinidade}
              onChange={(e) => alternarEstimativa(e.target.checked)}
              className="accent-cyan-600 mt-0.5"
            />
            <span>
              Ainda não tenho a análise iônica: estimar Ca, Mg, K e Na pela salinidade.
              <span className="block font-normal text-slate-600 mt-0.5">
                Desmarque para digitar os valores do laboratório — o cálculo só é confiável com os números reais.
              </span>
            </span>
          </label>

          {/* Unidade no rótulo: nas três colunas o sufixo dentro do campo cortaria o número */}
          <div className="grid grid-cols-3 gap-3">
            <CampoNumero label="Cálcio (mg/L)" valor={calcioEfetivo} onChange={setCalcio} disabled={estimarPelaSalinidade} step="0.1" cor="cyan" ajuda={ajuda} />
            <CampoNumero label="Magnésio (mg/L)" valor={magnesioEfetivo} onChange={setMagnesio} disabled={estimarPelaSalinidade} step="0.1" cor="cyan" />
            <CampoNumero label="Potássio (mg/L)" valor={potassioEfetivo} onChange={setPotassio} disabled={estimarPelaSalinidade} step="0.1" cor="cyan" />
          </div>

          <CampoNumero
            label="Sódio (mg/L)"
            valor={sodioEfetivo}
            onChange={setSodio}
            disabled={estimarPelaSalinidade}
            sufixo="mg/L"
            cor="cyan"
            ajuda="O sódio não se corrige direto: ele é consequência da salinidade e da renovação."
          />

          <p className="text-[11px] text-slate-600 leading-relaxed">
            O alvo de cada íon é o maior valor entre a água do mar diluída na sua salinidade e o
            piso prático de manejo (K 50, Mg 100, Ca 30 mg/L).
          </p>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <CartaoSaida titulo="Alvos calculados e correção necessária" cor="cyan">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {relacoes.map((r) => (
              <div key={r.nome} className="bg-slate-50 p-3 rounded-2xl border border-cyan-500/20">
                <div className="text-[11px] text-slate-600 font-medium">{r.nome}</div>
                <div className="text-2xl font-semibold text-slate-900 mt-1">
                  {r.valor || "—"}
                  <span className="text-xs text-slate-600 font-bold"> :1 (alvo {r.alvo})</span>
                </div>
                <BadgeStatus status={r.status} cor={r.cor} />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {ROTULOS_IONS.map(({ chave, rotulo }) => {
              const ion = resultado.ions[chave];
              if (!ion) return null;
              const deficit = ion.deficit || 0;
              return (
                <LinhaLeitura
                  key={chave}
                  titulo={rotulo}
                  subtitulo={`Alvo ${ion.alvo} mg/L (água do mar diluída: ${ion.sec || 0} · piso: ${ion.minimoPratico ?? "—"})`}
                  valor={`${ion.atual} mg/L`}
                  valorDetalhe={deficit > 0 ? `faltam ${deficit} mg/L` : "dentro do alvo"}
                  cor={deficit > 0 ? "amber" : "emerald"}
                />
              );
            })}
          </div>

          <ListaAvisos avisos={resultado.alertas} cor="amber" />
        </CartaoSaida>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Produtos e doses para {volumeM3.toLocaleString("pt-BR")} m³
          </h4>
          {resultado.produtos.length === 0 ? (
            <p className="text-xs font-semibold text-emerald-700">
              Nenhum corretivo necessário: o perfil iônico está dentro dos alvos calculados.
            </p>
          ) : (
            <div className="space-y-2">
              {resultado.produtos.map((p) => (
                <LinhaLeitura
                  key={`${p.produto}-${p.elemento}`}
                  titulo={p.produto}
                  subtitulo={`${p.formula} · repõe ${p.deficitMgL} mg/L de ${p.elemento}`}
                  valor={`${p.doseKg.toLocaleString("pt-BR")} kg`}
                  cor="cyan"
                />
              ))}
              <p className="text-[11px] text-slate-600">
                Dose = [déficit (mg/L) × volume (m³)] ÷ [1000 × fração do elemento no produto].
                Confirme o teor real no rótulo antes de aplicar.
              </p>
            </div>
          )}
        </div>

        <DicaTecnica
          cor="cyan"
          titulo="Em água de baixa salinidade, as relações importam mais que os valores absolutos."
          texto="Na:K próximo de 28:1 e Mg:Ca entre 2,5:1 e 3,4:1. Águas de poço são tipicamente pobres em K e Mg, e essa deficiência pesa mais na sobrevivência do que a salinidade em si. Corrija durante o enchimento, antes de povoar."
        />
      </div>
    </div>
  );
}
