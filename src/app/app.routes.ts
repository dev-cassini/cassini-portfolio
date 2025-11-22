import { Routes } from '@angular/router';
import { Hero } from './components/hero/hero';
import { About } from './components/about/about';
import { Projects } from './components/projects/projects';
import { Contact } from './components/contact/contact';

export const routes: Routes = [
    { path: '', component: Hero },
    { path: 'about', component: About },
    { path: 'projects', component: Projects },
    { path: 'contact', component: Contact },
    { path: '**', redirectTo: '' }
];
