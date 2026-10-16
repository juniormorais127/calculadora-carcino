export const ACCOUNT_ROLES = { producer: 'Produtor', field_technician: 'Técnico de campo' };
export const accountRole = profile => profile?.role === 'field_technician' ? 'field_technician' : 'producer';

export function premiumStatus(profile, now = Date.now()) {
  if (!profile?.premium) return 'Gratuito';
  const expiry = profile.expiresAt?.toMillis?.() ?? profile.expiresAt;
  if (expiry && Number(expiry) <= now) return 'Expirado';
  return 'Premium ativo';
}
export function expirationMillis(date) {
  if (!date) return null;
  const millis = Date.parse(`${date}T23:59:59.999-03:00`);
  if (!Number.isFinite(millis)) throw new Error('Informe uma data válida.');
  return millis;
}
