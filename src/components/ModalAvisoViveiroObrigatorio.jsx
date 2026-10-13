import React from "react";
import { 
  Layers, 
  TrendingUp, 
  Droplets, 
  PlusCircle, 
  ArrowRight, 
  Database, 
  X, 
  Info,
  CheckCircle2
} from "lucide-react";

export default function ModalAvisoViveiroObrigatorio({
  isOpen,
  tipo = "biometria",
  onClose,
  onCadastrarViveiro,
  onCarregarExemplos
}) {
  if (!isOpen) return null;

  const isBiometria = tipo === "biometria";
  const nomeTipo = isBiometria ? "Biometria" : "Qualidade da Água";
  const iconeCor = isBiometria 
    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" 
    : "bg-cyan-500/10 text-cyan-700 border-cyan-500/30";

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="aviso-viveiro-titulo"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Botão fechar */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header com Ícone e Título */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className={`p-3 rounded-2xl border ${iconeCor} flex-shrink-0`}>
            {isBiometria ? (
              <TrendingUp className="w-6 h-6" />
            ) : (
              <Droplets className="w-6 h-6" />
            )}
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-800 border border-amber-500/30">
              <Info className="w-3 h-3" />
              Etapa Inicial Necessária
            </span>
            <h3 id="aviso-viveiro-titulo" className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              Cadastre um Viveiro para Lançar {nomeTipo}
            </h3>
          </div>
        </div>

        {/* Explicação Didática */}
        <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Para registrar dados de <strong className="text-slate-900 font-semibold">{nomeTipo}</strong>, sua fazenda precisa ter pelo menos um viveiro ativo cadastrado.
          </p>
          <p className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700">
            <strong>Por que isso é necessário?</strong> Toda taxa de arraçoamento, ganho de peso diário, biomassa total e balanço de oxigênio dependem das dimensões (área em m², profundidade e camarões estocados) do viveiro.
          </p>
        </div>

        {/* Guia em 2 Passos */}
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
            Fluxo Automático em 2 Passos:
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-700">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </span>
            <span>
              <strong>Cadastrar o viveiro:</strong> informe o nome, tamanho e data de povoamento.
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-700">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-300">
              2
            </span>
            <span>
              <strong>Preenchimento automático:</strong> assim que você salvar o viveiro, o sistema abrirá <em>imediatamente</em> a tela para você digitar a sua {nomeTipo}!
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 space-y-2.5">
          <button
            onClick={onCadastrarViveiro}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar Viveiro Agora</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onCarregarExemplos && (
            <button
              onClick={onCarregarExemplos}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-slate-200"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Carregar Fazenda com Dados de Exemplo (Demonstração)</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
