import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
    selector: 'app-theme-toggle',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './theme-toggle.html',
    styleUrl: './theme-toggle.scss'
})
export class ThemeToggle {
    themeService = inject(ThemeService);

    toggleTheme() {
        this.themeService.toggle();
    }
}
