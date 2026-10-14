// Montagem do relato de suporte: validação de anexos, texto da mensagem e os
// links de WhatsApp/e-mail.
//
// O app é local-first e NÃO tem servidor, então não existe envio automático:
// o relato é montado aqui e entregue pelo canal que o produtor escolher
// (WhatsApp ou e-mail). Os arquivos ficam no aparelho dele — a mensagem lista os
// nomes para o atendimento saber o que esperar no anexo manual.

import {
  CONTATO_SUPORTE,
  TIPOS_RETORNO,
  LIMITE_ANEXOS,
  TAMANHO_MAX_ANEXO_MB
} from "../data/contatoSuporte.js";

const EXTENSOES_ACEITAS = [".pdf", ".txt", ".csv", ".doc", ".docx", ".xls", ".xlsx"];
const TAMANHO_MAX_BYTES = TAMANHO_MAX_ANEXO_MB * 1024 * 1024;

/** Versão do app, injetada pelo Vite no build (cai em "dev" nos testes). */
export function versaoDoApp() {
  return typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
}

/** Só os dígitos de um telefone. */
export function apenasDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

/** Um número utilizável precisa ter DDI e DDD (12 ou 13 dígitos). */
export function whatsappValido(numero) {
  return /^\d{12,13}$/.test(apenasDigitos(numero));
}

export function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email ?? "").trim());
}

/** O que já está configurado no canal de suporte. */
export function canalConfigurado(contato = CONTATO_SUPORTE) {
  const whatsapp = whatsappValido(contato.whatsapp);
  const email = emailValido(contato.email);
  return { whatsapp, email, algum: whatsapp || email };
}

export function rotuloDoTipo(idTipo) {
  return TIPOS_RETORNO.find(t => t.id === idTipo)?.rotulo || "Contato";
}

/** Valida um arquivo escolhido para anexo. */
export function validarAnexo(arquivo, anexosAtuais = []) {
  if (!arquivo) return { ok: false, erro: "Nenhum arquivo selecionado." };

  if (anexosAtuais.length >= LIMITE_ANEXOS) {
    return { ok: false, erro: `Máximo de ${LIMITE_ANEXOS} arquivos por relato.` };
  }

  const nome = String(arquivo.name || "").toLowerCase();
  const ehImagem = String(arquivo.type || "").startsWith("image/");
  const extensaoAceita = EXTENSOES_ACEITAS.some(ext => nome.endsWith(ext));

  if (!ehImagem && !extensaoAceita) {
    return { ok: false, erro: "Formato não aceito. Envie imagem, PDF, planilha ou documento de texto." };
  }

  if (Number(arquivo.size) > TAMANHO_MAX_BYTES) {
    return { ok: false, erro: `Arquivo acima de ${TAMANHO_MAX_ANEXO_MB} MB. Reduza a imagem ou escolha outro arquivo.` };
  }

  return { ok: true, erro: null };
}

export function formatarTamanho(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Texto que será enviado no WhatsApp/e-mail.
 * @param {object} params
 * @param {string} params.tipo Id em TIPOS_RETORNO
 * @param {string} params.descricao Relato do produtor
 * @param {string} [params.nome] Nome de quem relata
 * @param {string} [params.contato] Telefone ou e-mail de retorno
 * @param {Array<{name: string, size: number, type?: string}>} [params.anexos]
 * @param {object} [params.contexto] Dados técnicos automáticos
 * @returns {string}
 */
export function montarMensagemSuporte({
  tipo = "problema",
  descricao = "",
  nome = "",
  contato = "",
  anexos = [],
  contexto = {}
} = {}) {
  const linhas = [
    "*CarcinoGestão — relato de suporte*",
    `Assunto: ${rotuloDoTipo(tipo)}`
  ];

  const quem = [nome.trim(), contato.trim()].filter(Boolean).join(" · ");
  if (quem) linhas.push(`De: ${quem}`);

  linhas.push("", "*Descrição:*", descricao.trim() || "(sem descrição)");

  if (anexos.length > 0) {
    linhas.push(
      "",
      `*Anexos escolhidos (${anexos.length})* — lembre de anexar aqui na conversa:`
    );
    anexos.forEach(a => {
      linhas.push(`• ${a.name} (${formatarTamanho(a.size)})`);
    });
  }

  const itensContexto = [
    contexto.tela ? `Tela: ${contexto.tela}` : null,
    contexto.aparelho ? `Aparelho: ${contexto.aparelho}` : null,
    contexto.registros ? `Registros: ${contexto.registros}` : null,
    `Versão: ${versaoDoApp()}`
  ].filter(Boolean);

  if (itensContexto.length > 0) {
    linhas.push("", "*Contexto automático (ajuda a reproduzir):*");
    itensContexto.forEach(item => linhas.push(`• ${item}`));
  }

  return linhas.join("\n");
}

export function montarAssunto(tipo, descricao = "") {
  const resumo = descricao.trim().replace(/\s+/g, " ").slice(0, 60);
  const rotulo = rotuloDoTipo(tipo);
  return `[CarcinoGestão] ${rotulo}${resumo ? ` — ${resumo}` : ""}`;
}

/** Link de conversa no WhatsApp com a mensagem já escrita. */
export function linkWhatsApp(mensagem, numero = CONTATO_SUPORTE.whatsapp) {
  const digitos = apenasDigitos(numero);
  if (!whatsappValido(digitos)) return null;
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`;
}

/** Link de e-mail com assunto e corpo já escritos. */
export function linkEmail(mensagem, assunto, endereco = CONTATO_SUPORTE.email) {
  if (!emailValido(endereco)) return null;
  return `mailto:${String(endereco).trim()}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(mensagem)}`;
}

/** Junta o contexto técnico que acompanha todo relato. */
export function montarContexto({ tela, registros } = {}) {
  const nav = typeof navigator !== "undefined" ? navigator : {};
  return {
    tela: tela || null,
    aparelho: nav.userAgent ? `${nav.userAgent}` : null,
    registros: registros || null
  };
}
