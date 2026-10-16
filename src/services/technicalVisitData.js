import { parsePondLocation } from './pondLocation.js';

function date(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || !Number.isFinite(Date.parse(`${value}T12:00:00Z`)) || new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new Error(`Informe uma data válida para ${label}.`);
  }
  return value;
}

// Only structured public changes belong in a client notification. The private
// visit narrative must be stored separately under the author's protected path.
export function validateTechnicalVisit({ visitedOn, notes, latitude, longitude, licenseNumber, licenseRegisteredOn, licenseExpiresOn }) {
  const visited = date(visitedOn, 'a visita');
  const description = String(notes || '').trim();
  if (description.length < 10 || description.length > 10000) throw new Error('Descreva a visita com 10 a 10.000 caracteres.');
  const location = parsePondLocation(latitude, longitude);
  const number = String(licenseNumber || '').trim();
  let license = null;
  if (number || licenseRegisteredOn || licenseExpiresOn) {
    if (!number || number.length > 120) throw new Error('Informe o número do licenciamento com até 120 caracteres.');
    const registeredOn = date(licenseRegisteredOn, 'o cadastro do licenciamento');
    const expiresOn = date(licenseExpiresOn, 'o vencimento do licenciamento');
    if (expiresOn < registeredOn) throw new Error('O vencimento não pode ser anterior ao cadastro do licenciamento.');
    license = { number, registeredOn, expiresOn };
  }
  return { visitedOn: visited, notes: description, location, license };
}

export function validateVisitReport(input) {
  const result = validateTechnicalVisit({ ...input, notes: input.summary,
    licenseNumber: input.licenseStatus === 'licensed' ? input.licenseNumber : '',
    licenseRegisteredOn: input.licenseStatus === 'licensed' ? input.licenseRegisteredOn : '',
    licenseExpiresOn: input.licenseStatus === 'licensed' ? input.licenseExpiresOn : '' });
  if (!['licensed', 'unlicensed', 'unknown'].includes(input.licenseStatus)) throw new Error('Informe a situação do licenciamento.');
  if (input.licenseStatus === 'licensed' && !result.license) throw new Error('Informe o número e as datas do licenciamento.');
  if (input.correctLocation && result.location.latitude === null) throw new Error('Informe as coordenadas corrigidas.');
  const privateNotes = String(input.privateNotes || '').trim();
  if (privateNotes.length > 10000) throw new Error('As anotações privadas podem ter até 10.000 caracteres.');
  return { ...result, privateNotes, licenseStatus: input.licenseStatus };
}

export const LICENSE_LABELS = { licensed: 'Licenciada (informado pelo técnico)', unlicensed: 'Não licenciada (informado pelo técnico)', unknown: 'Licenciamento não verificado' };
export const VISIT_LABELS = { pending: 'Aguardando aprovação do cliente', accepted: 'Aceita pelo cliente', rejected: 'Recusada pelo cliente' };

export function validateIndependentVisit(input) {
  const clientEmail = String(input.clientEmail || '').trim().toLowerCase();
  const propertyName = String(input.propertyName || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail) || clientEmail.length > 320) throw new Error('Informe o e-mail usado pelo cliente para entrar no site.');
  if (!propertyName || propertyName.length > 200) throw new Error('Informe o nome da propriedade com até 200 caracteres.');
  return { ...validateVisitReport({ ...input, correctLocation: false }), clientEmail, propertyName };
}
