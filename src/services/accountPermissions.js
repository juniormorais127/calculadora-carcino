export const SENIOR_UID = 'Dc2sEKML8Lc66cgj8VvSX4Uhhpk1';
export const ACCOUNT_ROLES = { producer: 'Produtor', field_technician: 'Técnico de campo', administrator: 'Administrador', senior: 'Sênior' };
export const accountRole = (profile, uid) => uid === SENIOR_UID ? 'senior' : Object.hasOwn(ACCOUNT_ROLES, profile?.role) ? profile.role : 'producer';
export const isSenior = (user, profile) => !!user && accountRole(profile, user.uid) === 'senior';
export const canManageUser = (user, profile, target) => !!user && (isSenior(user, profile) || (accountRole(profile, user.uid) === 'administrator' && target.uid !== SENIOR_UID && ['producer', 'field_technician'].includes(accountRole(target, target.uid))));
export const assignableRoles = (user, profile, target) => target.uid === SENIOR_UID ? ['senior'] : isSenior(user, profile) ? Object.keys(ACCOUNT_ROLES) : ['producer', 'field_technician'];

/**
 * Motivo pelo qual a sessão fica retida na tela de acesso, ou null quando o painel
 * pode abrir. O celular cadastrado só é exigido quando o perfil pôde ser lido: sem
 * internet — ou quando a consulta ao perfil falha — o app abre em modo local, para
 * não trancar o produtor fora dos registros que já estão no aparelho dele.
 */
export function motivoDoBloqueioDeAcesso({ user, perfil, perfilCarregando = false, perfilErro = false, online = true }) {
  if (!user) return 'sem-sessao';
  if (!user.emailVerified) return 'email-nao-verificado';
  if (perfil) return !perfil.phone ? 'sem-celular' : !perfil.fullName ? 'sem-nome' : null;
  if (perfilCarregando && !perfilErro && online) return 'consultando-perfil';
  return null;
}

export function premiumStatus(profile, now = Date.now()) {
  if (profile?.role === 'senior') return 'Acesso completo';
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
