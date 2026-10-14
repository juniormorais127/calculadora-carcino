// Dados de referência agronômica e zootécnica para carcinicultura (Litopenaeus vannamei)
// Fontes: EMBRAPA, ABCC, FAO e literatura técnica especializada

// Taxa de arraçoamento (% da biomassa viva por dia) por faixa de peso médio.
// Fontes: curva alimentar média atualizada (Panorama da Aquicultura) e Nunes et al.
// (EMBRAPA, 2011), cujo ótimo experimental ficou entre 5,1% e 5,5% da biomassa na
// faixa de 3 a 6 g — coerente com a linha de 5,5% desta tabela.
// A tabela é um GUIA: o ajuste final é sempre dado pelas sobras nas bandejas
// (ver AJUSTE_BANDEJAS_ALIMENTACAO).
export const TABELA_ALIMENTACAO_VANNAMEI = [
  { minPeso: 0.0, maxPeso: 1.0, taxaMin: 12.0, taxaMax: 15.0, taxaPadrao: 13.5, frequenciaTratos: 5, fase: "Berçário / Pós-Larva" },
  { minPeso: 1.0, maxPeso: 2.0, taxaMin: 8.5, taxaMax: 9.5, taxaPadrao: 9.0, frequenciaTratos: 4, fase: "Juvenil Inicial" },
  { minPeso: 2.0, maxPeso: 4.0, taxaMin: 7.0, taxaMax: 8.2, taxaPadrao: 7.6, frequenciaTratos: 4, fase: "Juvenil Médio" },
  { minPeso: 4.0, maxPeso: 6.0, taxaMin: 6.1, taxaMax: 7.1, taxaPadrao: 6.6, frequenciaTratos: 4, fase: "Juvenil Avançado" },
  { minPeso: 6.0, maxPeso: 8.0, taxaMin: 5.5, taxaMax: 6.5, taxaPadrao: 6.0, frequenciaTratos: 3, fase: "Engorda Inicial" },
  { minPeso: 8.0, maxPeso: 10.0, taxaMin: 5.0, taxaMax: 6.0, taxaPadrao: 5.5, frequenciaTratos: 3, fase: "Engorda Inicial" },
  { minPeso: 10.0, maxPeso: 12.0, taxaMin: 4.4, taxaMax: 5.2, taxaPadrao: 4.8, frequenciaTratos: 3, fase: "Engorda Média" },
  { minPeso: 12.0, maxPeso: 14.0, taxaMin: 4.0, taxaMax: 4.8, taxaPadrao: 4.4, frequenciaTratos: 3, fase: "Engorda Média" },
  { minPeso: 14.0, maxPeso: 16.0, taxaMin: 3.6, taxaMax: 4.4, taxaPadrao: 4.0, frequenciaTratos: 3, fase: "Engorda Avançada" },
  { minPeso: 16.0, maxPeso: 18.0, taxaMin: 3.3, taxaMax: 4.0, taxaPadrao: 3.7, frequenciaTratos: 2, fase: "Pré-Despesca" },
  { minPeso: 18.0, maxPeso: 20.0, taxaMin: 3.1, taxaMax: 3.8, taxaPadrao: 3.5, frequenciaTratos: 2, fase: "Pré-Despesca" },
  { minPeso: 20.0, maxPeso: 22.0, taxaMin: 2.8, taxaMax: 3.4, taxaPadrao: 3.1, frequenciaTratos: 2, fase: "Despesca / Comercial" },
  { minPeso: 22.0, maxPeso: 24.0, taxaMin: 2.7, taxaMax: 3.3, taxaPadrao: 3.0, frequenciaTratos: 2, fase: "Despesca / Comercial" },
  { minPeso: 24.0, maxPeso: 60.0, taxaMin: 2.3, taxaMax: 2.9, taxaPadrao: 2.6, frequenciaTratos: 2, fase: "Despesca / Comercial" }
];

