import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, effect, inject, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import * as THREE from 'three';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, LogoComponent],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;

  private themeService = inject(ThemeService);
  private ngZone = inject(NgZone);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private cubes: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private hoveredCube: THREE.Mesh | null = null;
  private animationId: number | null = null;
  private time = 0;

  // Cleanup function for resize listener
  private removeResizeListener?: () => void;
  private removeMouseMoveListener?: () => void;

  constructor() {
    // React to theme changes
    effect(() => {
      const theme = this.themeService.theme();
      this.updateThemeColors(theme);
    });
  }

  ngAfterViewInit() {
    this.initThree();
    this.setupInteraction();

    // Start animation loop outside Angular zone to prevent change detection spam
    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  ngOnDestroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.removeResizeListener) this.removeResizeListener();
    if (this.removeMouseMoveListener) this.removeMouseMoveListener();

    // Dispose Three.js resources
    if (this.renderer) {
      this.renderer.dispose();
    }

    this.cubes.forEach(cube => {
      if (cube.geometry) cube.geometry.dispose();
      if (cube.material instanceof THREE.Material) cube.material.dispose();

      // Dispose wireframe
      const wireframe = cube.userData['wireframe'];
      if (wireframe) {
        if (wireframe.geometry) wireframe.geometry.dispose();
        if (wireframe.material) wireframe.material.dispose();
      }
    });
  }

  private initThree() {
    if (!this.canvasContainer) return;

    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(8, 8, 8);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Create Cubes
    this.createCubes();

    // Initial Theme Setup
    this.updateThemeColors(this.themeService.theme());

    // Resize Handler
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;

      this.camera.aspect = newWidth / newHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    this.removeResizeListener = () => window.removeEventListener('resize', handleResize);
  }

  private createCubes() {
    const gridSize = 5;
    const spacing = 1.2;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const edges = new THREE.EdgesGeometry(geometry);

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const material = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
        });

        const cube = new THREE.Mesh(geometry, material);

        const lineMaterial = new THREE.LineBasicMaterial();
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        cube.add(wireframe);

        // Center the grid
        const offsetX = (gridSize - 1) * spacing / 2;
        const offsetZ = (gridSize - 1) * spacing / 2;

        cube.position.x = x * spacing - offsetX;
        cube.position.z = z * spacing - offsetZ;
        cube.position.y = 0;

        cube.userData = {
          x,
          z,
          baseY: 0,
          highlightTime: (x * 2 + z * 3) * 0.5,
          isCollapsing: false,
          collapseProgress: 0,
          isHidden: false,
          hideStartTime: 0,
          spawnDelay: Math.random() * 3,
          hasSpawned: false,
          isGrowing: false,
          growProgress: 0,
          animationType: Math.random() > 0.5 ? 'collapse' : 'expand',
          expandDirection: Math.random() > 0.5 ? 'up' : 'down',
          isRetracting: false,
          wireframe: wireframe,
          isHovered: false
        };

        cube.visible = false;

        this.scene.add(cube);
        this.cubes.push(cube);
      }
    }
  }

  private setupInteraction() {
    this.ngZone.runOutsideAngular(() => {
      const handleMouseMove = (event: MouseEvent) => {
        const rect = this.renderer.domElement.getBoundingClientRect();

        // Check if mouse is actually inside the canvas rect
        if (
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        ) {
          this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        } else {
          // Move mouse out of raycasting range if outside canvas
          this.mouse.x = -1000;
          this.mouse.y = -1000;
        }

        // Interaction Raycasting
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.cubes, false);

        // Clear previous hover
        if (this.hoveredCube && !this.hoveredCube.userData['isCollapsing']) {
          this.hoveredCube.userData['isHovered'] = false;
        }

        // Set new hover
        if (intersects.length > 0) {
          this.hoveredCube = intersects[0].object as THREE.Mesh;
          if (!this.hoveredCube.userData['isCollapsing']) {
            this.hoveredCube.userData['isHovered'] = true;
          }
        } else {
          this.hoveredCube = null;
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      this.removeMouseMoveListener = () => window.removeEventListener('mousemove', handleMouseMove);
    });
  }

  private updateThemeColors(theme: 'light' | 'dark') {
    if (!this.scene) return;

    const isDarkMode = theme === 'dark';

    // Update background
    // We use alpha: true in renderer, so we might not need scene background if CSS handles it.
    // But the React code set it explicitly. Let's match the React code logic but use our theme colors.
    // Actually, let's keep it transparent so the CSS gradient background shows through if we want.
    // The React code used: const bgColor = isDarkMode ? 0x0a0a0a : 0xffffff;
    // Let's stick to the React logic for now to ensure it looks as intended.
    const bgColor = isDarkMode ? 0x0b0c10 : 0xffffff; // Using our dark theme bg
    this.scene.background = new THREE.Color(bgColor);

    const colors = {
      wireframe: isDarkMode ? 0xffffff : 0x000000,
      wireframeHover: isDarkMode ? 0x000000 : 0xffffff,
      fill: isDarkMode ? 0x000000 : 0xffffff,
      fillHover: isDarkMode ? 0xffffff : 0x000000,
      highlightFill: isDarkMode ? 0xffffff : 0x000000
    };

    // Store colors in a property accessible to animate loop
    (this as any).currentColors = colors;
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    this.time += 0.02;

    const colors = (this as any).currentColors || {
      wireframe: 0xffffff,
      wireframeHover: 0x000000,
      fill: 0x000000,
      fillHover: 0xffffff,
      highlightFill: 0xffffff
    };

    this.cubes.forEach((cube) => {
      const { x, z, highlightTime, wireframe } = cube.userData;

      // Handle initial spawn animation
      if (!cube.userData['hasSpawned']) {
        if (this.time > cube.userData['spawnDelay']) {
          cube.userData['hasSpawned'] = true;
          cube.userData['isGrowing'] = true;
          cube.userData['growProgress'] = 0;
          cube.visible = true;
        } else {
          return;
        }
      }

      // Check if cube is hidden and waiting to reappear
      if (cube.userData['isHidden']) {
        const timeSinceHidden = this.time - cube.userData['hideStartTime'];
        if (timeSinceHidden > 2 + Math.random() * 2) {
          cube.userData['isHidden'] = false;
          cube.userData['isGrowing'] = true;
          cube.userData['growProgress'] = 0;
          cube.visible = true;
        } else {
          return;
        }
      }

      // Create wave pattern using sine waves
      const wave1 = Math.sin(x * 0.5 + this.time) * 2;
      const wave2 = Math.sin(z * 0.5 + this.time * 1.2) * 2;
      const wave3 = Math.sin((x + z) * 0.3 + this.time * 0.8) * 1.5;

      const height = (wave1 + wave2 + wave3) / 3;
      const targetScale = 1 + height * 0.5;

      // Handle growing animation when cube reappears
      if (cube.userData['isGrowing']) {
        cube.userData['growProgress'] += 0.03;

        if (cube.userData['growProgress'] >= 1) {
          cube.userData['isGrowing'] = false;
          cube.userData['growProgress'] = 1;
        }

        cube.scale.y = targetScale * cube.userData['growProgress'];
        cube.position.y = 0;
        (cube.material as THREE.MeshBasicMaterial).opacity = 0;
        (cube.material as THREE.MeshBasicMaterial).color.setHex(colors.fill);
        (wireframe.material as THREE.LineBasicMaterial).color.setHex(colors.wireframe);
        return;
      }

      // Random highlight effect
      const highlightCycle = (this.time + highlightTime) % 18;
      const isHighlighted = !this.hoveredCube && highlightCycle < 0.5;

      // Handle collapsing animation
      if (cube.userData['isCollapsing']) {
        cube.userData['collapseProgress'] += 0.02;

        if (cube.userData['animationType'] === 'collapse') {
          if (cube.userData['collapseProgress'] >= 1) {
            cube.userData['isCollapsing'] = false;
            cube.userData['isHidden'] = true;
            cube.userData['hideStartTime'] = this.time;
            cube.visible = false;
            cube.userData['animationType'] = Math.random() > 0.5 ? 'collapse' : 'expand';
            cube.userData['expandDirection'] = Math.random() > 0.5 ? 'up' : 'down';
            return;
          }
          cube.scale.y = targetScale * (1 - cube.userData['collapseProgress']);
          cube.position.y = 0;
          (cube.material as THREE.MeshBasicMaterial).opacity = 0.3;
          (cube.material as THREE.MeshBasicMaterial).color.setHex(colors.highlightFill);
          (wireframe.material as THREE.LineBasicMaterial).color.setHex(colors.wireframe);
          return;
        } else {
          const maxScale = targetScale + 5;

          if (!cube.userData['isRetracting']) {
            if (cube.userData['collapseProgress'] >= 0.5) {
              cube.userData['isRetracting'] = true;
              cube.userData['collapseProgress'] = 0;
            } else {
              cube.scale.y = targetScale + (maxScale - targetScale) * (cube.userData['collapseProgress'] * 2);

              if (cube.userData['expandDirection'] === 'up') {
                cube.position.y = (cube.scale.y - targetScale) / 2;
              } else {
                cube.position.y = -(cube.scale.y - targetScale) / 2;
              }
            }
          } else {
            if (cube.userData['collapseProgress'] >= 1) {
              cube.userData['isCollapsing'] = false;
              cube.userData['isRetracting'] = false;
              cube.userData['isHidden'] = true;
              cube.userData['hideStartTime'] = this.time;
              cube.visible = false;
              cube.userData['animationType'] = Math.random() > 0.5 ? 'collapse' : 'expand';
              cube.userData['expandDirection'] = Math.random() > 0.5 ? 'up' : 'down';
              return;
            }

            cube.scale.y = maxScale * (1 - cube.userData['collapseProgress']);

            if (cube.userData['expandDirection'] === 'up') {
              cube.position.y = (maxScale - targetScale) / 2 + (maxScale * cube.userData['collapseProgress']) / 2;
            } else {
              cube.position.y = -(maxScale - targetScale) / 2 - (maxScale * cube.userData['collapseProgress']) / 2;
            }
          }

          (cube.material as THREE.MeshBasicMaterial).opacity = 0.3;
          (cube.material as THREE.MeshBasicMaterial).color.setHex(colors.highlightFill);
          (wireframe.material as THREE.LineBasicMaterial).color.setHex(colors.wireframe);
          return;
        }
      }

      // Normal wave animation
      cube.scale.y = targetScale;
      cube.position.y = 0;

      // Check for highlight trigger
      if (isHighlighted && highlightCycle > 0.3 && highlightCycle < 0.35) {
        cube.userData['isCollapsing'] = true;
        cube.userData['collapseProgress'] = 0;
      }

      // Normal highlighting (either from cycle or hover)
      const isHoveredCube = cube.id === this.hoveredCube?.id;
      if (isHoveredCube && !cube.userData['isCollapsing']) {
        (cube.material as THREE.MeshBasicMaterial).opacity = 1;
        (cube.material as THREE.MeshBasicMaterial).color.setHex(colors.fillHover);
        (wireframe.material as THREE.LineBasicMaterial).color.setHex(colors.wireframeHover);
      } else if (isHighlighted && !cube.userData['isCollapsing']) {
        (cube.material as THREE.MeshBasicMaterial).opacity = 0.3;
        (cube.material as THREE.MeshBasicMaterial).color.setHex(colors.highlightFill);
        (wireframe.material as THREE.LineBasicMaterial).color.setHex(colors.wireframe);
      } else if (!cube.userData['isCollapsing']) {
        (cube.material as THREE.MeshBasicMaterial).opacity = 0;
        (cube.material as THREE.MeshBasicMaterial).color.setHex(colors.fill);
        (wireframe.material as THREE.LineBasicMaterial).color.setHex(colors.wireframe);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}
