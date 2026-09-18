import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContourTerrain } from '../contour-terrain/contour-terrain';

@Component({
  selector: 'app-hero-visual',
  imports: [ContourTerrain],
  standalone: true,
  templateUrl: './hero-visual.html',
  styleUrl: './hero-visual.scss',
  host: { '[attr.data-hero-direction]': "'contour-terrain'" },
})
export class HeroVisual {}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, HeroVisual],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {}
