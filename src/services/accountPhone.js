export function normalizePhone(value) {
  const input = value.trim();
  const digits = input.replace(/\D/g, '');
  if (/[^\d\s()+.-]/.test(input)) throw new Error('Informe um celular válido.');
  if (input.startsWith('+')) {
    if (/^[1-9]\d{7,14}$/.test(digits)) return `+${digits}`;
  } else if (/^[1-9]\d9\d{8}$/.test(digits)) return `+55${digits}`;
  else if (/^55[1-9]\d9\d{8}$/.test(digits)) return `+${digits}`;
  throw new Error('Informe seu celular com DDD, por exemplo (79) 99999-9999.');
}