export const PARAMETROS_QUALIDADE_AGUA = {
  oxigenio: {
    nome: "Oxigênio Dissolvido",
    unidade: "mg/L",
    otimoMin: 4.5,
    otimoMax: 8.0,
    alertaMin: 3.0,
    criticoMin: 2.0,
    impacto: "Abaixo de 3,5 mg/L suspender arraçoamento. Abaixo de 2,5 mg/L acionar aeração de emergência imediatamente."
  },
  temperatura: {
    nome: "Temperatura",
    unidade: "°C",
    otimoMin: 28.0,
    otimoMax: 32.0,
    alertaMin: 24.0,
    alertaMax: 34.0,
    criticoMin: 20.0,
    criticoMax: 36.0,
    impacto: "Temperaturas abaixo de 25°C reduzem o apetite em até 50%. Acima de 33°C aceleram metabolismo e consumo de oxigênio."
  },
  ph: {
    nome: "pH",
    unidade: "",
    otimoMin: 7.8,
    otimoMax: 8.5,
    alertaMin: 7.2,
    alertaMax: 8.8,
    criticoMin: 6.5,
    criticoMax: 9.2,
    impacto: "Variação diária não deve ultrapassar 0.5 unidades. pH > 8.8 potencializa toxicidade da amônia não-ionizada."
  },
  salinidade: {
    nome: "Salinidade",
    unidade: "ppt (g/L)",
    otimoMin: 15.0,
    otimoMax: 30.0,
    alertaMin: 5.0,
    alertaMax: 40.0,
    criticoMin: 1.0,
    criticoMax: 48.0,
    // Abaixo de 5 ppt o app trata como ATENÇÃO DE CONTEXTO, não como falha: em
    // cultivo de interior com água de poço essa é a condição normal de operação,
    // e o que decide o resultado é o balanço iônico (aba Balanço Iônico).
    alertaContextoAbaixo: 5.0,
    observacaoManejo: "Salinidade baixa é esperada em água de poço. O que manda é o balanço iônico: Na:K perto de 28:1, Mg:Ca entre 2,5:1 e 3,4:1 e K acima de 50 mg/L. Meça a água — o potássio do poço não acompanha a salinidade.",
    impacto: "Vannamei tolera de 0.5 a 45 ppt. Em baixa salinidade (< 5 ppt), o balanço de Na:K (28:1) e Mg:Ca (3:1) é mandatório."
  },
  alcalinidade: {
    nome: "Alcalinidade Total",
    unidade: "mg/L CaCO3",
    otimoMin: 120.0,
    otimoMax: 180.0,
    alertaMin: 80.0,
    criticoMin: 60.0,
    impacto: "Abaixo de 100 mg/L causa problemas de muda (troca de casca mole) e instabilidade no pH. Corrigir com Bicarbonato."
  },
  amoniaTotal: {
    nome: "Amônia Total (NAT)",
    unidade: "mg/L",
    otimoMax: 0.5,
    alertaMax: 1.5,
    criticoMax: 3.0,
    impacto: "A fração tóxica (NH3) deve ficar rigorosamente abaixo de 0.05 mg/L para evitar asfixia e mortalidade."
  },
  nitrito: {
    nome: "Nitrito (N-NO2)",
    unidade: "mg/L",
    // Sem limiar fixo: a toxicidade depende da salinidade da água.
    // Ver LIMIARES_NITRITO_POR_SALINIDADE logo abaixo.
    limiaresPorSalinidade: true,
    impacto: "Metahemoglobina e estresse osmótico. O cloreto compete com o nitrito na brânquia, então em baixa salinidade ele é ordens de grandeza mais tóxico: a 2 ppt a concentração segura é de ~0,3 mg/L, contra ~32 mg/L a 35 ppt. Subir a salinidade só para isso é ineficaz e ainda inibe a nitrificação — o caminho é manejo de nitrogênio."
  },
  transparencia: {
    nome: "Transparência (Secchi)",
    unidade: "cm",
    otimoMin: 30.0,
    otimoMax: 45.0,
    alertaMin: 20.0,
    alertaMax: 60.0,
    impacto: "< 25 cm indica bloom excessivo de fitoplâncton (risco de anoxia noturna). > 50 cm indica água muito clara (proliferação de algas bentônicas/cabelo)."
  },
  // Metais de água de poço — o risco menos lembrado e o mais difícil de reverter.
  // Faixas conservadoras de manejo (referência), medidas na água de abastecimento.
  // Ferro: já se descreve irritação e necrose branquial de 0,2 a 0,5 mg/L, porque
  // o Fe2+ do poço profundo oxida e precipita oxi-hidróxido entre as lamelas; a
  // água de captação costuma ser aceita abaixo de 1 mg/L.
  // Manganês: o Mn2+ dissolvido é bem mais tóxico que o precipitado, e oxidá-lo é
  // lento — por simples aeração a taxa é insignificante abaixo de pH 9.
  ferro: {
    nome: "Ferro total (Fe)",
    unidade: "mg/L",
    otimoMax: 0.2,
    alertaMax: 1.0,
    criticoMax: 2.0,
    impacto: "Água de poço profundo traz Fe2+ solúvel, que oxida e precipita nas brânquias: atrapalha a respiração, a excreção de amônia e a osmorregulação — o mesmo sistema já sobrecarregado em baixa salinidade, e as PLs sofrem mais que os juvenis. Antes de encher: aerar forte, reter 1 a 2 dias em tanque de sedimentação e filtrar em areia. Acima de 5 mg/L só aeração com filtragem resolve; abaixo de 2 mg/L, cloração seguida de filtragem. Solo avermelhado no viveiro é hidróxido férrico e lixivia ferro para a água."
  },
  manganes: {
    nome: "Manganês (Mn)",
    unidade: "mg/L",
    otimoMax: 0.05,
    alertaMax: 0.2,
    criticoMax: 0.5,
    impacto: "Faixa conservadora de referência: água de captação costuma ser aceita abaixo de 0,01 mg/L. O Mn2+ dissolvido é bem mais tóxico que o precipitado, mas oxidá-lo é lento — por simples aeração a taxa é insignificante abaixo de pH 9, e oxidantes fortes exigem pH acima de 8,5. Na prática, resolver na fonte (poço/tanque de tratamento) é mais realista que tratar o viveiro."
  }
};

// ============================================================================
// LIMIARES DE NITRITO POR SALINIDADE (mg/L de N-NO2)
// O nitrito é ~100x mais tóxico em água doce: o cloreto compete com a absorção
// de NO2- nas brânquias, então o limite seguro acompanha a salinidade.
// Âncoras de literatura:
//  - até 1 ppt ....... seguro ~0,3 mg/L; atenção a partir de 0,6 mg/L (CL50-96h de
//                      2,5 mg/L a 2 ppt, ou seja, margem muito estreita)
//  - até 8 ppt ....... máximo 1,0 mg/L e aceitável até 2,0 mg/L (águas oligo/mesohalinas)
//  - acima de 15 ppt . até 10 mg/L para bom desempenho
//  - 35 ppt .......... seguro ~32 mg/L (CL50 = 319 mg/L)
// ATENÇÃO À BASE: se o kit expressa NO2- (e não N-NO2), multiplique a leitura por
// 3,28 antes de comparar com esta tabela.
// ============================================================================
export const LIMIARES_NITRITO_POR_SALINIDADE = [
  { salinidadeMaxPpt: 1, otimoMax: 0.3, alertaMax: 0.6, criticoMax: 1.0 },
  { salinidadeMaxPpt: 4, otimoMax: 0.5, alertaMax: 1.0, criticoMax: 2.0 },
  { salinidadeMaxPpt: 8, otimoMax: 0.8, alertaMax: 1.5, criticoMax: 3.0 },
  { salinidadeMaxPpt: 15, otimoMax: 2.0, alertaMax: 5.0, criticoMax: 10.0 },
  { salinidadeMaxPpt: 25, otimoMax: 5.0, alertaMax: 10.0, criticoMax: 20.0 },
  { salinidadeMaxPpt: 60, otimoMax: 10.0, alertaMax: 20.0, criticoMax: 32.0 }
];

export const CALAGEM_SOLO_TABELA = [
  { phMax: 5.0, doseKgPorHa: 3500, recomendacao: "Solos fortemente ácidos. Aplicar calcário dolomítico e incorporar 10-15cm." },
  { phMax: 5.5, doseKgPorHa: 2500, recomendacao: "Acidez média. Incorporar calcário dolomítico com antecedência de 15 dias." },
  { phMax: 6.0, doseKgPorHa: 1800, recomendacao: "Acidez moderada. Calcário calcítico ou dolomítico." },
  { phMax: 6.5, doseKgPorHa: 1000, recomendacao: "Levemente ácido. Manutenção preventiva de pH e reserva de cálcio." },
  { phMax: 7.0, doseKgPorHa: 500, recomendacao: "Solo neutro. Apenas manutenção leve se o histórico do viveiro exigir." },
  { phMax: 14.0, doseKgPorHa: 0, recomendacao: "Solo alcalino. Não aplicar calcário ou cal." }
];

export const AJUSTE_BANDEJAS_ALIMENTACAO = [
  { status: "Limpa (100% consumida em < 1h30)", ajustePercentual: +10, descricao: "Aumentar 10% na próxima oferta (apetite agressivo)" },
  { status: "Normal (< 5% de sobras após 2h)", ajustePercentual: 0, descricao: "Manter cálculo zootécnico sem alterações" },
  { status: "Leves sobras (10% a 20%)", ajustePercentual: -10, descricao: "Reduzir 10% no próximo trato para evitar acúmulo no fundo" },
  { status: "Sobras médias (20% a 40%)", ajustePercentual: -25, descricao: "Reduzir 25%. Checar oxigênio dissolvido e temperatura" },
  { status: "Sobras críticas (> 50%) ou ecdise massiva", ajustePercentual: -50, descricao: "Reduzir 50% ou cortar trato. Possível pico de muda ou anoxia" }
];

