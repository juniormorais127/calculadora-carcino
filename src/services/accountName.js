export function validateAccountName(value) {
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  if (name.length < 5 || name.length > 200 || name.split(' ').length < 2) throw new Error('Informe seu nome completo, com nome e sobrenome.');
  return name;
}
