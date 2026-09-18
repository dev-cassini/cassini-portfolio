import { extractContours } from './terrain-geometry';

describe('terrain elevation contours', () => {
  it('interpolates the correct endpoints on a sloping face', () => {
    const { minor } = extractContours({
      positions: new Float32Array([0, 0, 0, 2, 2, 0, 0, 0, 2]),
      indices: new Uint32Array([0, 1, 2]),
    }, 0.5);
    expect(Array.from(minor.slice(0, 6))).toEqual([0.5, 0.5, 0, 0.5, 0.5, 1.5]);
    expect(minor.length).toBe(18);
  });

  it('joins contours across shared triangle edges without gaps', () => {
    const { minor } = extractContours({
      positions: new Float32Array([0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1]),
      indices: new Uint32Array([0, 2, 1, 1, 2, 3]),
    }, 0.5);
    const points = Array.from({ length: minor.length / 3 }, (_, i) => Array.from(minor.slice(i * 3, i * 3 + 3)));
    expect(points.filter(p => p[0] === 0.5 && p[1] === 0.5 && p[2] === 0.5)).toHaveLength(2);
    expect(points).toContainEqual([0.5, 0.5, 0]);
    expect(points).toContainEqual([0.5, 0.5, 1]);
  });

  it('does not emit degenerate segments for a flat face at a contour elevation', () => {
    const { minor, major } = extractContours({
      positions: new Float32Array([0, 0.5, 0, 1, 0.5, 0, 0, 0.5, 1]),
      indices: new Uint32Array([0, 1, 2]),
    }, 0.5);
    expect(minor.length + major.length).toBe(0);
  });
});
