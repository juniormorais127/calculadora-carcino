import test from 'node:test';
import assert from 'node:assert/strict';
import { measureMapPoints } from '../src/services/mapMeasurements.js';

test('geodesic path distances use meters and never close the path', () => {
  const result = measureMapPoints([[0, 0], [0, 1], [1, 1]]);
  assert.ok(Math.abs(result.length - 222390.16) < 1);
  assert.equal(result.segments.length, 2);
  assert.equal(result.area, null);
  assert.equal(result.perimeter, null);
});
test('polygon reports area in square meters, closes perimeter, and is orientation independent', () => {
  const points = [[0, 0], [0, 0.001], [0.001, 0.001], [0.001, 0]];
  const a = measureMapPoints(points, 'polygon');
  const b = measureMapPoints([...points].reverse(), 'polygon');
  assert.ok(Math.abs(a.area - 12364.35) < 1);
  assert.ok(Math.abs(a.perimeter - 444.78) < 0.1);
  assert.equal(a.segments.length, 4);
  assert.ok(Math.abs(a.area - b.area) < 0.0001);
  assert.equal(a.invalid, false);
});
test('self intersections, duplicate vertices and zero-area contours cannot produce a valid area', () => {
  for (const points of [ [[0,0],[1,1],[0,1],[1,0]], [[0,0],[0,1],[1,1],[0,1]], [[0,0],[0,1],[0,2]] ]) {
    assert.equal(measureMapPoints(points, 'polygon').invalid, true);
  }
  assert.equal(measureMapPoints([], 'polygon').area, null);
  assert.equal(measureMapPoints([[0,0]], 'path').length, 0);
  assert.throws(() => measureMapPoints([[NaN, 0]]));
  assert.throws(() => measureMapPoints([[91, 0]]));
});
