import { Component } from '@angular/core';

@Component({
    selector: 'app-logo',
    standalone: true,
    templateUrl: './logo.component.html',
    styles: [`
    :host {
      display: block;
      line-height: 0;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `]
})
export class LogoComponent { }