export const DOENCAS_CAMARAO = [
  {
    id: "wssv",
    nome: "Síndrome da Mancha Branca",
    sigla: "WSSV",
    tipo: "Viral (Nimaviridae)",
    gravidade: "Extrema (Mortalidade de até 100% em 3 a 10 dias)",
    cor: "rose",
    periodoCritico: "Qualquer fase, especialmente com quedas de temperatura (< 27°C) e estresse osmótico",
    sintomas: [
      "Pontos brancos circulares (0.5 a 2 mm) na face interna da carapaça e cefalotórax",
      "Coloração corporal avermelhada ou rosada generalizada",
      "Letargia extrema e camarões nadando lentos junto às margens do viveiro",
      "Corte brusco no consumo de ração nas bandejas",
      "Intestino e estômago completamente vazios"
    ],
    acaoEmergencia: "Notificar imediatamente o serviço veterinário oficial. Isolar 100% o viveiro. NÃO drenar água para o estuário sem antes aplicar cloração de desinfecção (20 a 30 ppm de cloro ativo por 48h). Proceder despesca de emergência se o camarão tiver tamanho comercial.",
    prevencao: "Exclusividade de PLs certificadas SPF por PCR, filtragem da água de entrada com malha < 300 micras para barrar vetores silvestres (caranguejos e copépodes), cerca anti-pássaro e desinfecção de redes com amônia quaternária."
  },
  {
    id: "imnv",
    nome: "Mionecrose Infecciosa",
    sigla: "IMNV",
    tipo: "Viral (Totiviridae)",
    gravidade: "Alta (Mortalidade cumulativa de 40% a 70%)",
    cor: "amber",
    periodoCritico: "Juvenis e adultos (a partir de 4 a 6 gramas) submetidos a estresse térmico ou de oxigênio",
    sintomas: [
      "Músculo do abdômen e cauda com áreas brancas opacas (aspecto leitoso ou 'carne cozida')",
      "Em estágio avançado, a necrose muscular adquire tom avermelhado",
      "Morte súbita logo após eventos de manejo brusco (tarrafeadas, biometrias) ou queda noturna de O2",
      "Flacidez muscular e perda de vigor de natação"
    ],
    acaoEmergencia: "Suspender imediatamente qualquer manejo estressante no viveiro (não tarrafear, não fazer biometria invasiva). Ligar aeradores em regime contínuo. Reduzir a ração em 30% a 50% e suplementar com Vitamina C e imunoestimulantes.",
    prevencao: "Uso de linhagens genéticas resistentes (SPR/SPF), manter oxigênio > 4.5 mg/L, evitar densidades excessivas em viveiros sem aeração e respeitar horários de manejo apenas nas horas mais frescas."
  },
  {
    id: "ahpnd",
    nome: "Hepatopancreatite Necrosante Aguda (EMS)",
    sigla: "AHPND / EMS",
    tipo: "Bacteriana (Vibrio parahaemolyticus com toxina PirA/PirB)",
    gravidade: "Extrema (Até 100% de mortalidade nas primeiras semanas)",
    cor: "rose",
    periodoCritico: "Primeiros 20 a 35 dias após o povoamento (DOC 20-35)",
    sintomas: [
      "Hepatopâncreas gravemente atrofiado, pálido, esbranquiçado ou translúcido",
      "Trato digestivo (intestino) totalmente vazio",
      "Carapaça mole e flácida",
      "Camarões nadando em espiral ou caindo para o fundo do tanque"
    ],
    acaoEmergencia: "Aplicar probióticos com cepas de Bacillus e bactérias láticas em doses de choque para competição biológica. Suspender arraçoamento por 24h a 48h. Remover lodo do fundo se o sistema possuir dreno central.",
    prevencao: "Fase de berçário protegido antes da engorda, dessecação e desinfecção enérgica do fundo entre ciclos, e biorremediação biológica profilática permanente da água."
  },
  {
    id: "nhp",
    nome: "Hepatopancreatite Necrosante Bacteriana",
    sigla: "NHP",
    tipo: "Bactéria Intracelular Obrigatória",
    gravidade: "Moderada a Alta (Mortalidade lenta acumulada até 80%)",
    cor: "yellow",
    periodoCritico: "Águas quentes (> 29°C) combinadas com alta salinidade (> 25 ppt)",
    sintomas: [
      "Hepatopâncreas atrófico, aquoso e com coloração amarelada ou desbotada",
      "Redução drástica do apetite e retardo no crescimento do lote",
      "Exoesqueleto frouxo com presença de incrustações (fouling/sujeira aderida na casca)",
      "Brânquias escuras e bordas dos urópodes necrosadas"
    ],
    acaoEmergencia: "Correção de parâmetros ambientais (reduzir temperatura via lâmina d'água mais profunda se possível), reduzir densidade de ração e utilizar aditivos funcionais fitoterápicos permitidos na ração sob supervisão técnica.",
    prevencao: "Controle rígido da matéria orgânica no fundo do viveiro, não deixar salinidade e temperatura ultrapassarem limites críticos simultaneamente."
  },
  {
    id: "ehp",
    nome: "Microsporidiose Hepatopancreática",
    sigla: "EHP",
    tipo: "Microsporídio (Enterocytozoon hepatopenaei)",
    gravidade: "Econômica Severa (Estagnação de crescimento / 'Camarão Canivete')",
    cor: "amber",
    periodoCritico: "Presente silenciosamente desde o povoamento, manifesta-se aos 5-8 gramas",
    sintomas: [
      "Retardo severo e inexplicável no crescimento (camarão não passa de 6-8g)",
      "Desuniformidade extrema no lote (camarões muito pequenos misturados com médios)",
      "Piora acentuada na Conversão Alimentar (FCA > 2.2)",
      "Carapaça transparente e hepatopâncreas esbranquiçado à microscopia"
    ],
    acaoEmergencia: "Não há cura medicamentosa no viveiro. Planejar despesca antecipada para evitar prejuízo com ração desperdiçada. Não transferir animais ou equipamentos para viveiros sadios.",
    prevencao: "Exame PCR rigoroso de todas as pós-larvas antes da compra. Desinfecção profunda do fundo do viveiro com Cal Virgem (CaO) para elevar o pH do solo acima de 11.0 e destruir esporos altamente resistentes."
  },
  {
    id: "vibriose",
    nome: "Vibriose Sistêmica & Síndrome da Casca Mole",
    sigla: "Vibriose",
    tipo: "Bacteriana Oportunista (Vibrio alginolyticus, V. harveyi)",
    gravidade: "Média a Alta (Depende da qualidade da água)",
    cor: "teal",
    periodoCritico: "Viveiros com excesso de matéria orgânica no fundo e baixa alcalinidade (< 90 mg/L)",
    sintomas: [
      "Bioluminescência noturna visível no viveiro e nos camarões (cepas de V. harveyi)",
      "Manchas marrons ou pretas (melanização) nas patas, pleópodes e brânquias",
      "Incapacidade de endurecer a casca após a muda (síndrome da casca mole)",
      "Antenas quebradas e urópodes avermelhados"
    ],
    acaoEmergencia: "Elevar a alcalinidade total imediatamente para > 130 mg/L com Bicarbonato de Sódio. Aplicar probióticos bioantagonistas na água e no alimento. Troca parcial de água se a qualidade da fonte permitir.",
    prevencao: "Monitorar a contagem de bactérias verdes e amarelas em placas TCBS. Manter aeração adequada para manter o potencial redox do fundo positivo."
  }
];

