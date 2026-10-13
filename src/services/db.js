import Dexie from "dexie";

export const db = new Dexie("CalculadoraCarcinoDB");

db.version(1).stores({
  viveiros: "++id, nome, status, dataPovoamento, createdAt",
  biometrias: "++id, viveiroId, data, createdAt",
  qualidadeAgua: "++id, viveiroId, data, horario, createdAt",
  registrosAlimentacao: "++id, viveiroId, data, createdAt",
  configuracoes: "++id, chave"
});

/**
 * Popula dados iniciais de demonstração se a base estiver vazia
 */
export async function seedInitialDataIfEmpty() {
  const count = await db.viveiros.count();
  if (count > 0) return;

  const hoje = new Date();
  const formatData = (diasAtras) => {
    const d = new Date();
    d.setDate(hoje.getDate() - diasAtras);
    return d.toISOString().split("T")[0];
  };

  // Viveiro 1: Engorda em andamento (60 dias de cultivo)
  const v1Id = await db.viveiros.add({
    nome: "Viveiro 01 - Engorda Principal",
    areaM2: 10000, // 1 hectare
    profundidadeM: 1.2,
    volumeM3: 12000,
    dataPovoamento: formatData(55),
    qtdPovoada: 120000,
    densidadePovoamento: 12, // 12 camarões/m²
    pesoInicialG: 0.01,
    status: "ativo", // ativo, despescado, preparo
    observacoes: "Povoamento com PL10 de alta sanidade. Solo argiloso.",
    createdAt: new Date().toISOString()
  });

  // Viveiro 2: Povoamento recente (18 dias)
  const v2Id = await db.viveiros.add({
    nome: "Viveiro 02 - Juvenil",
    areaM2: 7500,
    profundidadeM: 1.1,
    volumeM3: 8250,
    dataPovoamento: formatData(18),
    qtdPovoada: 150000,
    densidadePovoamento: 20,
    pesoInicialG: 0.01,
    status: "ativo",
    observacoes: "Cultivo semi-intensivo com aeração noturna.",
    createdAt: new Date().toISOString()
  });

  // Biometrias do Viveiro 1
  await db.biometrias.bulkAdd([
    {
      viveiroId: v1Id,
      data: formatData(35),
      pesoMedioG: 5.2,
      sobrevivenciaEstimada: 88,
      camaroesEstimados: 105600,
      biomassaKg: 549.12,
      ganhoSemanalG: 1.2,
      ganhoDiarioG: 0.17,
      notas: "Crescimento excelente, exoesqueleto firme.",
      createdAt: new Date().toISOString()
    },
    {
      viveiroId: v1Id,
      data: formatData(21),
      pesoMedioG: 7.8,
      sobrevivenciaEstimada: 85,
      camaroesEstimados: 102000,
      biomassaKg: 795.6,
      ganhoSemanalG: 1.3,
      ganhoDiarioG: 0.18,
      notas: "Transição de ração para calibre 2.5mm.",
      createdAt: new Date().toISOString()
    },
    {
      viveiroId: v1Id,
      data: formatData(7),
      pesoMedioG: 10.4,
      sobrevivenciaEstimada: 83,
      camaroesEstimados: 99600,
      biomassaKg: 1035.84,
      ganhoSemanalG: 1.3,
      ganhoDiarioG: 0.18,
      notas: "Atingiu 10g com boa uniformidade.",
      createdAt: new Date().toISOString()
    },
    {
      viveiroId: v1Id,
      data: formatData(0),
      pesoMedioG: 11.9,
      sobrevivenciaEstimada: 82,
      camaroesEstimados: 98400,
      biomassaKg: 1170.96,
      ganhoSemanalG: 1.5,
      ganhoDiarioG: 0.21,
      notas: "Biometria da semana. Camarões ativos e sem manchas.",
      createdAt: new Date().toISOString()
    }
  ]);

  // Medições recentes de qualidade de água para Viveiro 1
  await db.qualidadeAgua.bulkAdd([
    {
      viveiroId: v1Id,
      data: formatData(2),
      horario: "Manhã (06:00)",
      oxigenio: 4.8,
      temperatura: 27.5,
      ph: 7.9,
      salinidade: 22,
      alcalinidade: 135,
      amoniaTotal: 0.3,
      nitrito: 0.1,
      transparencia: 35,
      notas: "Condições ideais ao amanhecer.",
      createdAt: new Date().toISOString()
    },
    {
      viveiroId: v1Id,
      data: formatData(1),
      horario: "Tarde (15:00)",
      oxigenio: 7.2,
      temperatura: 31.0,
      ph: 8.3,
      salinidade: 22,
      alcalinidade: 130,
      amoniaTotal: 0.4,
      nitrito: 0.1,
      transparencia: 32,
      notas: "Pico de fotossíntese do fitoplâncton.",
      createdAt: new Date().toISOString()
    },
    {
      viveiroId: v1Id,
      data: formatData(0),
      horario: "Manhã (06:00)",
      oxigenio: 4.4,
      temperatura: 28.0,
      ph: 7.8,
      salinidade: 22,
      alcalinidade: 125,
      amoniaTotal: 0.35,
      nitrito: 0.15,
      transparencia: 36,
      notas: "Alcalinidade boa, ração liberada normalmente.",
      createdAt: new Date().toISOString()
    }
  ]);

  // Configuração padrão da fazenda
  await db.configuracoes.add({
    chave: "perfilFazenda",
    nomeFazenda: "Fazenda Camarão Imperial",
    produtor: "Produtor de Carcinicultura",
    localizacao: "Litoral / Região de Cultivo",
    metaAlcalinidade: 130,
    createdAt: new Date().toISOString()
  });
}

/**
 * Exporta todo o banco local para JSON para backup
 */
export async function exportLocalDatabase() {
  const backup = {
    versao: 1,
    dataExportacao: new Date().toISOString(),
    viveiros: await db.viveiros.toArray(),
    biometrias: await db.biometrias.toArray(),
    qualidadeAgua: await db.qualidadeAgua.toArray(),
    registrosAlimentacao: await db.registrosAlimentacao.toArray(),
    configuracoes: await db.configuracoes.toArray()
  };
  return JSON.stringify(backup, null, 2);
}

/**
 * Restaura o banco local a partir de JSON
 */
export async function importLocalDatabase(jsonString) {
  const data = JSON.parse(jsonString);
  await db.transaction('rw', [db.viveiros, db.biometrias, db.qualidadeAgua, db.registrosAlimentacao, db.configuracoes], async () => {
    if (data.viveiros?.length) {
      await db.viveiros.clear();
      await db.viveiros.bulkAdd(data.viveiros);
    }
    if (data.biometrias?.length) {
      await db.biometrias.clear();
      await db.biometrias.bulkAdd(data.biometrias);
    }
    if (data.qualidadeAgua?.length) {
      await db.qualidadeAgua.clear();
      await db.qualidadeAgua.bulkAdd(data.qualidadeAgua);
    }
    if (data.registrosAlimentacao?.length) {
      await db.registrosAlimentacao.clear();
      await db.registrosAlimentacao.bulkAdd(data.registrosAlimentacao);
    }
    if (data.configuracoes?.length) {
      await db.configuracoes.clear();
      await db.configuracoes.bulkAdd(data.configuracoes);
    }
  });
}
