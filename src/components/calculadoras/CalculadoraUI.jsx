import React from "react";
import { RefreshCw, AlertCircle, Info } from "lucide-react";

// Classes literais por cor: o Tailwind 4 faz varredura estática do código-fonte,
// então nada de montar classe por interpolação de string.
export const CORES = {
  emerald: {
    texto: "text-emerald-700",
    foco: "focus:border-emerald-500",
    bordaCard: "border-emerald-600/40",
    gradiente: "from-emerald-50 via-slate-50 to-slate-50",
    bordaTile: "border-emerald-500/20",
    badge: "bg-emerald-500/20 text-emerald-700 border-emerald-500/40",
    suave: "bg-emerald-50 border-emerald-100 text-emerald-700",
    aviso: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700"
  },
  cyan: {
    texto: "text-cyan-700",
    foco: "focus:border-cyan-500",
    bordaCard: "border-cyan-600/40",
    gradiente: "from-cyan-50 via-slate-50 to-slate-50",
    bordaTile: "border-cyan-500/20",
    badge: "bg-cyan-500/20 text-cyan-700 border-cyan-500/40",
    suave: "bg-cyan-50 border-cyan-100 text-cyan-700",
    aviso: "bg-cyan-500/15 border-cyan-500/30 text-cyan-700"
  },
  sky: {
    texto: "text-sky-700",
    foco: "focus:border-sky-500",
    bordaCard: "border-sky-600/40",
    gradiente: "from-sky-50 via-slate-50 to-slate-50",
    bordaTile: "border-sky-500/20",
    badge: "bg-sky-500/20 text-sky-700 border-sky-500/40",
    suave: "bg-sky-50 border-sky-100 text-sky-700",
    aviso: "bg-sky-500/15 border-sky-500/30 text-sky-700"
  },
  teal: {
    texto: "text-teal-700",
    foco: "focus:border-teal-500",
    bordaCard: "border-teal-600/40",
    gradiente: "from-teal-50 via-slate-50 to-slate-50",
    bordaTile: "border-teal-500/20",
    badge: "bg-teal-500/20 text-teal-700 border-teal-500/40",
    suave: "bg-teal-50 border-teal-100 text-teal-700",
    aviso: "bg-teal-500/15 border-teal-500/30 text-teal-700"
  },
  amber: {
    texto: "text-amber-700",
    foco: "focus:border-amber-500",
    bordaCard: "border-amber-600/40",
    gradiente: "from-amber-50 via-slate-50 to-slate-50",
    bordaTile: "border-amber-500/20",
    badge: "bg-amber-500/20 text-amber-700 border-amber-500/40",
    suave: "bg-amber-50 border-amber-100 text-amber-700",
    aviso: "bg-amber-500/15 border-amber-500/30 text-amber-700"
  },
  rose: {
    texto: "text-rose-700",
    foco: "focus:border-rose-500",
    bordaCard: "border-rose-600/40",
    gradiente: "from-rose-50 via-slate-50 to-slate-50",
    bordaTile: "border-rose-500/20",
    badge: "bg-rose-500/20 text-rose-700 border-rose-500/40",
    suave: "bg-rose-50 border-rose-100 text-rose-700",
    aviso: "bg-rose-500/15 border-rose-500/30 text-rose-700"
  },
  indigo: {
    texto: "text-indigo-700",
    foco: "focus:border-indigo-500",
    bordaCard: "border-indigo-600/40",
    gradiente: "from-indigo-50 via-slate-50 to-slate-50",
    bordaTile: "border-indigo-500/20",
    badge: "bg-indigo-500/20 text-indigo-700 border-indigo-500/40",
    suave: "bg-indigo-50 border-indigo-100 text-indigo-700",
    aviso: "bg-indigo-500/15 border-indigo-500/30 text-indigo-700"
  },
  lime: {
    texto: "text-lime-700",
    foco: "focus:border-lime-500",
    bordaCard: "border-lime-600/40",
    gradiente: "from-lime-50 via-slate-50 to-slate-50",
    bordaTile: "border-lime-500/20",
    badge: "bg-lime-500/20 text-lime-700 border-lime-500/40",
    suave: "bg-lime-50 border-lime-100 text-lime-700",
    aviso: "bg-lime-500/15 border-lime-500/30 text-lime-700"
  },
  violet: {
    texto: "text-violet-700",
    foco: "focus:border-violet-500",
    bordaCard: "border-violet-600/40",
    gradiente: "from-violet-50 via-slate-50 to-slate-50",
    bordaTile: "border-violet-500/20",
    badge: "bg-violet-500/20 text-violet-700 border-violet-500/40",
    suave: "bg-violet-50 border-violet-100 text-violet-700",
    aviso: "bg-violet-500/15 border-violet-500/30 text-violet-700"
  }
};