export const BOAS_PRATICAS_ABCC = [
  {
    id: "preparo",
    fase: "1. Preparo e Dessecação do Viveiro",
    descricao: "Limpeza mecânica e sanitária antes de receber novas pós-larvas",
    itens: [
      { id: "p1", titulo: "Secagem e Dessecação Solar", detalhe: "Manter o viveiro seco ao sol por 10 a 15 dias até abrir fendas de 2 a 5 cm no lodo, oxidando a matéria orgânica.", obrigatorio: true },
      { id: "p2", titulo: "Remoção de Sedimentos Negros", detalhe: "Retirar o lodo anaeróbio acumulado nos pontos de baixa drenagem ou próximo às comportas de saída.", obrigatorio: true },
      { id: "p3", titulo: "Calagem do Solo com Calcário ou Cal Virgem", detalhe: "Aplicar dose técnica conforme pH do solo (1.000 a 3.000 kg/ha) e gradear a 10-15 cm para neutralizar sulfetos.", obrigatorio: true },
      { id: "p4", titulo: "Filtração da Água de Abastecimento", detalhe: "Instalar telas de filtragem dupla (malha de 250 a 500 micras) na comporta de entrada para barrar vetores de vírus.", obrigatorio: true }
    ]
  },
  {
    id: "aquisicao",
    fase: "2. Aquisição e Aclimatação de Pós-Larvas (PLs)",
    descricao: "Controle de qualidade genética e higiênico-sanitária",
    itens: [
      { id: "a1", titulo: "Pós-Larvas com Laudo PCR Negativo (SPF)", detalhe: "Adquirir exclusivamente PLs com certificado negativo para WSSV, IMNV, IHHNV e AHPND emitido por laboratório idôneo.", obrigatorio: true },
      { id: "a2", titulo: "Teste de Estresse de Salinidade e Térmico", detalhe: "Submeter amostra de PLs a teste de choque salino (choque de 50% por 30 min) com sobrevivência mínima de 80%.", obrigatorio: true },
      { id: "a3", titulo: "Aclimatação Lenta na Fazenda", detalhe: "Igualar temperatura (< 1°C de diferença) e salinidade (< 2-3 ppt por hora) em tanques de aclimatação com oxigênio suplementar.", obrigatorio: true },
      { id: "a4", titulo: "Soltura nas Horas Mais Frescas", detalhe: "Povoar o viveiro no início da manhã (antes das 08:00) ou ao entardecer para evitar estresse térmico.", obrigatorio: true }
    ]
  },
  {
    id: "manejo_alimentar",
    fase: "3. Boas Práticas de Alimentação e Arraçoamento",
    descricao: "Eficiência zootécnica e prevenção de poluição do fundo",
    itens: [
      { id: "m1", titulo: "Arraçoamento Baseado em Biometria Real", detalhe: "Ajustar o cálculo de ração semanalmente com base na biomassa estimada e taxa percentual de tabela zootécnica.", obrigatorio: true },
      { id: "m2", titulo: "Uso Obrigatório de Comedouros (Bandejas)", detalhe: "Instalar de 20 a 30 bandejas por hectare com 2% a 5% da cota diária para monitorar o apetite após 1h30 a 2h.", obrigatorio: true },
      { id: "m3", titulo: "Corte Imediato em Sobras > 25%", detalhe: "Se houver sobras nas bandejas, reduzir 25% a 50% da próxima oferta para evitar fermentação tóxica.", obrigatorio: true },
      { id: "m4", titulo: "Armazenamento Correto de Ração", detalhe: "Guardar sacarias sobre estrados de madeira a 15 cm do chão e longe de paredes, em local fresco e arejado (< 30 dias).", obrigatorio: false }
    ]
  },
  {
    id: "biosseguranca",
    fase: "4. Biossegurança e Sanidade de Campo",
    descricao: "Proteção contra contaminação cruzada e patógenos externos",
    itens: [
      { id: "b1", titulo: "Desinfecção de Redes e Tarrafas", detalhe: "Mergulhar tarrafas, baldes e caixas em solução desinfetante (amônia quaternária ou cloro) antes de usar em outro viveiro.", obrigatorio: true },
      { id: "b2", titulo: "Proibição de Descarte de Água Contaminada", detalhe: "Viveiros com suspeita de doença jamais devem ser drenados sem tratamento prévio de desinfecção química.", obrigatorio: true },
      { id: "b3", titulo: "Controle de Acesso de Veículos e Pessoas", detalhe: "Restringir entrada de caminhões e visitantes não autorizados nas margens de cultivo.", obrigatorio: false },
      { id: "b4", titulo: "Uso Contínuo de Probióticos Benéficos", detalhe: "Adicionar bactérias nitrificantes e Bacillus na água para exclusão competitiva contra Vibrios patogênicos.", obrigatorio: true }
    ]
  }
];


