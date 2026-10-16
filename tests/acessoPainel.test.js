import test from "node:test";
import assert from "node:assert/strict";

import { motivoDoBloqueioDeAcesso } from "../src/services/accountPermissions.js";

const produtor = { uid: "uid-produtor", email: "produtor@exemplo.com", emailVerified: true };
const semConfirmar = { ...produtor, emailVerified: false };
const comCelular = { phone: "+5579999991234" };

test("bloqueio de acesso ao painel", async (t) => {
  await t.test("sem sessão pede login", () => {
    assert.equal(motivoDoBloqueioDeAcesso({ user: null, perfil: null }), "sem-sessao");
  });

  await t.test("e-mail não confirmado retém mesmo com perfil completo", () => {
    assert.equal(
      motivoDoBloqueioDeAcesso({ user: semConfirmar, perfil: comCelular }),
      "email-nao-verificado"
    );
  });

  await t.test("perfil lido com celular libera o painel", () => {
    assert.equal(motivoDoBloqueioDeAcesso({ user: produtor, perfil: comCelular }), null);
  });

  await t.test("perfil lido sem celular continua exigindo o cadastro", () => {
    assert.equal(motivoDoBloqueioDeAcesso({ user: produtor, perfil: {} }), "sem-celular");
  });

  await t.test("online, ainda consultando o perfil, aguarda", () => {
    assert.equal(
      motivoDoBloqueioDeAcesso({ user: produtor, perfil: null, perfilCarregando: true, online: true }),
      "consultando-perfil"
    );
  });

  // Regressão: o Firestore usa cache em memória, então sem internet não há perfil
  // para ler. Antes disso o app devolvia o produtor à tela de login, trancando o
  // acesso aos registros que já estavam no aparelho dele.
  await t.test("sem internet abre em modo local mesmo sem o perfil", () => {
    assert.equal(
      motivoDoBloqueioDeAcesso({ user: produtor, perfil: null, perfilCarregando: true, online: false }),
      null
    );
  });

  await t.test("consulta ao perfil que falhou abre em modo local", () => {
    assert.equal(
      motivoDoBloqueioDeAcesso({ user: produtor, perfil: null, perfilCarregando: false, perfilErro: true, online: true }),
      null
    );
  });

  await t.test("consulta que falhou não libera celular conhecido e ausente", () => {
    assert.equal(
      motivoDoBloqueioDeAcesso({ user: produtor, perfil: {}, perfilErro: true, online: true }),
      "sem-celular"
    );
  });
});
