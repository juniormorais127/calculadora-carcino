// IBGE, Pesquisa da Pecuária Municipal 2025, tabela SIDRA 3940.
// Variável 4146 (quantidade em kg), classificação 654, categoria 32887
// (camarão de aquicultura; não inclui pesca extrativa ou pós-larvas).
// Consultado em 15/10/2026. Valores ausentes não recebem posição.
// API: https://servicodados.ibge.gov.br/api/v3/agregados/3940/periodos/2025/variaveis/4146?localidades=N3[all]&classificacao=654[32887]
export const FONTE_RANKING_CAMARAO = {
  ano: 2025,
  url: "https://sidra.ibge.gov.br/tabela/3940",
};

export const RANKING_CAMARAO = [
  { sigla: "CE", nome: "Ceará", producaoKg: 91869731 },
  { sigla: "RN", nome: "Rio Grande do Norte", producaoKg: 37978491 },
  { sigla: "PB", nome: "Paraíba", producaoKg: 20118100 },
  { sigla: "BA", nome: "Bahia", producaoKg: 6236780 },
  { sigla: "PE", nome: "Pernambuco", producaoKg: 4800868 },
  { sigla: "PI", nome: "Piauí", producaoKg: 4683242 },
  { sigla: "SE", nome: "Sergipe", producaoKg: 3959710 },
  { sigla: "AL", nome: "Alagoas", producaoKg: 1935000 },
  { sigla: "MA", nome: "Maranhão", producaoKg: 353843 },
  { sigla: "SC", nome: "Santa Catarina", producaoKg: 270700 },
  { sigla: "PA", nome: "Pará", producaoKg: 106400 },
  { sigla: "PR", nome: "Paraná", producaoKg: 40000 },
  { sigla: "RJ", nome: "Rio de Janeiro", producaoKg: 37700 },
  { sigla: "ES", nome: "Espírito Santo", producaoKg: 3600 },
].sort((a, b) => b.producaoKg - a.producaoKg)
  .map((estado, index) => ({ ...estado, posicao: index + 1 }));

export function posicaoProducao(sigla) {
  return RANKING_CAMARAO.find(estado => estado.sigla === sigla)?.posicao ?? Infinity;
}