// ============================================================================
// 1. CLASSIFICAÇÃO COMERCIAL POR CALIBRE (camarão inteiro - HOSO)
// A contagem é o padrão internacional do comércio: unidades por libra (count/lb).
// Conversão: un/kg = contagem ÷ 0,4536  |  peso médio (g) = 1000 ÷ (un/kg)
// Ex.: calibre 41/50 -> 90 a 110 un/kg -> peso médio de 9,1 a 11,1 g
// ============================================================================
export const TABELA_CALIBRE_MERCADO = [
  { calibre: "16/20", minPorLibra: 16, maxPorLibra: 20, classe: "Extra grande", destino: "Exportação premium", observacao: "Ciclo longo (140+ dias) e densidade baixa. Maior risco, maior valor por kg." },
  { calibre: "21/25", minPorLibra: 21, maxPorLibra: 25, classe: "Grande", destino: "Exportação / mercado premium", observacao: "Exige crescimento acima de 0,20 g/dia de forma sustentada." },
  { calibre: "26/30", minPorLibra: 26, maxPorLibra: 30, classe: "Grande", destino: "Exportação / mercado interno premium", observacao: "Calibre típico de despesca em ciclos de 110 a 130 dias." },
  { calibre: "31/35", minPorLibra: 31, maxPorLibra: 35, classe: "Médio-grande", destino: "Exportação / mercado interno premium", observacao: "Faixa de maior rentabilidade na maioria dos ciclos semi-intensivos (13 a 15 g)." },
  { calibre: "36/40", minPorLibra: 36, maxPorLibra: 40, classe: "Médio", destino: "Mercado interno e exportação", observacao: "Alvo de despesca mais comum em 90 a 110 dias de cultivo." },
  { calibre: "41/50", minPorLibra: 41, maxPorLibra: 50, classe: "Médio", destino: "Mercado interno e exportação", observacao: "Faixa mais líquida do mercado brasileiro (9 a 11 g)." },
  { calibre: "51/60", minPorLibra: 51, maxPorLibra: 60, classe: "Médio-pequeno", destino: "Mercado interno / restaurantes", observacao: "Comum em despescas antecipadas por sanidade, preço ou oxigênio." },
  { calibre: "61/70", minPorLibra: 61, maxPorLibra: 70, classe: "Pequeno", destino: "Mercado interno / varejo", observacao: "Sinal de ciclo interrompido ou alta densidade com baixo crescimento." },
  { calibre: "71/90", minPorLibra: 71, maxPorLibra: 90, classe: "Pequeno", destino: "Varejo / processamento", observacao: "Valor unitário baixo. Revisar densidade, arraçoamento e qualidade de água." },
  { calibre: "91/130", minPorLibra: 91, maxPorLibra: 130, classe: "Mini / descarte", destino: "Processamento / isca", observacao: "Indica falha grave de manejo (anoxia, doença, densidade excessiva) ou despesca de emergência." }
];

// ============================================================================
// 2. GRANULOMETRIA E PROTEÍNA DA RAÇÃO POR FASE (ração extrusada)
// Faixas usuais de mercado. Sempre confirmar a tabela do fabricante utilizado.
// ============================================================================
export const TABELA_GRANULOMETRIA_RACAO = [
  { minPeso: 0.0, maxPeso: 0.2, fase: "Berçário / PL", granulometriaMinMm: 0.3, granulometriaMaxMm: 0.8, formato: "Farelada (pó)", proteinaBrutaMin: 40, proteinaBrutaMax: 45, observacao: "Nas primeiras 2 semanas considerar oferta em pó fino e/ou alimento natural (bloom)." },
  { minPeso: 0.2, maxPeso: 1.0, fase: "Pós-berçário", granulometriaMinMm: 0.8, granulometriaMaxMm: 1.2, formato: "Micro-extrusada", proteinaBrutaMin: 40, proteinaBrutaMax: 42, observacao: "Transição crítica: misturar granulometrias por 2 a 3 dias para evitar desperdício." },
  { minPeso: 1.0, maxPeso: 3.0, fase: "Juvenil inicial", granulometriaMinMm: 1.2, granulometriaMaxMm: 1.5, formato: "Extrusada", proteinaBrutaMin: 38, proteinaBrutaMax: 40, observacao: "Início do uso de bandejas de alimentação para calibrar a oferta." },
  { minPeso: 3.0, maxPeso: 5.0, fase: "Juvenil médio", granulometriaMinMm: 1.8, granulometriaMaxMm: 2.0, formato: "Extrusada / triturada", proteinaBrutaMin: 35, proteinaBrutaMax: 38, observacao: "Ajuste fino das bandejas a cada 2h a 2h30 após a oferta." },
  { minPeso: 5.0, maxPeso: 10.0, fase: "Engorda inicial", granulometriaMinMm: 2.2, granulometriaMaxMm: 2.5, formato: "Extrusada", proteinaBrutaMin: 32, proteinaBrutaMax: 35, observacao: "Período de maior consumo de ração e maior carga de nitrogênio no viveiro." },
  { minPeso: 10.0, maxPeso: 15.0, fase: "Engorda final", granulometriaMinMm: 2.5, granulometriaMaxMm: 3.0, formato: "Extrusada", proteinaBrutaMin: 30, proteinaBrutaMax: 32, observacao: "Monitorar FCA: é a fase que define a rentabilidade do ciclo." },
  { minPeso: 15.0, maxPeso: 60.0, fase: "Despesca / acabamento", granulometriaMinMm: 3.0, granulometriaMaxMm: 3.5, formato: "Extrusada", proteinaBrutaMin: 28, proteinaBrutaMax: 30, observacao: "Reduzir oferta nas 24 h antes da despesca para limpar o trato digestivo." }
];

// ============================================================================
// 3. CURVA DE CRESCIMENTO ESPERADA — L. vannamei (referência de benchmark)
// Condições de referência: 28 a 31 °C, salinidade 15 a 30 ppt, manejo
// semi-intensivo com aeração. Serve como linha de base para comparar biometrias;
// ajustar conforme região, linhagem, densidade e época do ano.
// GPD = ganho de peso diário médio da semana (g/dia).
// ============================================================================
export const CURVA_CRESCIMENTO_VANNAMEI = [
  { semana: 1, pesoEsperadoG: 0.25, gpdEsperadoG: 0.036, observacao: "Adaptação e aclimatação. Oferta em pó." },
  { semana: 2, pesoEsperadoG: 0.75, gpdEsperadoG: 0.071, observacao: "Início da alimentação em bandeja." },
  { semana: 3, pesoEsperadoG: 1.50, gpdEsperadoG: 0.107, observacao: "Crescimento exponencial inicial." },
  { semana: 4, pesoEsperadoG: 2.40, gpdEsperadoG: 0.129, observacao: "Verificar uniformidade do lote." },
  { semana: 5, pesoEsperadoG: 3.50, gpdEsperadoG: 0.157, observacao: "Primeira troca de granulometria relevante." },
  { semana: 6, pesoEsperadoG: 4.70, gpdEsperadoG: 0.171, observacao: "Início do controle rigoroso de bandejas." },
  { semana: 7, pesoEsperadoG: 5.90, gpdEsperadoG: 0.171, observacao: "Vigiar amônia total e oxigênio no fundo." },
  { semana: 8, pesoEsperadoG: 7.10, gpdEsperadoG: 0.171, observacao: "Carga de biomassa exige aeração noturna." },
  { semana: 9, pesoEsperadoG: 8.30, gpdEsperadoG: 0.171, observacao: "Checar alcalinidade (muda frequente)." },
  { semana: 10, pesoEsperadoG: 9.50, gpdEsperadoG: 0.171, observacao: "Faixa de calibre 41/50." },
  { semana: 11, pesoEsperadoG: 10.60, gpdEsperadoG: 0.157, observacao: "Avaliar preço de mercado para decidir despesca." },
  { semana: 12, pesoEsperadoG: 11.60, gpdEsperadoG: 0.143, observacao: "Momento típico de despesca comercial." },
  { semana: 13, pesoEsperadoG: 12.50, gpdEsperadoG: 0.129, observacao: "Ponto de equilíbrio entre crescimento e custo de ração." },
  { semana: 14, pesoEsperadoG: 13.30, gpdEsperadoG: 0.114, observacao: "Crescimento desacelera; FCA começa a subir." },
  { semana: 15, pesoEsperadoG: 14.00, gpdEsperadoG: 0.100, observacao: "Só compensa manter se o calibre valorizar bastante." },
  { semana: 16, pesoEsperadoG: 14.60, gpdEsperadoG: 0.086, observacao: "Curva em platô. Avaliar risco sanitário do ciclo longo." }
];