// Cores de status devolvidas pelos serviços -> famílias da paleta
const CORES_STATUS = {
  emerald: "emerald",
  amber: "amber",
  orange: "amber",
  yellow: "amber",
  rose: "rose",
  slate: "cyan"
};

// Status vindo dos serviços (emerald/amber/rose/slate...) -> entrada de CORES
function corDoStatus(cor) {
  return CORES[CORES_STATUS[cor] || "emerald"];
}

// Aceita tanto um nome de paleta quanto um status de serviço
function corDaPaleta(cor) {
  return CORES[CORES_STATUS[cor] || cor] || CORES.emerald;
}

/** Campo numérico com controles táteis (- / +) otimizados para celular, rótulo, ajuda e sufixo. */
export function CampoNumero({ label, valor, onChange, step = "1", min = "0", disabled = false, ajuda, sufixo, cor = "emerald" }) {
  const c = corDaPaleta(cor);
  const stepNum = parseFloat(step) || 1;

  const decrementar = () => {
    if (disabled) return;
    const minVal = parseFloat(min) || 0;
    const atual = Number(valor || 0);
    const novo = Math.max(minVal, Number((atual - stepNum).toFixed(2)));
    onChange(novo);
  };

  const incrementar = () => {
    if (disabled) return;
    const atual = Number(valor || 0);
    const novo = Number((atual + stepNum).toFixed(2));
    onChange(novo);
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange("");
      return;
    }
    // Remove qualquer 0 à esquerda se o usuário digitar outros dígitos depois (ex: "05" -> "5", "007" -> "7", mas mantém "0" e "0.5")
    const limpo = raw.replace(/^0+(?=\d)/, "");
    onChange(limpo);
  };

  return (
    <div>
      <label className="text-xs font-bold text-slate-700 block mb-1.5">{label}</label>
      <div className="flex items-center gap-1.5 min-w-0">
        <button
          type="button"
          disabled={disabled}
          onClick={decrementar}
          aria-label={`Diminuir ${label}`}
          className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 font-black text-lg flex items-center justify-center shadow-xs active:scale-95 transition-all disabled:opacity-40 select-none"
        >
          -
        </button>
        <div className="relative flex-1 min-w-0">
          <input
            type="number"
            step={step}
            min={min}
            disabled={disabled}
            value={valor ?? ""}
            onFocus={(e) => e.target.select()}
            onChange={handleInputChange}
            className={`w-full min-w-0 bg-white border border-slate-200 rounded-2xl px-2 sm:px-3.5 py-2.5 text-slate-900 font-extrabold text-base text-center shadow-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none disabled:opacity-60 ${sufixo ? "pr-10 sm:pr-12" : ""} ${c.foco}`}
          />
          {sufixo && (
            <span className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-bold text-slate-400 pointer-events-none">
              {sufixo}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={incrementar}
          aria-label={`Aumentar ${label}`}
          className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 font-black text-lg flex items-center justify-center shadow-xs active:scale-95 transition-all disabled:opacity-40 select-none"
        >
          +
        </button>
      </div>
      {ajuda && <p className="text-[11px] text-slate-500 mt-1">{ajuda}</p>}
    </div>
  );
}

/** Campo de seleção com rótulo e ajuda. */
export function CampoSelect({ label, valor, onChange, opcoes, ajuda, cor = "emerald" }) {
  const c = corDaPaleta(cor);
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700 block mb-1">{label}</label>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-semibold text-xs focus:outline-none ${c.foco}`}
      >
        {opcoes.map((o) => (
          <option key={String(o.valor)} value={o.valor}>{o.rotulo}</option>
        ))}
      </select>
      {ajuda && <p className="text-[11px] text-slate-600 mt-0.5">{ajuda}</p>}
    </div>
  );
}

