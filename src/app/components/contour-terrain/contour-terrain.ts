import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, Injector, NgZone, signal, viewChild } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import type { TerrainPalette } from './terrain-renderer';

@Component({
  selector: 'app-contour-terrain',
  imports: [],
  templateUrl: './contour-terrain.html',
  styleUrl: './contour-terrain.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-terrain-status]': 'status()' },
})
export class ContourTerrain {
  protected readonly status = signal<'loading' | 'ready' | 'fallback'>('loading');
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private readonly injector = inject(Injector);
  private readonly themeService = inject(ThemeService);

  constructor() {
    afterNextRender(() => { void this.initialize(); });
  }

  private get palette(): TerrainPalette {
    const styles = getComputedStyle(document.documentElement);
    return {
      ink: styles.getPropertyValue('--surface-inverse').trim(),
      contour: styles.getPropertyValue('--line-color').trim(),
      far: styles.getPropertyValue('--text-muted').trim(),
    };
  }

  private async initialize() {
    try {
      const { createTerrainRenderer } = await import('./terrain-renderer');
      if (this.destroyRef.destroyed) return;
      this.zone.runOutsideAngular(() => {
        const canvas = this.canvas().nativeElement;
        const view = createTerrainRenderer(canvas, this.palette);
        const resize = () => {
          view.resize(canvas.clientWidth, canvas.clientHeight);
        };
        const onLost = (event: Event) => {
          event.preventDefault();
          this.status.set('fallback');
        };
        const onRestored = () => { resize(); this.status.set('ready'); };
        canvas.addEventListener('webglcontextlost', onLost);
        canvas.addEventListener('webglcontextrestored', onRestored);
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        this.destroyRef.onDestroy(() => {
          observer.disconnect();
          canvas.removeEventListener('webglcontextlost', onLost);
          canvas.removeEventListener('webglcontextrestored', onRestored);
          view.dispose();
        });
        resize();
        this.status.set('ready');
        effect(() => {
          this.themeService.theme();
          view.setPalette(this.palette);
        }, { injector: this.injector });
      });
    } catch {
      if (!this.destroyRef.destroyed) this.status.set('fallback');
    }
  }
}