// ============================================================================
// 4. BALANÇO IÔNICO PARA ÁGUAS DE BAIXA SALINIDADE (< 5 ppt)
// Em águas interiores o risco não é a salinidade em si, mas o desequilíbrio entre
// os íons: águas de poço são tipicamente deficientes em K+ e Mg2+, e essa
// deficiência pesa mais na sobrevivência que a salinidade baixa em si.
//
// ALVO AUTOMÁTICO: multiplicando a salinidade (ppt) pelo FATOR DE DILUIÇÃO da
// água do mar obtém-se a concentração mínima desejada (SEC) do íon em mg/L.
// Ex.: 4 ppt -> Ca = 4 × 11,6 = 46,4 mg/L.
// O alvo final é o MAIOR valor entre o SEC e o piso prático de manejo.
//
// Fontes: CIBA (Extension Series nº 52) e TheFishSite (minerais em baixa salinidade);
// relações Na:K = 28:1 e Mg:Ca = 3:1 confirmadas em literatura brasileira e indiana.
// Relações e concentrações em base mássica (mg/L).
// ============================================================================
export const PARAMETROS_BALANCO_IONICO = {
  aviso: "Faixas de referência para manejo. Não substituem a análise laboratorial da água e a recomendação de um técnico responsável.",

  // Multiplique pela salinidade (ppt) para obter o alvo mínimo de cada íon (mg/L)
  fatoresDiluicaoAguaMar: {
    na: 304.5,
    potassio: 10.7,
    magnesio: 39.1,
    calcio: 11.6,
    cloreto: 551,
    sulfato: 78.3
  },

  // Pisos práticos citados para água de baixa salinidade (mg/L)
  minimosPraticos: {
    potassio: 50,
    magnesio: 100,
    calcio: 30,
    alcalinidade: 75,
    observacao: "O alvo final de cada íon é o MAIOR valor entre o SEC (salinidade × fator) e este piso. Alcalinidade abaixo de 50 mg/L dificulta a muda."
  },

  ions: {
    potassio: { chave: "potassio", nome: "Potássio (K+)", unidade: "mg/L", fator: 10.7, minimoPratico: 50, observacao: "Deficiência de K+ é a causa clássica de baixa sobrevivência em água doce. Fonte: KCl." },
    calcio: { chave: "calcio", nome: "Cálcio (Ca2+)", unidade: "mg/L", fator: 11.6, minimoPratico: 30, observacao: "Essencial na ecdise (formação do exoesqueleto). Fontes: CaCl2, calcário, gesso." },
    magnesio: { chave: "magnesio", nome: "Magnésio (Mg2+)", unidade: "mg/L", fator: 39.1, minimoPratico: 100, observacao: "Cofator enzimático e componente da carapaça. Ganhos zootécnicos relatados ao subir Mg de 40 para 80 mg/L. Fonte: MgSO4." },
    sodio: { chave: "sodio", nome: "Sódio (Na+)", unidade: "mg/L", fator: 304.5, minimoPratico: null, observacao: "Não se corrige sódio diretamente: vem da salinidade e da renovação. O manejo é ajustar K, Ca e Mg em relação a ele." }
  },

  relacoes: {
    naK: { nome: "Relação Na:K", alvo: 28, minimo: 20, maximo: 35, base: "mássica (mg/L de Na ÷ mg/L de K)", observacao: "Relação mais importante em água de baixa salinidade. Acima de 35 indica K+ insuficiente." },
    mgCa: { nome: "Relação Mg:Ca", alvo: 3.0, minimo: 2.5, maximo: 3.4, base: "mássica (mg/L de Mg ÷ mg/L de Ca)", observacao: "A literatura cita 3:1 para melhor sobrevivência e 3,4:1 como preferencial." },
    caK: { nome: "Relação Ca:K", alvo: 1.0, minimo: 0.7, maximo: 1.5, base: "mássica (mg/L de Ca ÷ mg/L de K)", observacao: "Na água do mar é próxima de 1:1." }
  }
};

// ============================================================================
// 5. PRODUTOS PARA CORREÇÃO IÔNICA
// "elementos" traz a fração mássica de cada elemento no produto comercial puro.
// Dose (kg) = [déficit (mg/L) × volume (m³)] ÷ [1000 × fração do elemento]
// Verificar sempre o teor real no rótulo (produtos comerciais variam bastante).
// ============================================================================
export const PRODUTOS_CORRECAO_IONICA = [
  { produto: "Cloreto de Cálcio dihidratado", formula: "CaCl2.2H2O", elementos: { Ca: 27.2 }, observacao: "Alta solubilidade e ação rápida. Não altera o pH." },
  { produto: "Gesso agrícola", formula: "CaSO4.2H2O", elementos: { Ca: 23.3 }, observacao: "Liberação mais lenta; também auxilia na floculação de argila e no controle de alcalinidade alta." },
  { produto: "Calcário dolomítico", formula: "CaCO3.MgCO3", elementos: { Ca: 21.7, Mg: 13.2 }, observacao: "Fonte dupla de Ca e Mg. Eleva o pH — evitar em água com pH já alto." },
  { produto: "Sulfato de Magnésio (sal amargo)", formula: "MgSO4.7H2O", elementos: { Mg: 9.9 }, observacao: "Produto mais usado para corrigir Mg. Alta solubilidade." },
  { produto: "Cloreto de Potássio", formula: "KCl", elementos: { K: 52.4 }, observacao: "Fonte padrão de K. Aplicar diluído e distribuído, nunca concentrado em um ponto." },
  { produto: "Sulfato de Potássio", formula: "K2SO4", elementos: { K: 44.9 }, observacao: "Alternativa ao KCl quando se quer evitar excesso de cloreto." },
  { produto: "Sal grosso (cloreto de sódio)", formula: "NaCl", elementos: { Na: 39.3 }, observacao: "Usado para elevar cloretos e reduzir a toxicidade do nitrito em água doce." }
];

