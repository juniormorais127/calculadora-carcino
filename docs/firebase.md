# Contas e salvamento na nuvem

Projeto: `carcinogestao`, plano Spark. Firestore Standard em `southamerica-east1`.
Login por e-mail/senha, sem Analytics no aplicativo. O cadastro web público está
em `src/services/firebase.js`; a proteção real fica nas regras, nunca na API key.
Domínio autorizado: `juniormorais127.github.io`.

A abertura do site exige login antes de montar o painel. Cadastro e recuperação
de senha ficam disponíveis nessa tela. Sessões já autenticadas abrem o painel;
ao sair, o aplicativo retorna à tela de login.

Recuperação: o modelo em `password-reset-email.html` usa `%LINK%` como destino
do botão. **Pendente de liberação pelo suporte Firebase**: o console recusou
a gravação com “As atualizações de modelos de e-mail não estão disponíveis
para este projeto”. O modelo padrão e o link Firebase permanecem ativos.
Quando a edição for liberada, aplicar o modelo em português e definir nome
do remetente CarcinoGestão e assunto “Redefina sua senha | CarcinoGestão”.
A URL acionável no console deve apontar para a raiz publicada
`https://juniormorais127.github.io/calculadora-carcino/`. O app lê `mode` e
`oobCode`, remove esses parâmetros do histórico e verifica o código com o SDK
antes de oferecer a nova senha. Links expirados permitem solicitar outro.
O remetente de e-mail ainda usa o domínio padrão Firebase; personalizar o
endereço do remetente exige domínio próprio e verificação DNS.

Cada UID possui um banco IndexedDB próprio. A base antiga `CalculadoraCarcinoDB`
é exclusiva do modo local. O usuário pode importar os registros antigos em uma
conta vazia, confirmando explicitamente a propriedade. A cópia original permanece.
Sair desmonta a interface da conta; nenhuma operação pendente muda de UID.

O Firestore guarda snapshots imutáveis, divididos em documentos menores que o
limite do serviço. O manifesto `users/{uid}/state/current` publica uma versão
completa por transação e verifica a revisão anterior. As regras negam qualquer
acesso de outro UID e de visitantes sem autenticação. O aplicativo conserva
as duas últimas versões publicadas e remove versões antigas após o commit.
Uma interrupção de rede durante upload/limpeza pode deixar chunks não publicados;
não afeta os dados publicados, mas pode exigir limpeza administrativa de órfãos.

A sincronização automática ocorre após alterações, ao reconectar e ao voltar
para a janela. Confirme o status antes de trocar de aparelho. Dados divergentes
entre aparelhos pausam a sincronização sem sobrescrever. É possível baixar o
backup local e escolher recuperar a nuvem. Essa recuperação também mantém uma
cópia anterior no IndexedDB para baixar. Não existe mesclagem automática de conflitos.
Backups JSON continuam disponíveis em Ajustes. Limpar/restaurar dados conectado
afeta a conta e sincroniza com a nuvem; o texto de confirmação informa isso.

## Validação

- `npm test`: regras de sincronização, conflito, offline, isolamento local e regressões.
- `npm run build`.
- `$env:FIREBASE_LIVE_TEST='1'; npx playwright test e2e/firebase-accounts.spec.js --project=chromium`:
  opt-in para contas descartáveis, dados sintéticos e verificações das regras no
  projeto real, com limpeza em `finally`. Não usa contas de produtores.
- `npx playwright test e2e/onboarding-flow.spec.js e2e/ajuda.spec.js --project=chromium`.

As regras em `firestore.rules` foram publicadas pelo console. Alterações futuras
podem ser publicadas por `firebase deploy --only firestore:rules`, com autenticação
administrativa apropriada. Nunca habilitar regras públicas para resolver erros.
Não ativar faturamento, SMS ou backups pagos sem autorização do proprietário.
