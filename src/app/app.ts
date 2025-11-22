import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { ThemeToggle } from './components/theme-toggle/theme-toggle';
import { filter } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Header,
    Footer,
    ThemeToggle
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  private router = inject(Router);
  isHomePage = true;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isHomePage = event.url === '/' || event.url === '/#';
    });
  }
}