// ============================================================================
// 6. FONTES DE CARBONO PARA CONTROLE DE NITROGÊNIO (BFT / bioflocos)
// Valores aproximados de referência (% de carbono e de nitrogênio na matéria
// seca/tal qual). Servem para orientar a dose, não para substituir a medição
// de amônia e a observação do floco.
// ============================================================================
// Fontes: materiais ABCCam/Zeigler (Samocha) e Revista ABCC (2024). O melaço tem
// teor de carbono muito variável (24% a 37,5%); o açúcar refinado (42,1% de C) é
// mais previsível e, em estudo do Instituto de Pesca, apresentou custo por kg de
// camarão produzido 62% menor que o melaço, sem perda de índice produtivo.
export const FONTES_CARBONO_BFT = [
  { fonte: "Melaço de cana-de-açúcar", carbonoPercent: 35, nitrogenioPercent: 0.4, observacao: "Fonte mais usada, mas com teor de C variável (24% a 37,5%) e ~13% de cinzas, o que gera mais sólidos. Diluir antes de aplicar." },
  { fonte: "Açúcar cristal (sacarose)", carbonoPercent: 42, nitrogenioPercent: 0, observacao: "Teor de carbono previsível (42,1%). Resposta rápida: fracionar e manter aeração, pois o consumo de C derruba o oxigênio." },
  { fonte: "Açúcar refinado (referência de custo)", carbonoPercent: 42, nitrogenioPercent: 0, observacao: "Mesmo carbono do cristal, usado como base de comparação de custo por kg de camarão produzido." },
  { fonte: "Dextrose / glicose", carbonoPercent: 40, nitrogenioPercent: 0, observacao: "Alta solubilidade e resposta imediata; custo mais elevado." },
  { fonte: "Farelo de trigo", carbonoPercent: 45, nitrogenioPercent: 2.5, observacao: "Também serve de substrato particulado para o floco." },
  { fonte: "Farelo de arroz", carbonoPercent: 40, nitrogenioPercent: 1.5, observacao: "Alternativa regional de baixo custo." },
  { fonte: "Tapioca / raspa de mandioca", carbonoPercent: 40, nitrogenioPercent: 0.9, observacao: "Boa relação custo/benefício em algumas regiões." }
];

// ============================================================================
// 7. SISTEMAS DE CULTIVO — densidade, aeração e produtividade de referência
// Faixas usuais por nível de intensificação. Aeração em HP por hectare,
// considerando aeradores de pás e/ou sopradores, com uso noturno obrigatório.
// ============================================================================
// Produtividade conferida pela identidade:
// kg/ha/ciclo = densidade (cam/m²) × 10.000 × sobrevivência × peso final (g) ÷ 1000
// Ex.: 12 cam/m², 75% de sobrevivência e 12 g -> 1.080 kg/ha/ciclo (estudo comercial
// brasileiro semi-intensivo relata 1.022 kg/ha/ciclo, dentro da faixa abaixo).
export const SISTEMAS_CULTIVO = [
  { sistema: "Extensivo", densidadeMinM2: 1, densidadeMaxM2: 5, aeracaoHpHaMin: 0, aeracaoHpHaMax: 2, produtividadeMinKgHa: 300, produtividadeMaxKgHa: 1000, regimeAeracao: "Sem aeração ou apenas emergencial", observacao: "Depende do alimento natural do viveiro. Sem ração ou com suplementação mínima." },
  { sistema: "Semi-intensivo", densidadeMinM2: 5, densidadeMaxM2: 20, aeracaoHpHaMin: 2, aeracaoHpHaMax: 8, produtividadeMinKgHa: 700, produtividadeMaxKgHa: 2500, regimeAeracao: "Noturna (por volta das 20h até o amanhecer)", observacao: "Ração completa + aeração noturna + fertilização para bloom. Sistema mais comum no Brasil." },
  { sistema: "Intensivo", densidadeMinM2: 20, densidadeMaxM2: 50, aeracaoHpHaMin: 10, aeracaoHpHaMax: 22, produtividadeMinKgHa: 2000, produtividadeMaxKgHa: 6000, regimeAeracao: "Noturna estendida + reforço no amanhecer", observacao: "Troca zero com probióticos ou alta renovação. Exige monitoramento diário de oxigênio." },
  { sistema: "Super-intensivo / BFT", densidadeMinM2: 50, densidadeMaxM2: 250, aeracaoHpHaMin: 26, aeracaoHpHaMax: 40, produtividadeMinKgHa: 5000, produtividadeMaxKgHa: 30000, regimeAeracao: "24 horas por dia", observacao: "Bioflocos com relação C:N controlada (10:1 a 15:1) e aeração contínua. Alta exigência técnica e de energia." }
];

// ============================================================================
// 7.1 AERAÇÃO POR DENSIDADE (aeradores de pás)
// Tabela da Cartilha de IMNV (ABCCam) para dimensionamento em HP por hectare.
// Valores intermediários são interpolados linearmente pelo serviço.
// Referência complementar: em sistemas intensivos a ABCCAM recomenda aeração
// 24 h/dia mantendo oxigênio dissolvido acima de 4 mg/L (ideal acima de 5 mg/L).
// ============================================================================
export const TABELA_AERACAO_POR_DENSIDADE = [
  { densidadeM2: 5, hpHaMin: 1, hpHaMax: 2 },
  { densidadeM2: 10, hpHaMin: 2, hpHaMax: 3 },
  { densidadeM2: 20, hpHaMin: 2, hpHaMax: 4 },
  { densidadeM2: 30, hpHaMin: 2, hpHaMax: 4 },
  { densidadeM2: 40, hpHaMin: 6, hpHaMax: 8 },
  { densidadeM2: 60, hpHaMin: 12, hpHaMax: 14 },
  { densidadeM2: 70, hpHaMin: 16, hpHaMax: 16 },
  { densidadeM2: 80, hpHaMin: 18, hpHaMax: 20 },
  { densidadeM2: 90, hpHaMin: 22, hpHaMax: 22 },
  { densidadeM2: 100, hpHaMin: 26, hpHaMax: 26 },
  { densidadeM2: 120, hpHaMin: 32, hpHaMax: 32 },
  { densidadeM2: 150, hpHaMin: 40, hpHaMax: 40 }
];

// Fator de conversão da demanda de aeração por tipo de equipamento.
// A tabela acima refere-se a aeradores de pás; difusores/sopradores entregam
// o mesmo oxigênio com cerca de 1/3 da potência (4 a 8 HP/ha contra 10 a 24 HP/ha).
export const TIPOS_AERADOR = [
  { tipo: "Aerador de pás (paddle wheel)", fatorPotencia: 1.0, observacao: "Padrão em viveiros de terra. Referência da tabela de HP/ha." },
  { tipo: "Difusor / soprador (ar comprimido)", fatorPotencia: 0.35, observacao: "Mesmo oxigênio com 1/3 da potência, porém exige tubulação e soprador; muito usado em BFT e viveiros revestidos." },
  { tipo: "Aerador vertical / alta eficiência", fatorPotencia: 0.7, observacao: "Boa eficiência energética em lâminas de água maiores." }
];

