import React, { useState, useEffect, useRef } from "react";
import {
  LifeBuoy,
  X,
  Paperclip,
  Trash2,
  MessageCircle,
  Mail,
  Copy,
  Check,
  AlertTriangle,
  Bug,
  Lightbulb,
  HelpCircle,
  MessageSquare
} from "lucide-react";
import { createPortal } from "react-dom";
import { CONTATO_SUPORTE, TIPOS_RETORNO, LIMITE_ANEXOS, TAMANHO_MAX_ANEXO_MB, TIPOS_ARQUIVO_ACEITOS } from "../data/contatoSuporte.js";
import {
  canalConfigurado,
  validarAnexo,
  formatarTamanho,
  montarMensagemSuporte,
  montarAssunto,
  linkWhatsApp,
  linkEmail,
  montarContexto,
  versaoDoApp
} from "../services/suporteService.js";

const ICONES_TIPO = {
  problema: Bug,
  sugestao: Lightbulb,
  duvida: HelpCircle,
  outro: MessageSquare
};

/**
 * Botão de ajuda do topo do app: abre o formulário de sugestão/problema,
 * permite anexar imagens e documentos e entrega o relato por WhatsApp ou e-mail.
 * O app não tem servidor, então o envio é a abertura da conversa com o texto
 * pronto — os arquivos são anexados pelo próprio produtor na conversa.
 */
