// Catálogo oficial de fabricantes de ração para camarão (Litopenaeus vannamei),
// níveis nutricionais de garantia por fase (Juvenil e Engorda),
// rede de vendedores/representantes comerciais locais por Estado
// e sistema de patrocinadores/anúncios do CarcinoGestão.

export const FABRICANTES_RACAO = [
  {
    id: "adm",
    nome: "ADM Nutrição Animal",
    linhas: "Camanutri & Density",
    slogan: "Nutrição de alta digestibilidade e performance zootécnica comprovada",
    badge: "Parceiro Homologado",
    cor: "blue",
    logoText: "ADM",
    descricao: "Linha formulada com ingredientes nobres, alta atratividade e hidroestabilidade superior para sistemas semi-intensivos a intensivos.",
    fases: {
      juvenil: {
        nomeLinha: "Camanutri 37 J / Density 38 J",
        fase: "Juvenil / Berçário",
        pesoMinG: 0.2,
        pesoMaxG: 3.5,
        pbPercent: 37.0, // Proteína Bruta Mínima
        eePercent: 8.0,  // Extrato Etéreo (Gordura) Mínimo
        fbPercent: 4.0,  // Fibra Bruta Máxima
        umidadePercent: 12.0, // Umidade Máxima
        mineralPercent: 13.0, // Matéria Mineral Máxima
        calcioPercent: 2.5,
        fosforoPercent: 1.2,
        pelletMm: "1.2 a 1.6 mm",
        tratosSugeridos: "4 a 5x ao dia",
        ajudaTecnica: "Fórmula de alta densidade proteica para aceleração da curva de crescimento inicial. Distribuir ao redor de todo o viveiro e começar a introduzir bandejas de monitoramento a partir de 1,5 g."
      },
      engorda: {
        nomeLinha: "Camanutri 35 J / Camanutri 30 J",
        fase: "Engorda / Crescimento",
        pesoMinG: 3.5,
        pesoMaxG: 30.0,
        pbPercent: 35.0, // Proteína Bruta Mínima (ou 30% na fase final)
        eePercent: 7.5,
        fbPercent: 5.0,
        umidadePercent: 13.0,
        mineralPercent: 13.0,
        calcioPercent: 2.0,
        fosforoPercent: 1.0,
        pelletMm: "2.0 a 2.4 mm",
        tratosSugeridos: "2 a 3x ao dia",
        ajudaTecnica: "Pellet com hidroestabilidade de 2h a 3h. Checagem obrigatória nas bandejas após 1h30 da distribuição para evitar sobras e pico de amônia no fundo."
      }
    }
  },
  {
    id: "guabi",
    nome: "Guabi Aqua",
    linhas: "Guabi-Poti (Mirim QS & Guaçu)",
    slogan: "Líder nacional em nutrição aquícola com tecnologia de Quorum Sensing",
    badge: "Parceiro Homologado",
    cor: "emerald",
    logoText: "GUABI",
    descricao: "Pioneira na carcinicultura brasileira, a linha Poti possui rações microextrusadas e extrusadas com modulação de microbiota e proteção contra patógenos.",
    fases: {
      juvenil: {
        nomeLinha: "Guabi-Poti Mirim QS 40J",
        fase: "Juvenil / Berçário",
        pesoMinG: 0.1,
        pesoMaxG: 3.0,
        pbPercent: 40.0,
        eePercent: 11.0,
        fbPercent: 4.0,
        umidadePercent: 10.0,
        mineralPercent: 14.0,
        calcioPercent: 1.2,
        fosforoPercent: 1.4,
        pelletMm: "1.0 a 1.6 mm",
        tratosSugeridos: "4 a 5x ao dia",
        ajudaTecnica: "Tecnologia Quorum Sensing (QS) formulada com aditivos que bloqueiam a comunicação bacteriana de Vibrio spp., reduzindo surtos precoces na entrada de viveiro."
      },
      engorda: {
        nomeLinha: "Guabi-Poti Guaçu 35 / 32",
        fase: "Engorda / Crescimento",
        pesoMinG: 3.0,
        pesoMaxG: 35.0,
        pbPercent: 35.0,
        eePercent: 7.5,
        fbPercent: 4.0,
        umidadePercent: 10.0,
        mineralPercent: 16.0,
        calcioPercent: 1.8,
        fosforoPercent: 1.2,
        pelletMm: "2.0 a 2.4 mm",
        tratosSugeridos: "2 a 3x ao dia",
        ajudaTecnica: "Ração extrusada com altíssima flutuabilidade e estabilidade na coluna de água. Ajustar tratos de acordo com a leitura das bandejas de alimentação em 2h."
      }
    }
  },
  {
    id: "aquanutri",
    nome: "AquaNutri Nutrição Especializada",
    linhas: "AquaNutri Juvenil & Engorda",
    slogan: "Nutrição equilibrada para carcinicultura costeira e águas oligohalinas",
    badge: "Parceiro Homologado",
    cor: "cyan",
    logoText: "AQUANUTRI",
    descricao: "Fórmulas enriquecidas com fosfolipídios, colesterol e ácidos graxos essenciais para perfeita síntese de ecdisona e trocas de muda sem canibalismo.",
    fases: {
      juvenil: {
        nomeLinha: "AquaNutri Juvenil 40",
        fase: "Juvenil / Berçário",
        pesoMinG: 0.2,
        pesoMaxG: 3.2,
        pbPercent: 40.0,
        eePercent: 8.5,
        fbPercent: 4.0,
        umidadePercent: 10.0,
        mineralPercent: 13.0,
        calcioPercent: 2.0,
        fosforoPercent: 1.3,
        pelletMm: "1.2 a 1.6 mm",
        tratosSugeridos: "4 a 5x ao dia",
        ajudaTecnica: "Aroma e palatabilizantes marinhos que atraem rapidamente as pós-larvas, reduzindo tempo de ração no fundo e perdas de nutrientes por lixiviação."
      },
      engorda: {
        nomeLinha: "AquaNutri Engorda 35",
        fase: "Engorda / Crescimento",
        pesoMinG: 3.2,
        pesoMaxG: 30.0,
        pbPercent: 35.0,
        eePercent: 7.0,
        fbPercent: 4.5,
        umidadePercent: 11.0,
        mineralPercent: 14.0,
        calcioPercent: 2.0,
        fosforoPercent: 1.1,
        pelletMm: "2.0 a 2.2 mm",
        tratosSugeridos: "2 a 3x ao dia",
        ajudaTecnica: "Excelente balanço cálcio:fósforo para acelerar o endurecimento da cutícula em viveiros com salinidade baixa e média."
      }
    }
  }
];

