import test from "node:test";
import assert from "node:assert/strict";

import {
  apenasDigitos,
  whatsappValido,
  emailValido,
  canalConfigurado,
  rotuloDoTipo,
  validarAnexo,
  formatarTamanho,
  montarMensagemSuporte,
  montarAssunto,
  linkWhatsApp,
  linkEmail,
  versaoDoApp
} from "../src/services/suporteService.js";
import { CONTATO_SUPORTE, LIMITE_ANEXOS, TAMANHO_MAX_ANEXO_MB } from "../src/data/contatoSuporte.js";

const MB = 1024 * 1024;

test("validação do canal de suporte", async (t) => {
  await t.test("o app vem sem contato configurado e isso é detectado", () => {
    const canal = canalConfigurado();
    assert.equal(canal.whatsapp, false);
    assert.equal(canal.email, false);
    assert.equal(canal.algum, false);
  });

  await t.test("número precisa de DDI e DDD", () => {
    assert.equal(whatsappValido("5584999999999"), true); // 13 dígitos
    assert.equal(whatsappValido("(84) 99999-9999"), false); // sem DDI
    assert.equal(whatsappValido(""), false);
    assert.equal(apenasDigitos("+55 (84) 99999-9999"), "5584999999999");
  });

  await t.test("e-mail precisa ter formato de e-mail", () => {
    assert.equal(emailValido("suporte@carcino.com.br"), true);
    assert.equal(emailValido("suporte@carcino"), false);
    assert.equal(emailValido(""), false);
  });

  await t.test("canal preenchido é reconhecido", () => {
    const canal = canalConfigurado({ whatsapp: "5584999999999", email: "suporte@carcino.com.br" });
    assert.equal(canal.algum, true);
    assert.equal(canal.whatsapp, true);
    assert.equal(canal.email, true);
  });

  await t.test("o padrão do projeto continua vazio", () => {
    // Se alguém preencher o contato, este teste avisa que o e2e do aviso precisa mudar
    assert.equal(CONTATO_SUPORTE.whatsapp, "");
    assert.equal(CONTATO_SUPORTE.email, "");
  });
});

test("validação de anexos", async (t) => {
  const foto = { name: "viveiro.jpg", size: 800 * 1024, type: "image/jpeg" };
  const pdf = { name: "analise.pdf", size: 300 * 1024, type: "application/pdf" };
  const planilha = { name: "custos.xlsx", size: 100 * 1024, type: "" };
  const executavel = { name: "virus.exe", size: 1024, type: "application/x-msdownload" };

  await t.test("aceita imagem, PDF e planilha", () => {
    assert.equal(validarAnexo(foto).ok, true);
    assert.equal(validarAnexo(pdf).ok, true);
    assert.equal(validarAnexo(planilha).ok, true);
  });

  await t.test("recusa formato perigoso ou estranho", () => {
    const r = validarAnexo(executavel);
    assert.equal(r.ok, false);
    assert.match(r.erro, /formato/i);
  });

  await t.test("recusa arquivo grande demais", () => {
    const grande = { name: "video.mp4", size: (TAMANHO_MAX_ANEXO_MB + 1) * MB, type: "video/mp4" };
    const r = validarAnexo(grande);
    assert.equal(r.ok, false);
    assert.match(r.erro, /formato|MB/i);
  });

  await t.test("respeita o limite de arquivos", () => {
    const cheio = Array.from({ length: LIMITE_ANEXOS }, (_, i) => ({ name: `f${i}.jpg`, size: 1000, type: "image/jpeg" }));
    const r = validarAnexo(foto, cheio);
    assert.equal(r.ok, false);
    assert.match(r.erro, /máximo/i);
  });

  await t.test("sem arquivo não quebra", () => {
    assert.equal(validarAnexo(null).ok, false);
  });

  await t.test("tamanho é legível", () => {
    assert.equal(formatarTamanho(800), "800 B");
    assert.equal(formatarTamanho(300 * 1024), "300 KB");
    assert.equal(formatarTamanho(2.5 * MB), "2.5 MB");
  });
});

test("relato de suporte", async (t) => {
  const contexto = { tela: "agua", aparelho: "Android 13 · Chrome 120", registros: "2 viveiro(s) · 4 biometria(s)" };

  await t.test("a mensagem junta tipo, descrição, anexos e contexto", () => {
    const texto = montarMensagemSuporte({
      tipo: "problema",
      descricao: "Toquei em Salvar Medição e a tela ficou em branco.",
      nome: "João",
      contato: "84 99999-9999",
      anexos: [{ name: "print.png", size: 900 * 1024 }],
      contexto
    });

    assert.match(texto, /relato de suporte/i);
    assert.match(texto, /Algo não está funcionando/);
    assert.match(texto, /De: João · 84 99999-9999/);
    assert.match(texto, /tela ficou em branco/);
    assert.match(texto, /print\.png \(900 KB\)/);
    assert.match(texto, /lembre de anexar/i);
    assert.match(texto, /Tela: agua/);
    assert.match(texto, /Versão: dev/);
  });

  await t.test("sem descrição o texto não fica vazio nem quebrado", () => {
    const texto = montarMensagemSuporte({ tipo: "duvida" });
    assert.match(texto, /\(sem descrição\)/);
    assert.match(texto, /Dúvida de uso/);
    assert.equal(texto.includes("Anexos escolhidos"), false);
  });

  await t.test("assunto do e-mail resume o relato", () => {
    const assunto = montarAssunto("sugestao", "   Seria útil ver o custo por ciclo   ");
    assert.match(assunto, /^\[CarcinoGestão\] Sugestão de melhoria — Seria útil ver o custo por ciclo$/);
  });

  await t.test("assunto muito longo é cortado", () => {
    const assunto = montarAssunto("outro", "a".repeat(200));
    assert.ok(assunto.length < 100);
  });

  await t.test("tipo desconhecido cai em Contato", () => {
    assert.equal(rotuloDoTipo("inexistente"), "Contato");
  });

  await t.test("versão do app é informada (dev fora do build)", () => {
    assert.equal(versaoDoApp(), "dev");
  });
});

test("links de envio", async (t) => {
  const mensagem = "Olá! Teste com acento: ção & sinal +";

  await t.test("sem contato configurado não gera link quebrado", () => {
    assert.equal(linkWhatsApp(mensagem), null);
    assert.equal(linkEmail(mensagem, "assunto"), null);
  });

  await t.test("WhatsApp usa o número com DDI e escapa o texto", () => {
    const link = linkWhatsApp(mensagem, "(84) 99999-9999");
    assert.equal(link, null); // sem DDI, não gera link

    const comDdi = linkWhatsApp(mensagem, "5584999999999");
    assert.match(comDdi, /^https:\/\/wa\.me\/5584999999999\?text=/);
    assert.match(comDdi, /%C3%A7%C3%A3o/); // "ção" escapado
    assert.equal(comDdi.includes(" "), false);
  });

  await t.test("e-mail escapa assunto e corpo", () => {
    const link = linkEmail(mensagem, "[CarcinoGestão] Problema", "suporte@carcino.com.br");
    assert.match(link, /^mailto:suporte@carcino\.com\.br\?subject=/);
    assert.match(link, /&body=/);
    assert.equal(link.includes(" "), false);
  });
});
