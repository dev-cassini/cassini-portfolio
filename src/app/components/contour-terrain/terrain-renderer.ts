import {
  Box3, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments,
  Mesh, MeshBasicMaterial, OrthographicCamera, Scene, Vector3, WebGLRenderer,
} from 'three';
import { createTerrainGeometry, extractContours } from './terrain-geometry';

// Read from the Figma Home / Trailhead variables, 2026-09-17.
export const TERRAIN_PALETTE = {
  ink: '#1f2a24', contour: '#a6b2a3', far: '#dce7e2',
} as const;

export interface TerrainPalette {
  ink: string;
  contour: string;
  far: string;
}

export function createTerrainRenderer(canvas: HTMLCanvasElement, palette: TerrainPalette = TERRAIN_PALETTE) {
  const context = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'low-power' });
  if (!context) throw new Error('WebGL2 is unavailable');
  const renderer = new WebGLRenderer({ canvas, context, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(palette.ink);
  const scene = new Scene();
  const camera = new OrthographicCamera(-8, 8, 6, -6, 0.1, 100);
  camera.position.set(8.5, 8.5, 14);
  camera.lookAt(0, 0.9, 0);
  camera.updateMatrixWorld();

  const terrain = createTerrainGeometry();
  const surfaceGeometry = new BufferGeometry();
  surfaceGeometry.setAttribute('position', new Float32BufferAttribute(terrain.positions, 3));
  surfaceGeometry.setIndex(Array.from(terrain.indices));
  // Depth-only terrain masks contours on the far side of ridges.
  const surfaceMaterial = new MeshBasicMaterial({ colorWrite: false, polygonOffset: true,
    polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const surface = new Mesh(surfaceGeometry, surfaceMaterial);
  surface.renderOrder = 0;
  scene.add(surface);

  const contours = extractContours(terrain);
  const lineGeometries: BufferGeometry[] = [];
  const lineMaterials: LineBasicMaterial[] = [];
  for (const [points, color, opacity] of [
    [contours.minor, palette.contour, 0.72],
    [contours.major, palette.far, 0.94],
  ] as const) {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
    const material = new LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
    const lines = new LineSegments(geometry, material);
    lines.position.y = 0.003;
    lines.renderOrder = 1;
    scene.add(lines);
    lineGeometries.push(geometry);
    lineMaterials.push(material);
  }

  // Fit the projected terrain, rather than a world-space sphere, at every aspect ratio.
  const projected = new Box3();
  const point = new Vector3();
  for (let i = 0; i < terrain.positions.length; i += 3) {
    if (terrain.positions[i + 1] < 0.055) continue;
    point.fromArray(terrain.positions, i).applyMatrix4(camera.matrixWorldInverse);
    projected.expandByPoint(point);
  }
  const center = projected.getCenter(new Vector3());
  const size = projected.getSize(new Vector3());

  return {
    setPalette(nextPalette: TerrainPalette) {
      renderer.setClearColor(nextPalette.ink);
      lineMaterials[0].color.set(nextPalette.contour);
      lineMaterials[1].color.set(nextPalette.far);
      renderer.render(scene, camera);
    },
    resize(width: number, height: number) {
      if (width <= 0 || height <= 0) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      const aspect = width / height;
      const halfHeight = Math.max(size.y / 2, size.x / (2 * aspect)) * 1.08;
      camera.left = center.x - halfHeight * aspect;
      camera.right = center.x + halfHeight * aspect;
      camera.top = center.y + halfHeight;
      camera.bottom = center.y - halfHeight;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    },
    dispose() {
      surfaceGeometry.dispose();
      surfaceMaterial.dispose();
      lineGeometries.forEach(geometry => geometry.dispose());
      lineMaterials.forEach(material => material.dispose());
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