/** Cabeçalho do card de entrada, com o selo de dados automáticos do viveiro. */
export function TituloEntrada({ icone: Icone, titulo, cor = "emerald", auto }) {
  const c = corDaPaleta(cor);
  return (
    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
        <Icone className={`w-5 h-5 ${c.texto}`} />
        {titulo}
      </h3>
      {auto && (
        <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border flex items-center gap-1 whitespace-nowrap ${c.badge}`}>
          <RefreshCw className="w-3 h-3" />
          {auto}
        </span>
      )}
    </div>
  );
}

/** Faixa que mostra quais dados vieram automaticamente do viveiro. */
export function FaixaAutomatica({ cor = "emerald", rotulo, itens = [] }) {
  const c = corDaPaleta(cor);
  return (
    <div className={`rounded-2xl p-3 text-xs border ${c.suave}`}>
      <span className="font-bold block truncate">{rotulo}</span>
      {itens.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2 text-[11px] text-slate-700">
          {itens.map((i) => (
            <div key={i.rotulo} className="truncate">{i.rotulo}: <b>{i.valor}</b></div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Card de resultado com valor grande, unidade, rodapé explicativo e selo opcional. */
export function CartaoResultado({ titulo, valor, unidade, detalhe, cor = "emerald", selo, rodape }) {
  const c = corDaPaleta(cor);
  return (
    <div className={`bg-slate-50 p-4 rounded-2xl border ${c.bordaTile}`}>
      <div className="text-xs text-slate-600 font-medium">{titulo}</div>
      {valor ? (
        <div className={`text-3xl font-semibold mt-1 ${c.texto}`}>
          {valor} {unidade && <span className="text-base text-slate-900 font-bold">{unidade}</span>}
        </div>
      ) : (
        <div className="text-lg font-semibold mt-1 text-slate-400">sem dados ainda</div>
      )}
      {selo && <div className={`text-[11px] font-black mt-0.5 ${c.texto}`}>{selo}</div>}
      {detalhe && <div className="text-[11px] text-slate-600 mt-1">{detalhe}</div>}
      {rodape}
    </div>
  );
}

/** Card de saída (resultados) com cabeçalho colorido. */
export function CartaoSaida({ titulo, cor = "emerald", children }) {
  const c = corDaPaleta(cor);
  return (
    <div className={`bg-gradient-to-br ${c.gradiente} border ${c.bordaCard} rounded-3xl p-6 shadow-sm space-y-4`}>
      <span className={`text-xs font-bold uppercase tracking-wider ${c.texto}`}>{titulo}</span>
      {children}
    </div>
  );
}

/** Painel interno de texto (diagnóstico, manejo, destino comercial). */
export function PainelInterno({ titulo, cor = "emerald", children }) {
  const c = corDaPaleta(cor);
  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
      <div className={`font-bold ${c.texto}`}>{titulo}</div>
      {children}
    </div>
  );
}

/** Selo de status (Ideal, Atenção, Crítico...). */
export function BadgeStatus({ status, cor = "emerald" }) {
  const c = corDoStatus(cor);
  return (
    <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border font-bold ${c.badge}`}>
      {status}
    </span>
  );
}

// Gravidade do aviso (vem do serviço) -> famílias da paleta. Diferente de
// CORES_STATUS, aqui o rótulo descreve a urgência do recado, não uma medição.
const CORES_TIPO_AVISO = {
  critico: "rose",
  alerta: "amber",
  sucesso: "emerald",
  info: "cyan"
};

/**
 * Lista de avisos de manejo.
 * Aceita tanto texto puro (calculatorService, agroService, CalcCalibre) quanto o
 * objeto { tipo, texto } do probioticoService — o tipo, quando existe, define a cor
 * do aviso; caso contrário vale a cor base do cartão.
 */
export function ListaAvisos({ avisos = [], cor = "amber" }) {
  if (avisos.length === 0) return null;
  return (
    <div className="space-y-2">
      {avisos.map((aviso, idx) => {
        const texto = typeof aviso === "string" ? aviso : (aviso?.texto ?? "");
        const c = corDaPaleta(CORES_TIPO_AVISO[aviso?.tipo] || cor);
        return (
          <div key={idx} className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs ${c.aviso}`}>
            <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.texto}`} />
            <span>{texto}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DicaTecnica({ texto, titulo, cor = "emerald" }) {
  const c = corDaPaleta(cor);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 flex items-start gap-3">
      <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.texto}`} />
      <div>
        <span className="font-bold text-slate-900">{titulo}</span> {texto}
      </div>
    </div>
  );
}

/** Linha de indicador com selo de status (índices zootécnicos e relações). */
export function LinhaIndicador({ nome, valor, unidade, status, cor, observacao }) {
  const c = corDoStatus(cor);
  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
      <div className="min-w-0">
        <div className="text-xs font-bold text-slate-900">{nome}</div>
        {observacao && <div className="text-[11px] text-slate-600 mt-0.5">{observacao}</div>}
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-semibold text-slate-900">
          {valor} <span className="text-[11px] text-slate-500 font-semibold">{unidade}</span>
        </div>
        <BadgeStatus status={status} cor={cor} />
      </div>
    </div>
  );
}

/** Linha simples de leitura (usada nas listas de produtos e de íons). */
export function LinhaLeitura({ titulo, subtitulo, valor, valorDetalhe, cor = "emerald" }) {
  const c = corDaPaleta(cor);
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
      <div className="min-w-0">
        <div className="text-xs font-bold text-slate-900">{titulo}</div>
        {subtitulo && <div className="text-[11px] text-slate-600 mt-0.5">{subtitulo}</div>}
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`text-base font-semibold ${c.texto}`}>{valor}</div>
        {valorDetalhe && <div className="text-[11px] font-bold text-slate-600">{valorDetalhe}</div>}
      </div>
    </div>
  );
}
