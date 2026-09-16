import { Routes } from '@angular/router';
import { Hero } from './components/hero/hero';
import { About } from './components/about/about';
import { Projects } from './components/projects/projects';
import { Contact } from './components/contact/contact';

export const routes: Routes = [
    { path: '', component: Hero, title: 'Cassini | Full Stack Engineer' },
    { path: 'about', component: About, title: 'About | Cassini' },
    { path: 'projects', component: Projects, title: 'Projects | Cassini' },
    { path: 'contact', component: Contact, title: 'Contact | Cassini' },
    { path: '**', redirectTo: '' }
];