export default function AjudaSuporte({ telaAtual, resumoRegistros }) {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState("problema");
  const [descricao, setDescricao] = useState("");
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [anexos, setAnexos] = useState([]);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [verContexto, setVerContexto] = useState(false);

  const inputArquivoRef = useRef(null);
  const urlsCriadas = useRef([]);

  const canal = canalConfigurado();
  const contexto = montarContexto({ tela: telaAtual, registros: resumoRegistros });

  const fechar = () => setAberto(false);

  // Libera as miniaturas ao desmontar
  useEffect(() => () => {
    urlsCriadas.current.forEach(url => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    if (!aberto) return undefined;
    const scrollAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const aoTeclar = (e) => { if (e.key === "Escape") fechar(); };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = scrollAnterior;
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const adicionarAnexos = (lista) => {
    const novos = [];
    const erros = [];
    let considerados = [...anexos];

    Array.from(lista || []).forEach(arquivo => {
      const { ok, erro: motivo } = validarAnexo(arquivo, considerados);
      if (!ok) {
        erros.push(`${arquivo.name}: ${motivo}`);
        return;
      }
      const ehImagem = String(arquivo.type || "").startsWith("image/");
      const url = ehImagem ? URL.createObjectURL(arquivo) : null;
      if (url) urlsCriadas.current.push(url);

      const item = { id: `${arquivo.name}-${arquivo.size}-${novos.length}`, arquivo, url };
      novos.push(item);
      considerados = [...considerados, item];
    });

    if (novos.length > 0) setAnexos(atuais => [...atuais, ...novos]);
    setErro(erros.join(" "));
  };

  const removerAnexo = (id) => {
    setAnexos(atuais => {
      const alvo = atuais.find(a => a.id === id);
      if (alvo?.url) URL.revokeObjectURL(alvo.url);
      return atuais.filter(a => a.id !== id);
    });
  };

  const mensagem = montarMensagemSuporte({
    tipo,
    descricao,
    nome,
    contato,
    anexos: anexos.map(a => a.arquivo),
    contexto
  });

  const exigirDescricao = () => {
    if (descricao.trim().length > 0) return true;
    setErro("Escreva o que aconteceu (ou qual é a sugestão) antes de enviar.");
    return false;
  };

  const enviarWhatsApp = () => {
    if (!exigirDescricao()) return;
    const link = linkWhatsApp(mensagem);
    if (!link) {
      setErro("O WhatsApp de suporte ainda não foi configurado no app. Use “Copiar relato” e envie por onde preferir.");
      return;
    }
    setErro("");
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const enviarEmail = () => {
    if (!exigirDescricao()) return;
    const link = linkEmail(mensagem, montarAssunto(tipo, descricao));
    if (!link) {
      setErro("O e-mail de suporte ainda não foi configurado no app. Use “Copiar relato” e envie por onde preferir.");
      return;
    }
    setErro("");
    window.location.href = link;
  };

  const copiarRelato = async () => {
    if (!exigirDescricao()) return;
    try {
      await navigator.clipboard.writeText(mensagem);
      setErro("");
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErro("Não foi possível copiar automaticamente. Selecione o texto do relato e copie manualmente.");
    }
  };

  const itensContexto = [
    telaAtual ? `Tela: ${telaAtual}` : null,
    contexto.aparelho
      ? `Aparelho: ${contexto.aparelho.slice(0, 70)}${contexto.aparelho.length > 70 ? "…" : ""}`
      : null,
    resumoRegistros || null,
    `Versão: ${versaoDoApp()}`
  ].filter(Boolean);

  return (
    <>
      {/* Botão no topo do app, ao lado do selo de verificação */}
      <button
        type="button"
        onClick={() => { setAberto(true); setErro(""); }}
        aria-label="Ajuda e suporte"
        title="Ajuda: enviar sugestão ou relatar um problema"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 font-bold transition-all active:scale-95 shadow-xs"
      >
        <LifeBuoy className="w-4 h-4 text-emerald-400" />
        <span className="hidden sm:inline">Ajuda</span>
      </button>

      {aberto && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) fechar(); }}
        >
          <div className="min-h-full flex items-center justify-center py-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-ajuda"
              className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl relative my-auto animate-in zoom-in-95 duration-150"
            >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 id="titulo-ajuda" className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-emerald-700" />
                  Ajuda e suporte
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Mande uma sugestão, conte o que não está funcionando ou tire uma dúvida.
                  O relato abre pronto no WhatsApp ou no e-mail.
                </p>
              </div>
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar ajuda"
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!canal.algum && (
              <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-100 text-[11px] text-amber-700 mb-4">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  O canal de suporte ainda não foi configurado neste app. Você pode escrever o relato e usar
                  “Copiar relato” para enviar por onde preferir.
                </span>
              </div>
            )}

            {/* Tipo de retorno */}
            <fieldset className="mb-4">
              <legend className="text-xs font-bold text-slate-700 mb-2">O que você quer enviar?</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TIPOS_RETORNO.map(opcao => {
                  const Icone = ICONES_TIPO[opcao.id] || MessageSquare;
                  const ativo = tipo === opcao.id;
                  return (
                    <button
                      key={opcao.id}
                      type="button"
                      onClick={() => setTipo(opcao.id)}
                      aria-pressed={ativo}
                      className={`text-left p-3 rounded-2xl border transition-all ${
                        ativo
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-xs font-bold">
                        <Icone className={`w-4 h-4 ${ativo ? "text-emerald-700" : "text-slate-500"}`} />
                        {opcao.rotulo}
                      </span>
                      <span className="block text-[10px] text-slate-600 mt-1">{opcao.descricao}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Descrição */}
            <div className="mb-4">
              <label htmlFor="ajuda-descricao" className="text-xs font-bold text-slate-700 block mb-1">
                {tipo === "problema" ? "O que aconteceu?" : "Conte com detalhes:"}
              </label>
              <textarea
                id="ajuda-descricao"
                rows="4"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder={
                  tipo === "problema"
                    ? "Ex.: toquei em Salvar Medição e a tela ficou em branco. Estava na aba Água, com 2 viveiros cadastrados."
                    : "Ex.: seria útil ver o custo da ração por ciclo no painel."
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Anexos */}
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-700 block mb-1">Anexar imagem ou documento</span>
              <input
                ref={inputArquivoRef}
                type="file"
                multiple
                accept={TIPOS_ARQUIVO_ACEITOS}
                aria-label="Escolher arquivos para anexar"
                onChange={(e) => { adicionarAnexos(e.target.files); e.target.value = ""; }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => inputArquivoRef.current?.click()}
                disabled={anexos.length >= LIMITE_ANEXOS}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50 transition-colors"
              >
                <Paperclip className="w-4 h-4" />
                Escolher arquivo ({anexos.length}/{LIMITE_ANEXOS})
              </button>
              <p className="text-[10px] text-slate-500 mt-1">
                Até {LIMITE_ANEXOS} arquivos, {TAMANHO_MAX_ANEXO_MB} MB cada (foto, print, PDF, planilha).
                Eles ficam no seu aparelho: anexe na conversa que vai abrir.
              </p>

              {anexos.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {anexos.map(item => (
                    <li key={item.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      {item.url ? (
                        <img src={item.url} alt={item.arquivo.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                      ) : (
                        <span className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                          <Paperclip className="w-4 h-4 text-slate-500" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-semibold text-slate-800 truncate">{item.arquivo.name}</span>
                        <span className="block text-[10px] text-slate-500">{formatarTamanho(item.arquivo.size)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removerAnexo(item.id)}
                        aria-label={`Remover ${item.arquivo.name}`}
                        className="p-1.5 rounded-lg text-rose-700 hover:bg-white shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Contato de retorno (opcional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label htmlFor="ajuda-nome" className="text-xs font-bold text-slate-700 block mb-1">
                  Seu nome (opcional)
                </label>
                <input
                  id="ajuda-nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Como podemos te chamar"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ajuda-contato" className="text-xs font-bold text-slate-700 block mb-1">
                  WhatsApp ou e-mail (opcional)
                </label>
                <input
                  id="ajuda-contato"
                  type="text"
                  value={contato}
                  onChange={(e) => setContato(e.target.value)}
                  placeholder="Para retornarmos o contato"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Contexto automático */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setVerContexto(v => !v)}
                aria-expanded={verContexto}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline"
              >
                {verContexto ? "Ocultar" : "Ver"} o que vai junto no relato
              </button>
              {verContexto && (
                <ul className="mt-2 space-y-1 text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  {itensContexto.map(item => <li key={item}>• {item}</li>)}
                  <li className="pt-1 text-slate-500">
                    O texto acima é o relato completo: nada da sua fazenda vai além dele, e nada sai
                    sem você tocar em enviar.
                  </li>
                </ul>
              )}
            </div>

            {erro && (
              <p role="alert" className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-700">
                {erro}
              </p>
            )}

            {/* Ações */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={copiarRelato}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                {copiado ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                {copiado ? "Relato copiado" : "Copiar relato"}
              </button>
              <button
                type="button"
                onClick={enviarEmail}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                <Mail className="w-4 h-4" />
                Enviar por e-mail
              </button>
              <button
                type="button"
                onClick={enviarWhatsApp}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar no WhatsApp
              </button>
            </div>

            <p className="text-[10px] text-slate-500 mt-2 text-center sm:text-right">
              {CONTATO_SUPORTE.nomeEquipe} · {CONTATO_SUPORTE.horarioAtendimento}
            </p>
          </div>
        </div>
      </div>,
        document.body
      )}
    </>
  );
}
