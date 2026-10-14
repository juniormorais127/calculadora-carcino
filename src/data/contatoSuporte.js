// Canal de suporte do CarcinoGestão — PREENCHA AQUI.
//
// Enquanto o WhatsApp e o e-mail estiverem vazios, o app avisa que o canal ainda
// não foi configurado, em vez de abrir um link quebrado (ou, pior, o número de
// outra pessoa). Assim que você preencher, os botões passam a funcionar sozinhos.

export const CONTATO_SUPORTE = {
  nomeEquipe: "Equipe CarcinoGestão",

  // Só dígitos, com DDI e DDD. Ex.: "5584999999999"
  whatsapp: "",

  email: "",

  horarioAtendimento: "Segunda a sexta, das 8h às 18h"
};

// Motivos de contato oferecidos ao produtor
export const TIPOS_RETORNO = [
  { id: "problema", rotulo: "Algo não está funcionando", descricao: "Erro na tela, cálculo estranho, botão que não responde" },
  { id: "sugestao", rotulo: "Sugestão de melhoria", descricao: "Ideia de recurso, dado que falta, texto a ajustar" },
  { id: "duvida", rotulo: "Dúvida de uso", descricao: "Como usar uma calculadora ou interpretar um resultado" },
  { id: "outro", rotulo: "Outro assunto", descricao: "Parceria, comercial, imprensa" }
];

// Limites dos anexos: o app não tem servidor, então os arquivos são escolhidos
// aqui e anexados pelo próprio produtor na conversa que vai abrir.
export const LIMITE_ANEXOS = 3;
export const TAMANHO_MAX_ANEXO_MB = 5;
export const TIPOS_ARQUIVO_ACEITOS = "image/*,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx";
