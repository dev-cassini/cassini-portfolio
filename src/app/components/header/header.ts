import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, ThemeToggle, LogoComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  isMenuOpen = signal(false);

  toggleMenu() {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }
}
