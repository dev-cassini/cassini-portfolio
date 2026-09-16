import { Routes } from '@angular/router';
import { Hero } from './components/hero/hero';

export const routes: Routes = [
    { path: '', component: Hero, title: 'Cassini | Full Stack Engineer' },
    { path: 'about', loadComponent: () => import('./components/about/about').then((m) => m.About), title: 'About | Cassini' },
    { path: 'projects', loadComponent: () => import('./components/projects/projects').then((m) => m.Projects), title: 'Projects | Cassini' },
    { path: 'contact', loadComponent: () => import('./components/contact/contact').then((m) => m.Contact), title: 'Contact | Cassini' },
    { path: '**', redirectTo: '' }
];
