import { area } from '@turf/area';
import { distance } from '@turf/distance';
import { kinks } from '@turf/kinks';

export function measureMapPoints(points, mode = 'path') {
  if (!['path', 'polygon'].includes(mode) || points.some(p => !Array.isArray(p) || p.length !== 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1]) || Math.abs(p[0]) > 90 || Math.abs(p[1]) > 180)) throw new Error('Coordenadas inválidas.');
  const coordinates = points.map(([lat, lng]) => [lng, lat]);
  const segments = coordinates.slice(1).map((point, index) => distance(coordinates[index], point, { units: 'meters' }));
  const length = segments.reduce((sum, value) => sum + value, 0);
  if (mode !== 'polygon' || points.length < 3) return { segments, length, perimeter: null, area: null, invalid: false };
  const ring = [...coordinates, coordinates[0]];
  const polygon = { type: 'Polygon', coordinates: [ring] };
  const perimeter = length + distance(coordinates.at(-1), coordinates[0], { units: 'meters' });
  const duplicates = new Set(points.map(p => p.join(','))).size !== points.length;
  const invalid = duplicates || kinks(polygon).features.length > 0;
  const squareMeters = invalid ? null : area(polygon);
  return { segments: [...segments, perimeter - length], length, perimeter, area: squareMeters, invalid: invalid || squareMeters < 0.01 };
}
const format = (value, digits = 2) => value.toLocaleString('pt-BR', { maximumFractionDigits: digits });
export const formatDistance = meters => meters >= 1000 ? `${format(meters / 1000, 3)} km` : `${format(meters)} m`;
export const formatArea = meters => `${format(meters)} m² · ${format(meters / 10000, 4)} ha`;
