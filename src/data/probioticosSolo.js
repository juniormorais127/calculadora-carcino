// Base científica e agronômica para Biorremediação e Manejo de Solo com Probióticos
// Cultivo de camarão marinho (Litopenaeus vannamei)
// Fontes: EMBRAPA Aquicultura, ABCC, FAO e periódicos de Biotecnologia Aquícola.

export const DADOS_PROBIOTICOS_SOLO = {
  visaoGeral: {
    titulo: "Biorremediação de Sedimento com Probióticos",
    subtitulo: "Degradação acelerada de lodo negro, eliminação do gás sulfídrico (H2S) e oxidação do fundo do viveiro",
    resumo: "Durante o cultivo de camarão, até 30% da ração fornecida não é consumida e se acumula no fundo junto com fezes e plâncton morto. Sem oxigenação e microrganismos eficientes, esse sedimento entra em fermentação anaeróbia, produzindo gás sulfídrico (H2S), nitrito tóxico e lodo negro. O uso estratégico de consórcios probióticos de Bacillus spp. e bactérias fotossintetizantes decompõe enzimaticamente essa matéria orgânica e restaura o potencial de oxirredução (Redox) do viveiro."
  },

  cepasBacterianas: [
    {
      nome: "Bacillus subtilis",
      tipo: "Heterotrófica facultativa / Formadora de esporos",
      enzimas: "Proteases, amilases e esterases",
      funcao: "Degradação rápida de proteínas residuais de ração e matéria fecal no sedimento. Compete intensamente por nutrientes e espaço contra Vibrio spp. patogênicos no fundo.",
      condicaoIdeal: "Oxigênio dissolvido > 3,5 mg/L, pH entre 7.2 e 8.4."
    },
    {
      nome: "Bacillus licheniformis",
      tipo: "Heterotrófica anaeróbia facultativa",
      enzimas: "Proteases alcalinas, celulases e lipases",
      funcao: "Altamente ativa nas microcamadas mais profundas do lodo com baixo oxigênio (condições microaerofílicas), quebrando lodo negro denso em compostos simples não tóxicos.",
      condicaoIdeal: "Tolera baixas tensões de oxigênio no sedimento."
    },
    {
      nome: "Bacillus pumilus & Bacillus megaterium",
      tipo: "Mineralizadoras e solubilizadoras de fósforo",
      enzimas: "Fosfatases e peptidases",
      funcao: "Solubilização de fosfatos acumulados no solo e mineralização de carbono orgânico, liberando nutrientes assimiláveis para microalgas benéficas (diatomáceas).",
      condicaoIdeal: "Temperatura da água entre 26°C e 32°C."
    },
    {
      nome: "Rhodopseudomonas palustris (Bactérias Fototróficas)",
      tipo: "Bactérias fotossintetizantes púrpura não-sulfurosas",
      enzimas: "Oxidases de sulfeto",
      funcao: "Consomem diretamente o gás sulfídrico tóxico (H2S) e ácidos graxos voláteis sob luz solar, transformando sulfetos letais em sulfato inofensivo sem consumir oxigênio da água.",
      condicaoIdeal: "Necessita de incidência de luz solar na interface da água e fundo."
    },
    {
      nome: "Consórcio Nitrificante (Nitrosomonas & Nitrobacter)",
      tipo: "Quimiolitoautotróficas",
      enzimas: "Amônia-monooxigenase e Nitrito-oxidase",
      funcao: "Convertem a amônia gerada pela decomposição do lodo em nitrito e em seguida em nitrato, reduzindo a toxicidade da água próxima ao fundo.",
      condicaoIdeal: "Alcalinidade total acima de 120 mg/L e aeração constante."
    }
  ],

  impactoRedoxEH2S: {
    potencialRedox: {
      titulo: "Potencial de Oxirredução do Fundo (Redox / ORP em mV)",
      faixas: [
        { faixa: "> +100 mV", status: "Excelente / Totalmente Oxidado", descricao: "Fundo aeróbio, sem odor de sulfeto, camarões pastam ativamente sem estresse nas brânquias." },
        { faixa: "0 a +100 mV", status: "Bom / Moderadamente Oxidado", descricao: "Condição estável, ideal para manutenção preventiva com probiótico semanal." },
        { faixa: "-100 a 0 mV", status: "Alerta / Transição Anóxica", descricao: "Início de lodo cinza/escuro nos alimentadores. Requer ativação e choque com probiótico." },
        { faixa: "< -100 mV", status: "Crítico / Zona de Asfixia & H2S", descricao: "Formação de lodo preto e gás sulfídrico. Camarões migram para as bordas e evitam o fundo. Risco iminente de mortalidade." }
      ]
    },
    gasSulfidrico: {
      titulo: "Toxicidade do Gás Sulfídrico (H2S)",
      explicacao: "O H2S é gerado por bactérias redutoras de sulfato quando o oxigênio do fundo chega a zero. Concentrações a partir de 0,01 mg/L já inibem a respiração e provocam melanização das brânquias; acima de 0,05 mg/L a mortalidade pode ser devastadora em poucas horas.",
      acaoProbiotico: "Os probióticos agem em duas frentes: (1) Bacillus consomem o substrato orgânico impedindo a formação de lodo anaeróbio; (2) bactérias fototróficas oxidam o sulfeto residual antes que ele evapore para a coluna de água."
    }
  },

  protocoloAtivacaoBiofermentacao: {
    titulo: "Protocolo Prático de Biofermentação (Ativação de 12 a 24 horas)",
    ingredientes: [
      { item: "Inóculo Probiótico em pó", proporcao: "1 kg para cada 1 hectare de viveiro" },
      { item: "Melaço de cana limpo (ou açúcar)", proporcao: "10% a 15% (1 a 1,5 kg de melaço por 1 kg de inóculo)" },
      { item: "Água doce limpa e desclorada", proporcao: "20 a 50 litros por kg de probiótico" },
      { item: "Bicarbonato de Sódio (opcional)", proporcao: "50 g para manter pH tamponado" }
    ],
    passos: [
      "1. Higienizar tambor plástico (não usar recipientes contaminados com cloro ou desinfetantes).",
      "2. Diluir o melaço na água limpa até homogenização total.",
      "3. Adicionar o probiótico em pó e misturar vigorosamente.",
      "4. Instalar pedra porosa conectada a aerador/soprador de ar contínuo.",
      "5. Deixar aerar por 12 a 24 horas: a mistura formará espuma densa e cheiro agradável de fermento/frutado (pH ideal entre 4,5 e 5,5).",
      "6. Aplicar no viveiro preferencialmente entre 08h00 e 10h00 da manhã, com aeradores ligados para dispersão uniforme."
    ]
  },

  dosagensRecomendadas: {
    preparoFundoVazio: {
      titulo: "Preparo de Viveiro Entre Ciclos (Primeira Lâmina d'água)",
      doseKgHa: "5 a 8 kg/ha (ou 50 L de ativado/ha)",
      quandoAplicar: "Após secagem e calagem, encher lâmina de 15 a 20 cm e aplicar o probiótico 3 a 5 dias antes do enchimento final e povoamento.",
      objetivo: "Colonizar o sedimento antes das bactérias patogênicas e decompor a matéria residual remanescente da safra anterior."
    },
    manutencaoSemanal: {
      titulo: "Manutenção Preventiva Durante o Cultivo",
      doseKgHa: "0,5 a 1,2 kg/ha por semana (ou 10 a 20 L de ativado/ha)",
      quandoAplicar: "Semanalmente, concentrando 60% da dose nas áreas dos comedouros/alimentadores e bacia de drenagem.",
      objetivo: "Prevenir o acúmulo de sobras de ração e manter o potencial Redox positivo (+50 a +100 mV)."
    },
    choqueCorretivoLodoH2S: {
      titulo: "Tratamento de Choque (Lodo Negro ou Presença de H2S)",
      doseKgHa: "2,0 a 3,0 kg/ha por dia, repetido por 3 dias seguidos",
      quandoAplicar: "Imediatamente após constatação de manchas escuras nas bandejas, cheiro fétido ou camarões evitando o fundo.",
      objetivo: "Degradação massiva da frente de matéria orgânica e bloqueio da emissão de gás sulfídrico. Reduzir em 30% a ração nas primeiras 48h."
    }
  }
};
