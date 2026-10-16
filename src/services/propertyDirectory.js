export const propertySearchKey = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR');

// This exact normalization is also enforced by Firestore rules.
export function propertyNameKey(value) {
  const key = String(value || '').toLowerCase().replace(/[áàâãä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i').replace(/[óòôõö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ç/g, 'c').replace(/ñ/g, 'n').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (key.length < 2 || key.length > 200) throw new Error('Informe um nome de propriedade com 2 a 200 caracteres e letras ou números.');
  return key;
}
