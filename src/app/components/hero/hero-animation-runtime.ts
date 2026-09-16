import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HeroAnimationRuntime {
  random(): number {
    return Math.random();
  }

  now(): number {
    return performance.now();
  }
}
