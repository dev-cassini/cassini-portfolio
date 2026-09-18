/** Deterministic terrain shared by the surface, contours, and a future hiking route. */
export interface TerrainGeometry {
  positions: Float32Array;
  indices: Uint32Array;
}

export const CONTOUR_INTERVAL = 0.055;

export function terrainHeight(x: number, z: number): number {
  // Small domain warps break the symmetry of the deliberately placed summits.
  const u = x + 0.24 * Math.sin(z * 1.8) + 0.1 * Math.cos(x * 2.5 + z);
  const v = z + 0.2 * Math.sin(x * 1.4 - z * 0.7);
  const peak = (cx: number, cz: number, width: number, depth: number, height: number) =>
    height * Math.exp(-(((u - cx) / width) ** 2 + ((v - cz) / depth) ** 2));

  const mountains = peak(-2.5, -1.8, 1.45, 1.6, 3.8)
    + peak(1.5, -2.0, 1.7, 1.25, 2.65)
    + peak(-1.8, 1.5, 1.8, 1.5, 2.9)
    + peak(3.5, 1.6, 1.25, 1.5, 1.9)
    + peak(-4.1, 0.2, 1.2, 1.1, 0.65);
  const foothills = 0.42 + 0.16 * Math.sin(u * 1.5 + v * 0.9)
    + 0.08 * Math.cos(v * 2.7 - u) + 0.04 * Math.sin(u * 4.3 + v * 3.8);
  const edge = Math.max(0, 1 - (x / 7.2) ** 4 - (z / 5.4) ** 4);
  return Math.max(0, mountains + foothills) * Math.min(1, edge * 3);
}

export function createTerrainGeometry(resolution = 192): TerrainGeometry {
  if (!Number.isInteger(resolution) || resolution < 1) throw new RangeError('Resolution must be a positive integer');
  const stride = resolution + 1;
  const positions = new Float32Array(stride * stride * 3);
  const indices = new Uint32Array(resolution * resolution * 6);
  for (let row = 0; row <= resolution; row++) {
    for (let col = 0; col <= resolution; col++) {
      const x = (col / resolution - 0.5) * 14.4;
      const z = (row / resolution - 0.5) * 10.8;
      const index = (row * stride + col) * 3;
      positions.set([x, terrainHeight(x, z), z], index);
      if (row < resolution && col < resolution) {
        const a = row * stride + col;
        // Counterclockwise faces point upwards; contour extraction uses these exact triangles.
        indices.set([a, a + stride, a + 1, a + 1, a + stride, a + stride + 1],
          (row * resolution + col) * 6);
      }
    }
  }
  return { positions, indices };
}

/** Slice triangles horizontally, avoiding ambiguous marching-squares saddle cases. */
export function extractContours(terrain: TerrainGeometry, interval = CONTOUR_INTERVAL) {
  if (!Number.isFinite(interval) || interval <= 0) throw new RangeError('Contour interval must be positive and finite');
  const minor: number[] = [];
  const major: number[] = [];
  const { positions, indices } = terrain;
  for (let triangle = 0; triangle < indices.length; triangle += 3) {
    const vertices = [indices[triangle] * 3, indices[triangle + 1] * 3, indices[triangle + 2] * 3];
    const heights = vertices.map(index => positions[index + 1]);
    const first = Math.max(1, Math.ceil(Math.min(...heights) / interval));
    const last = Math.floor(Math.max(...heights) / interval);
    for (let level = first; level <= last; level++) {
      const elevation = level * interval;
      const intersections: number[] = [];
      for (let edge = 0; edge < 3; edge++) {
        const a = vertices[edge];
        const b = vertices[(edge + 1) % 3];
        const ha = positions[a + 1];
        const hb = positions[b + 1];
        // Half-open edges prevent duplicate intersections at vertices and flat edges.
        if ((ha <= elevation && hb > elevation) || (hb <= elevation && ha > elevation)) {
          const t = (elevation - ha) / (hb - ha);
          intersections.push(positions[a] + t * (positions[b] - positions[a]), elevation,
            positions[a + 2] + t * (positions[b + 2] - positions[a + 2]));
        }
      }
      if (intersections.length === 6) (level % 5 === 0 ? major : minor).push(...intersections);
    }
  }
  return { minor: new Float32Array(minor), major: new Float32Array(major) };
}
