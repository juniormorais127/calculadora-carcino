import React, { useState, useEffect } from "react";
import { Atom } from "lucide-react";
import { calcularBalancoIonico } from "../../services/agroService.js";
import {
  CampoNumero,
  TituloEntrada,
  FaixaAutomatica,
  CartaoSaida,
  ListaAvisos,
  DicaTecnica,
  LinhaIndicador
} from "./CalculadoraUI.jsx";

// Fator de diluição da água do mar para o sódio (PARAMETROS_BALANCO_IONICO)
const FATOR_SODIO = 304.5;

export default function CalcIonico({ viveiroAtual, aguaAtual }) {
  const [volumeM3, setVolumeM3] = useState(12000);
  const [salinidade, setSalinidade] = useState(4);
  const [calcio, setCalcio] = useState(30);
  const [magnesio, setMagnesio] = useState(25);
  const [potassio, setPotassio] = useState(12);
  const [sodio, setSodio] = useState(Math.round(4 * FATOR_SODIO));
  const [estimarSodio, setEstimarSodio] = useState(true);

  useEffect(() => {
    if (viveiroAtual?.volumeM3) setVolumeM3(Number(viveiroAtual.volumeM3));
  }, [viveiroAtual?.id]);

  useEffect(() => {
    if (aguaAtual?.salinidade) {
      const s = Number(aguaAtual.salinidade);
      setSalinidade(s);
      setSodio(Math.round(s * FATOR_SODIO));
    }
  }, [aguaAtual?.id]);

  const sodioEfetivo = estimarSodio ? Math.round(salinidade * FATOR_SODIO) : sodio;

  const resultado = calcularBalancoIonico({
    volumeM3,
    calcio,
    magnesio,
    potassio,
    sodio: sodioEfetivo,
    salinidadePpt: salinidade
  });

  const ions = [
    { chave: "potassio", rotulo: "Potássio (K+)" },
    { chave: "calcio", rotulo: "Cálcio (Ca2+)" },
    { chave: "magnesio", rotulo: "Magnésio (Mg2+)" },
    { chave: "sodio", rotulo: "Sódio (Na+)" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-4">
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
              onChange={(v) => {
                setSalinidade(v);
                if (estimarSodio) setSodio(Math.round(v * FATOR_SODIO));
              }}
              step="0.5"
              sufixo="ppt"
              cor="cyan"
              ajuda="Define automaticamente o alvo de cada íon."
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <CampoNumero label="Cálcio" valor={calcio} onChange={setCalcio} step="0.1" sufixo="mg/L" cor="cyan" />
            <CampoNumero label="Magnésio" valor={magnesio} onChange={setMagnesio} step="0.1" sufixo="mg/L" cor="cyan" />
            <CampoNumero label="Potássio" valor={potassio} onChange={setPotassio} step="0.1" sufixo="mg/L" cor="cyan" />
          </div>

          <div>
            <CampoNumero
              label="Sódio (mg/L)"
              valor={sodioEfetivo}
              onChange={setSodio}
              disabled={estimarSodio}
              sufixo="mg/L"
              cor="cyan"
              ajuda={estimarSodio ? "Estimado pela salinidade (salinidade × 304,5)." : "Valor medido na análise de água."}
            />
            <label className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={estimarSodio}
                onChange={(e) => setEstimarSodio(e.target.checked)}
                className="accent-cyan-500"
              />
              Estimar o sódio pela salinidade (não corrigir Na direto)
            </label>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Os valores de Ca, Mg e K vêm da análise laboratorial da água. O alvo ideal é o
            maior valor entre a água do mar diluída na sua salinidade e o piso prático de manejo.
          </p>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <CartaoSaida titulo="Alvos calculados e correção necessária" cor="cyan">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(resultado.relacoes
              ? [resultado.relacoes.naK, resultado.relacoes.mgCa, resultado.relacoes.caK]
              : []
            ).map((r) => (
              <div key={r.nome} className="bg-slate-950/70 p-3 rounded-2xl border border-cyan-500/20">
                <div className="text-[11px] text-slate-400 font-medium">{r.nome}</div>
                <div className="text-2xl font-black text-white mt-1">
                  {r.valor || "—"}
                  <span className="text-xs text-slate-400 font-bold"> :1 (alvo {r.alvo})</span>
                </div>
                <span
                  className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                    r.cor === "emerald"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : r.cor === "amber"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-slate-700/40 text-slate-300 border-slate-600"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {ions.map(({ chave, rotulo }) => {
              const ion = resultado.ions[chave];
              if (!ion) return null;
              const deficit = ion.deficit || 0;
              return (
                <div key={chave} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-white">{rotulo}</div>
                    <div className="text-[11px] text-slate-400">
                      Alvo {ion.alvo} mg/L (água do mar diluída: {ion.sec || 0} · piso: {ion.minimoPratico ?? "—"})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-white">{ion.atual} mg/L</div>
                    <div className={`text-[11px] font-bold ${deficit > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      {deficit > 0 ? `faltam ${deficit} mg/L` : "dentro do alvo"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <ListaAvisos avisos={resultado.alertas} cor="amber" />
        </CartaoSaida>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            Produtos e doses para {volumeM3.toLocaleString("pt-BR")} m³
          </h4>
          {resultado.produtos.length === 0 ? (
            <p className="text-xs text-emerald-300 font-semibold">
              Nenhum corretivo necessário: o perfil iônico está dentro dos alvos calculados.
            </p>
          ) : (
            <div className="space-y-2">
              {resultado.produtos.map((p) => (
                <div key={`${p.produto}-${p.elemento}`} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">{p.produto}</div>
                    <div className="text-[11px] text-slate-400">
                      {p.formula} · repõe {p.deficitMgL} mg/L de {p.elemento}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-black text-cyan-400">{p.doseKg.toLocaleString("pt-BR")} kg</div>
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-slate-400">
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
