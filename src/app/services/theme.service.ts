import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private platformId = inject(PLATFORM_ID);
    theme = signal<'light' | 'dark'>('light');

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            this.initializeTheme();
        }

        effect(() => {
            const currentTheme = this.theme();
            if (isPlatformBrowser(this.platformId)) {
                document.documentElement.setAttribute('data-theme', currentTheme);
                localStorage.setItem('theme', currentTheme);

                if (currentTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        });
    }

    private initializeTheme() {
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (storedTheme) {
            this.theme.set(storedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.theme.set('dark');
        }
    }

    toggle() {
        this.theme.update(current => current === 'light' ? 'dark' : 'light');
    }
}
