import { validateAccountName } from './accountName.js';
import { normalizePhone } from './accountPhone.js';
import { parsePondLocation } from './pondLocation.js';

export const ASSISTED_AUDIT_LABELS = { pending: 'Aguardando auditoria administrativa', approved: 'Aprovado pela administração', rejected: 'Recusado pela administração', changes_requested: 'Ajustes solicitados ao técnico' };
export function validateAssistedProducer(input) {
  const fullName = String(input.fullName || '').trim() ? validateAccountName(input.fullName) : '';
  const privateAlias = String(input.privateAlias || '').trim();
  if (privateAlias.length > 100 || (!fullName && privateAlias.length < 2)) throw new Error('Informe o nome completo ou um apelido para seu controle privado.');
  const phone = normalizePhone(String(input.phone || ''));
  const email = String(input.email || '').trim().toLowerCase();
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320)) throw new Error('Confira o e-mail ou deixe o campo vazio.');
  const propertyName = String(input.propertyName || '').trim();
  if (propertyName.length < 2 || propertyName.length > 200) throw new Error('Informe o nome da propriedade com 2 a 200 caracteres.');
  if (input.presentialConsent !== true) throw new Error('Confirme que o produtor autorizou o cadastro presencialmente.');
  const address = String(input.address || '').trim(), city = String(input.city || '').trim(), state = String(input.state || '').trim().toUpperCase(), reference = String(input.reference || '').trim();
  if (address.length < 5 || address.length > 500) throw new Error('Informe o endereço ou comunidade com 5 a 500 caracteres.');
  if (city.length < 2 || city.length > 100 || !/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/.test(state)) throw new Error('Informe município e estado.');
  if (reference.length > 300) throw new Error('Use até 300 caracteres no ponto de referência.');
  return { fullName, privateAlias, phone, email, propertyName, address, city, state, reference, marketingConsent: input.marketingConsent === true, ...parsePondLocation(input.latitude, input.longitude), presentialConsent: true };
}
export function normalizeActivationCode(value) {
  const code = String(value || '').replace(/[\s-]/g, '').toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(code)) throw new Error('Confira o código de ativação entregue pelo técnico.');
  return code;
}
export function newActivationCode() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
}