// Banco de dados de Vendedores e Representantes Comerciais Locais por Estado
export const VENDEDORES_POR_ESTADO = [
  // Rio Grande do Norte (RN)
  {
    id: "vendedor-rn-1",
    estado: "RN",
    estadoNome: "Rio Grande do Norte",
    cidadeBase: "Mossoró / Areia Branca",
    regiao: "Pólo Costa Branca / Litoral Norte",
    nomeContato: "Carlos Eduardo Silva",
    empresa: "Costa Branca Distribuidora Aquícola",
    marcas: ["Guabi", "ADM", "AquaNutri"],
    whatsapp: "84998761234",
    telefone: "(84) 99876-1234",
    email: "vendas.costabranca@carcinorn.com.br",
    atendeCidades: ["Mossoró", "Areia Branca", "Grossos", "Tibau", "Porto do Mangue"],
    tiposProdutos: ["Rações Juvenil e Engorda", "Probióticos de Solo", "Calcário e Minerais"],
    destaque: true
  },
  {
    id: "vendedor-rn-2",
    estado: "RN",
    estadoNome: "Rio Grande do Norte",
    cidadeBase: "Pendências / Macau",
    regiao: "Vale do Açu e Bacia de Macau",
    nomeContato: "Mariana Medeiros",
    empresa: "NutriVale Representações Aquícolas",
    marcas: ["ADM", "Guabi"],
    whatsapp: "84991234567",
    telefone: "(84) 99123-4567",
    email: "mariana.nutrivale@rnagro.com.br",
    atendeCidades: ["Pendências", "Macau", "Guamaré", "Alto do Rodrigues", "Carnaubais"],
    tiposProdutos: ["Rações Extrusadas", "Biorremediadores", "Sopradores e Aeração"],
    destaque: false
  },
  {
    id: "vendedor-rn-3",
    estado: "RN",
    estadoNome: "Rio Grande do Norte",
    cidadeBase: "Canguaretama / Goianinha",
    regiao: "Litoral Sul Potiguar",
    nomeContato: "Rodrigo Dantas",
    empresa: "Potiguar Rações do Litoral",
    marcas: ["Guabi", "AquaNutri"],
    whatsapp: "84994567890",
    telefone: "(84) 99456-7890",
    email: "rodrigo.dantas@litoralcamarao.com.br",
    atendeCidades: ["Canguaretama", "Goianinha", "Tibau do Sul", "Baía Formosa", "Vila Flor"],
    tiposProdutos: ["Rações Poti", "Bicarbonato de Sódio", "Insumos de Solo"],
    destaque: false
  },

  // Ceará (CE)
  {
    id: "vendedor-ce-1",
    estado: "CE",
    estadoNome: "Ceará",
    cidadeBase: "Aracati / Fortim",
    regiao: "Baixo Jaguaribe e Litoral Leste",
    nomeContato: "Francisco José (Chicão)",
    empresa: "Jaguaribe Insumos Aquícolas",
    marcas: ["ADM", "Guabi", "AquaNutri"],
    whatsapp: "88997654321",
    telefone: "(88) 99765-4321",
    email: "chicao@jaguaribeaqua.com.br",
    atendeCidades: ["Aracati", "Fortim", "Icapuí", "Jaguaruana", "Russas", "Palhano"],
    tiposProdutos: ["Rações Juvenil e Engorda", "Probióticos de Solo e Água", "Cloreto de Potássio"],
    destaque: true
  },
  {
    id: "vendedor-ce-2",
    estado: "CE",
    estadoNome: "Ceará",
    cidadeBase: "Acaraú / Itarema",
    regiao: "Litoral Norte Cearense",
    nomeContato: "Lucas Barroso",
    empresa: "Acaraú Camarão Distribuição",
    marcas: ["Guabi", "AquaNutri"],
    whatsapp: "88992345678",
    telefone: "(88) 99234-5678",
    email: "vendas@acaraucamarao.com.br",
    atendeCidades: ["Acaraú", "Itarema", "Cruz", "Camocim", "Bela Cruz"],
    tiposProdutos: ["Linha Poti Mirim", "Rações Extrusadas", "Testes de Água"],
    destaque: false
  },
  {
    id: "vendedor-ce-3",
    estado: "CE",
    estadoNome: "Ceará",
    cidadeBase: "Fortaleza / Caucaia",
    regiao: "Região Metropolitana & Litoral Oeste",
    nomeContato: "Valter Alencar",
    empresa: "Ceará AquaTrade Representações",
    marcas: ["ADM", "Guabi"],
    whatsapp: "85996541230",
    telefone: "(85) 99654-1230",
    email: "valter@cearaaquatrade.com.br",
    atendeCidades: ["Fortaleza", "Caucaia", "São Gonçalo do Amarante", "Paracuru", "Trairi"],
    tiposProdutos: ["Camanutri 37J e 35J", "Probióticos de Fundo", "Aeradores"],
    destaque: false
  },

  // Bahia (BA)
  {
    id: "vendedor-ba-1",
    estado: "BA",
    estadoNome: "Bahia",
    cidadeBase: "Valença / Taperoá",
    regiao: "Baixo Sul Baiano / Costa do Dendê",
    nomeContato: "Antônio Marcos Peixoto",
    empresa: "Costa do Dendê Nutrição Aquícola",
    marcas: ["Guabi", "ADM"],
    whatsapp: "75998123456",
    telefone: "(75) 99812-3456",
    email: "peixoto@dendeaquicultura.com.br",
    atendeCidades: ["Valença", "Taperoá", "Cairu", "Nilo Peçanha", "Jaguaripe"],
    tiposProdutos: ["Rações Juvenil e Engorda", "Sulfato de Magnésio", "Probióticos de Solo"],
    destaque: true
  },
  {
    id: "vendedor-ba-2",
    estado: "BA",
    estadoNome: "Bahia",
    cidadeBase: "Canavieiras / Ilhéus",
    regiao: "Litoral Sul Baiano",
    nomeContato: "Beatriz Oliveira",
    empresa: "Sul Baiano Rações & Tecnologia",
    marcas: ["ADM", "AquaNutri", "Guabi"],
    whatsapp: "73999456789",
    telefone: "(73) 99945-6789",
    email: "beatriz@sulbaianoaqua.com.br",
    atendeCidades: ["Canavieiras", "Belmonte", "Una", "Ilhéus", "Itacaré"],
    tiposProdutos: ["Linha Camanutri e Poti", "Biorremediação com Bacillus", "Calagem"],
    destaque: false
  },

  // Piauí (PI)
  {
    id: "vendedor-pi-1",
    estado: "PI",
    estadoNome: "Piauí",
    cidadeBase: "Parnaíba / Luís Correia",
    regiao: "Delta do Parnaíba",
    nomeContato: "Raimundo Nonato",
    empresa: "Delta Camarões Distribuidora",
    marcas: ["ADM", "Guabi"],
    whatsapp: "86998765432",
    telefone: "(86) 99876-5432",
    email: "raimundo@deltacamarao.com.br",
    atendeCidades: ["Parnaíba", "Luís Correia", "Ilha Grande", "Cajueiro da Praia", "Buriti dos Lopes"],
    tiposProdutos: ["Rações para Água Salobra", "Bactérias de Solo", "Calcário Dolomítico"],
    destaque: true
  },

  // Paraíba (PB)
  {
    id: "vendedor-pb-1",
    estado: "PB",
    estadoNome: "Paraíba",
    cidadeBase: "Mamanguape / João Pessoa",
    regiao: "Vale do Mamanguape e Litoral Norte PB",
    nomeContato: "Severino Ramos",
    empresa: "Paraíba Aqua Insumos",
    marcas: ["Guabi", "AquaNutri"],
    whatsapp: "83996547891",
    telefone: "(83) 99654-7891",
    email: "severino@pbaquainsumos.com.br",
    atendeCidades: ["Mamanguape", "Rio Tinto", "Marcação", "Lucena", "Santa Rita"],
    tiposProdutos: ["Rações Poti", "Probióticos", "Corretivos de Solo"],
    destaque: true
  },

  // Pernambuco (PE)
  {
    id: "vendedor-pe-1",
    estado: "PE",
    estadoNome: "Pernambuco",
    cidadeBase: "Goiana / Itamaracá",
    regiao: "Litoral Norte Pernambucano",
    nomeContato: "Gilberto Andrade",
    empresa: "Pernambuco Carcino Representações",
    marcas: ["ADM", "Guabi"],
    whatsapp: "81997891234",
    telefone: "(81) 99789-1234",
    email: "gilberto@peaquicultura.com.br",
    atendeCidades: ["Goiana", "Itamaracá", "Itapissuma", "Igarassu", "Sirinhaém", "Rio Formoso"],
    tiposProdutos: ["Rações Camanutri", "Insumos para Baixa Salinidade", "Minerais"],
    destaque: true
  },

  // Sergipe (SE)
  {
    id: "vendedor-se-1",
    estado: "SE",
    estadoNome: "Sergipe",
    cidadeBase: "Brejo Grande / Pacatuba",
    regiao: "Foz do Rio São Francisco",
    nomeContato: "Claudio Vasconcelos",
    empresa: "San Francisco Nutrição Aquícola",
    marcas: ["Guabi", "AquaNutri"],
    whatsapp: "79998124578",
    telefone: "(79) 99812-4578",
    email: "claudio@sanfranciscoaqua.com.br",
    atendeCidades: ["Brejo Grande", "Pacatuba", "Neópolis", "Ilha das Flores", "Pirambu"],
    tiposProdutos: ["Rações Extrusadas", "Biorremediadores de Fundo", "Aeradores de Pás"],
    destaque: true
  },

  // Alagoas (AL)
  {
    id: "vendedor-al-1",
    estado: "AL",
    estadoNome: "Alagoas",
    cidadeBase: "Piaçabuçu / Coruripe",
    regiao: "Litoral Sul de Alagoas",
    nomeContato: "José Geraldo Farias",
    empresa: "Alagoas Aqua Representações",
    marcas: ["ADM", "Guabi"],
    whatsapp: "82999451278",
    telefone: "(82) 99945-1278",
    email: "geraldo@alagoasaqua.com.br",
    atendeCidades: ["Piaçabuçu", "Coruripe", "Penedo", "Roteiro", "Marechal Deodoro"],
    tiposProdutos: ["Linha Camanutri", "Linha Poti", "Balanço Iônico"],
    destaque: true
  },

  // Santa Catarina (SC)
  {
    id: "vendedor-sc-1",
    estado: "SC",
    estadoNome: "Santa Catarina",
    cidadeBase: "Laguna / Imaruí",
    regiao: "Complexo Lagunar Sul Catarinense",
    nomeContato: "Marcelo Koerich",
    empresa: "Sul Camarão Distribuidora",
    marcas: ["Guabi", "ADM", "AquaNutri"],
    whatsapp: "48991238901",
    telefone: "(48) 99123-8901",
    email: "marcelo@sulcamarao.com.br",
    atendeCidades: ["Laguna", "Imaruí", "Jaguaruna", "Tubarão", "Garopaba", "Florianópolis"],
    tiposProdutos: ["Rações com Imunomoduladores (Inverno)", "Biorremediação", "Aeradores"],
    destaque: true
  },

  // São Paulo (SP)
  {
    id: "vendedor-sp-1",
    estado: "SP",
    estadoNome: "São Paulo",
    cidadeBase: "Cananéia / Registro",
    regiao: "Vale do Ribeira & Litoral Sul",
    nomeContato: "Henrique Nagata",
    empresa: "Ribeira Aqua Soluções",
    marcas: ["Guabi", "ADM"],
    whatsapp: "13997654389",
    telefone: "(13) 99765-4389",
    email: "henrique@ribeiraaqua.com.br",
    atendeCidades: ["Cananéia", "Iguape", "Ilha Comprida", "Registro", "Sete Barras"],
    tiposProdutos: ["Rações de Alta Conversão", "Bioflocos / Carbono", "Probióticos"],
    destaque: true
  },

  // Maranhão (MA)
  {
    id: "vendedor-ma-1",
    estado: "MA",
    estadoNome: "Maranhão",
    cidadeBase: "São Luís / Tutóia",
    regiao: "Litoral Ocidental & Lençóis",
    nomeContato: "Aldo Costa",
    empresa: "Maranhão Insumos Aquícolas",
    marcas: ["ADM", "Guabi"],
    whatsapp: "98991456723",
    telefone: "(98) 99145-6723",
    email: "aldo@maranhaoinsumos.com.br",
    atendeCidades: ["São Luís", "Tutóia", "Cururupu", "Guimarães", "Icatu"],
    tiposProdutos: ["Rações Comerciais", "Corretivos e Calagem", "Biorremediação"],
    destaque: true
  }
];

