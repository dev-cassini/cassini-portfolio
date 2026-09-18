import { expect, test } from '@playwright/test';

test('renders the portfolio landing page and toggles the theme', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Thoughtful software, built to climb.' })).toBeVisible();
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('navigates to the projects page', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'View summit log' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Routes worth documenting.' })).toBeVisible();
});

test('opens and closes primary navigation on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/about');

  const menuButton = page.getByRole('button', { name: 'Toggle navigation menu' });
  await menuButton.click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();

  await page.getByRole('link', { name: 'Projects' }).click();
  await expect(page).toHaveURL(/\/projects$/);
});

test('keeps the static terrain visible when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.locator('app-hero-visual')).toBeVisible();
});

test('renders the approved contour-terrain hero without browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.locator('app-hero-visual')).toHaveAttribute('data-hero-direction', 'contour-terrain');
  await expect(page.locator('app-hero-visual .visual')).toBeVisible();
  await expect(page.locator('app-contour-terrain')).toHaveAttribute('data-terrain-status', 'ready');
  await expect(page.locator('app-contour-terrain canvas')).toBeVisible();
  await expect(page.locator('.system-stage')).toHaveCount(4);
  await expect(page.locator('.system-route--trace')).toBeVisible();

  expect(errors).toEqual([]);
});

test('keeps the static terrain visible on mobile with reduced motion and releases it on navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('app-contour-terrain')).toHaveAttribute('data-terrain-status', 'ready');
  await expect(page.locator('app-contour-terrain canvas')).toBeVisible();
  await expect(page.locator('.system-route--trace')).toHaveCSS('animation-name', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'View summit log' }).click();
  await expect(page.locator('app-contour-terrain')).toHaveCount(0);
  await page.goBack();
  await expect(page.locator('app-contour-terrain')).toHaveAttribute('data-terrain-status', 'ready');
});

test('shows the matching terrain still when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof getContext>) {
      if (String(args[0]).includes('webgl')) return null;
      return getContext.apply(this, args);
    } as typeof getContext;
  });
  await page.goto('/');
  await expect(page.locator('app-contour-terrain')).toHaveAttribute('data-terrain-status', 'fallback');
  const fallback = page.locator('.terrain-fallback');
  await expect(fallback).toBeVisible();
  await expect.poll(() => fallback.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole('link', { name: 'View summit log' })).toBeVisible();
});

test('uses the contour terrain as the only hero direction', async ({ page }) => {
  await page.goto('/?hero=unknown');
  await expect(page.locator('app-hero-visual')).toHaveAttribute('data-hero-direction', 'contour-terrain');
  await expect(page.locator('canvas')).toHaveCount(1);
});
