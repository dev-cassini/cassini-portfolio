import type { LineBasicMaterial, LineSegments } from 'three';

export type AnimationType = 'collapse' | 'expand';
export type ExpandDirection = 'up' | 'down';

export interface AnimationCycle {
  animationType: AnimationType;
  expandDirection: ExpandDirection;
}

export interface CubeAnimationState extends AnimationCycle {
  x: number;
  z: number;
  originalX: number;
  originalZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  scatterRotationX: number;
  scatterRotationY: number;
  scatterRotationZ: number;
  highlightTime: number;
  isCollapsing: boolean;
  collapseProgress: number;
  isHidden: boolean;
  reappearanceTime: number;
  spawnDelay: number;
  hasSpawned: boolean;
  isGrowing: boolean;
  growProgress: number;
  isRetracting: boolean;
  wireframe: LineSegments<any, LineBasicMaterial>;
}

export interface AnimationColors {
  wireframe: number;
  wireframeHover: number;
  fill: number;
  fillHover: number;
  highlightFill: number;
}

const REAPPEAR_DELAY_SECONDS = 2;
const REAPPEAR_DELAY_VARIANCE_SECONDS = 2;
const RANDOM_TRIGGER_START = 0.3;
const RANDOM_TRIGGER_END = 0.35;

export function shouldTriggerRandomSequence(isAnyCubeHovered: boolean, highlightCycle: number): boolean {
  return !isAnyCubeHovered && highlightCycle > RANDOM_TRIGGER_START && highlightCycle < RANDOM_TRIGGER_END;
}

export function getReappearanceTime(hiddenAt: number, random: number): number {
  return hiddenAt + REAPPEAR_DELAY_SECONDS + random * REAPPEAR_DELAY_VARIANCE_SECONDS;
}

export function isReappearanceDue(currentTime: number, reappearanceTime: number): boolean {
  return currentTime >= reappearanceTime;
}

export function createNextCycle(random: () => number = Math.random): AnimationCycle {
  return {
    animationType: random() > 0.5 ? 'expand' : 'collapse',
    expandDirection: random() > 0.5 ? 'down' : 'up',
  };
}
