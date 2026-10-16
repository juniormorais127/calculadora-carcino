export function validateTechnicianIdentity(input) {
  const fullName = String(input?.fullName || '').trim().replace(/\s+/g, ' ');
  const creaNumber = String(input?.creaNumber || '').trim();
  const photoDataUrl = String(input?.photoDataUrl || '');
  const employmentType = input?.employmentType;
  const organizationName = employmentType === 'organization' ? String(input?.organizationName || '').trim() : '';
  if (fullName.length < 5 || fullName.length > 200 || fullName.split(' ').length < 2) throw new Error('Informe seu nome completo, com nome e sobrenome.');
  if ((creaNumber && creaNumber.length < 3) || creaNumber.length > 80) throw new Error('Confira o número do CREA ou deixe o campo vazio.');
  if (photoDataUrl.length > 100000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photoDataUrl)) throw new Error('Adicione uma foto válida do técnico.');
  if (!['private', 'organization'].includes(employmentType)) throw new Error('Informe se o atendimento é particular ou vinculado a órgão/empresa.');
  if (employmentType === 'organization' && (organizationName.length < 2 || organizationName.length > 200)) throw new Error('Informe o nome do órgão ou empresa com até 200 caracteres.');
  return { fullName, creaNumber, photoDataUrl, employmentType, organizationName };
}
export function hasTechnicianIdentity(value) {
  try { validateTechnicianIdentity(value); return true; } catch { return false; }
}
export async function prepareTechnicianPhoto(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Escolha uma foto JPG, PNG ou WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Escolha uma foto de até 5 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const ratio = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio)); canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const value = canvas.toDataURL('image/webp', 0.8);
    if (value.length > 100000) throw new Error('A foto ficou muito grande. Escolha outra imagem.');
    return value;
  } finally { bitmap.close(); }
}
