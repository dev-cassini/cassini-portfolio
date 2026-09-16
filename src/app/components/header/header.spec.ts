import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Header } from './header';

describe('Header', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders a semantic home link and labelled primary navigation', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('a[aria-label="Cassini home"]')).toBeTruthy();
    expect(element.querySelector('nav[aria-label="Primary navigation"]')).toBeTruthy();
  });

  it('updates the menu state and ARIA state when toggled', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector<HTMLButtonElement>('.nav-toggle')!;
    const nav = element.querySelector<HTMLElement>('#primary-navigation')!;

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(nav.classList.contains('nav--open')).toBe(false);

    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(nav.classList.contains('nav--open')).toBe(true);
  });
});
