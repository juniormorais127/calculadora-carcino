export function parsePondLocation(latitude, longitude) {
  const lat = String(latitude ?? '').trim();
  const lng = String(longitude ?? '').trim();
  if (!lat && !lng) return { latitude: null, longitude: null };
  const decimal = value => /^[-+]?\d+(?:[.,]\d+)?$/.test(value) ? Number(value.replace(',', '.')) : NaN;
  const a = decimal(lat), b = decimal(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) > 90 || Math.abs(b) > 180) {
    throw new Error('Informe latitude entre -90 e 90 e longitude entre -180 e 180. Preencha as duas coordenadas ou deixe ambas vazias.');
  }
  return { latitude: a, longitude: b };
}