// ============================================================================
// 8. METAS DE ÍNDICES ZOOTÉCNICOS (benchmark de desempenho do ciclo)
// "melhorQuando" indica a direção da melhoria: para FCA, quanto MENOR, melhor.
// ============================================================================
// Referências: FCA de 1,2 a 1,5 é considerado bom para ração balanceada
// (Talavera et al., 2005; Martínez, 2012); estudo comercial brasileiro semi-intensivo
// com 60 lotes obteve FCA médio de 1,22, sobrevivência de ~68% e 1.022 kg/ha/ciclo.
// A produtividade é muito dependente da densidade: o padrão aqui é uma faixa
// semi-intensiva. Para densidades maiores, use o alvo calculado a partir da
// densidade e sobrevivência do viveiro (o serviço aceita metas sob medida).
export const METAS_INDICES_ZOOTECNICOS = {
  sobrevivenciaPercent: { nome: "Sobrevivência", unidade: "%", melhorQuando: "maior", otimo: 85, bom: 75, atencao: 60, observacao: "Abaixo de 60% investigar sanidade, qualidade de água e aclimatação das PLs." },
  fca: { nome: "Conversão Alimentar (FCA)", unidade: "kg ração / kg camarão", melhorQuando: "menor", otimo: 1.25, bom: 1.5, atencao: 1.9, observacao: "Sobe naturalmente durante a muda (o camarão se enterra e não come). Acima de 2,0 revisar bandejas, granulometria e oxigênio." },
  gpdG: { nome: "Ganho de Peso Diário (GPD)", unidade: "g/dia", melhorQuando: "maior", otimo: 0.22, bom: 0.18, atencao: 0.12, observacao: "Semi-intensivo costuma ficar entre 0,21 e 0,36 g/dia (1,5 a 2,5 g/semana). Comparar com a curva esperada da semana." },
  produtividadeKgHaCiclo: { nome: "Produtividade por ciclo", unidade: "kg/ha/ciclo", melhorQuando: "maior", otimo: 2500, bom: 1500, atencao: 800, observacao: "Faixa de referência semi-intensiva. Depende da densidade: use o alvo calculado do viveiro para densidades maiores." },
  pesoDespescaG: { nome: "Peso médio na despesca", unidade: "g", melhorQuando: "maior", otimo: 14, bom: 11, atencao: 8, observacao: "Peso alvo depende do calibre que o mercado comprador está pagando melhor." }
};

// ============================================================================
// 9. PRODUTOS DE MANEJO — FAIXAS DE DOSE USUAIS
// ATENÇÃO: as faixas abaixo são apenas referências gerais de literatura e
// variam conforme o princípio ativo, a formulação e o fabricante. A dose
// correta é SEMPRE a do rótulo do produto e/ou a prescrita pelo técnico
// responsável. Dose excessiva de oxidantes e cloro causa mortalidade em massa.
// ============================================================================
export const PRODUTOS_MANEJO_DOSES = [
  { produto: "Cal clorada (hipoclorito de cálcio 65%)", uso: "Desinfecção de viveiro vazio e da água de abastecimento", doseReferencia: "10 a 20 g/m³ (100 a 200 kg/ha)", cuidado: "Só usar com viveiro SEM camarão. Neutralizar o cloro residual antes do povoamento e confirmar com teste." },
  { produto: "Melaço de cana", uso: "Controle de nitrogênio / bioflocos", doseReferencia: "10 a 30 kg/ha por semana, fracionado", cuidado: "Aplicar pela manhã e com aeração ligada; o consumo de carbono reduz o oxigênio da água." },
  { produto: "Probióticos (Bacillus spp.)", uso: "Controle de matéria orgânica e nitrogênio", doseReferencia: "0,5 a 2 g/m³ (5 a 20 kg/ha)", cuidado: "Ativar em água aerada antes de aplicar. Não misturar com desinfetantes." },
  { produto: "Vitamina C (ácido ascórbico estabilizado)", uso: "Suplementação em ração (estresse, muda, transporte)", doseReferencia: "2 a 5 g/kg de ração", cuidado: "Aplicar com aglutinante/óleo para não lixiviar na água." },
  { produto: "Sal grosso (NaCl)", uso: "Elevar cloretos e reduzir toxicidade do nitrito", doseReferencia: "Conforme análise: relação cloreto:nitrito de 6:1 ou mais", cuidado: "Calcular com base na análise de água, não por estimativa visual." },
  { produto: "Zeólita", uso: "Adsorção de amônia em situações de emergência", doseReferencia: "100 a 300 kg/ha", cuidado: "Ação paliativa: não substitui renovação, aeração nem o controle da ração." }
];

// ============================================================================
// 10. CHECKLIST DO PERÍODO ENTRE CICLOS (preparo de viveiro)
// ============================================================================
export const CHECKLIST_ENTRE_CICLOS = [
  { etapa: "Despesca e drenagem total", prazoDias: "Dia 0", descricao: "Despescar, drenar completamente e registrar os índices finais do ciclo (FCA, sobrevivência, calibre)." },
  { etapa: "Secagem do fundo", prazoDias: "10 a 15 dias", descricao: "Secar até o lodo abrir rachaduras de 2 a 5 cm. A oxidação ao sol elimina sulfetos e matéria orgânica redutora." },
  { etapa: "Remoção do lodo preto", prazoDias: "Após a secagem", descricao: "Remover a camada de lodo preto acumulada (especialmente no centro e nas zonas de arraçoamento)." },
  { etapa: "Análise de solo", prazoDias: "Antes da calagem", descricao: "Coletar amostras compostas do fundo e medir pH e matéria orgânica para dimensionar a calagem." },
  { etapa: "Calagem do fundo", prazoDias: "15 a 30 dias antes do povoamento", descricao: "Aplicar calcário conforme análise e incorporar de 10 a 15 cm com gradagem leve." },
  { etapa: "Enchimento com filtragem", prazoDias: "10 a 15 dias antes", descricao: "Encher com água filtrada em tela fina para barrar peixes, ovos e crustáceos invasores (risco de IHHNV e competidores)." },
  { etapa: "Fertilização para bloom", prazoDias: "7 a 10 dias antes", descricao: "Estimular fitoplâncton para garantir alimento natural e estabilidade de oxigênio. Mirar transparência de 30 a 45 cm." },
  { etapa: "Análise de água pré-povoamento", prazoDias: "3 a 5 dias antes", descricao: "Medir alcalinidade, pH, salinidade, Ca, Mg, K, Na e nitrogênio. Corrigir o balanço iônico ANTES de povoar." },
  { etapa: "Aclimatação das PLs", prazoDias: "Dia do povoamento", descricao: "Equalizar temperatura e salinidade de forma gradual (2 a 3 horas). Diferença de salinidade acima de 5 ppt exige aclimatação lenta." },
  { etapa: "Povoamento", prazoDias: "Preferência início da manhã ou noite", descricao: "Evitar povoar em pico de muda ou com oxigênio baixo. Distribuir as PLs nas bordas, contra o vento." }
];