// Banners e Anúncios Oficiais Cadastrados no CarcinoGestão
export const ANUNCIOS_PATROCINADORES = [
  {
    id: "banner-adm",
    marcaId: "adm",
    nomeEmpresa: "ADM Nutrição Animal",
    segmento: "Rações & Nutrição Aquícola",
    titulo: "Linha Camanutri & Density: Alta Conversão Alimentar",
    chamada: "Maximize o ganho de peso diário dos seus camarões com menor índice de conversão e água mais limpa.",
    logoTexto: "ADM Animal Nutrition",
    badge: "Patrocinador Oficial",
    whatsapp: "84998761234",
    linkInfo: "https://www.admnutricaoanimal.com.br",
    cor: "from-blue-700 to-indigo-900",
    corBadge: "bg-blue-500/20 text-blue-700 border-blue-500/30"
  },
  {
    id: "banner-guabi",
    marcaId: "guabi",
    nomeEmpresa: "Guabi Aqua",
    segmento: "Rações Extrusadas & Quorum Sensing",
    titulo: "Linha Poti Mirim & Poti Guaçu Extrusada",
    chamada: "Tecnologia Quorum Sensing para proteção sanitária desde o berçário até a despesca final.",
    logoTexto: "GUABI AQUA",
    badge: "Patrocinador Oficial",
    whatsapp: "88997654321",
    linkInfo: "https://www.guabiaqua.com.br",
    cor: "from-emerald-700 to-teal-900",
    corBadge: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30"
  },
  {
    id: "banner-probioticos",
    marcaId: "probioticos-solo",
    nomeEmpresa: "BioRemed Aqua Biotecnologia",
    segmento: "Biorremediação de Solo & Bacillus",
    titulo: "Elimine o Lodo Preto e o Gás Sulfídrico (H2S)",
    chamada: "Consórcio de Bacillus subtilis e bactérias oxidantes para manter o fundo do seu viveiro 100% oxidado e sadio.",
    logoTexto: "BIOREMED AQUA",
    badge: "Patrocinador Oficial",
    whatsapp: "84998761234",
    linkInfo: "#probioticos",
    cor: "from-amber-700 to-orange-900",
    corBadge: "bg-amber-500/20 text-amber-700 border-amber-500/30"
  }
];
