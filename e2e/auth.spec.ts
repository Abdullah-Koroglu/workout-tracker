import { test, expect, loginAsCoach, loginAsClient, COACH_CREDENTIALS, CLIENT_CREDENTIALS } from './fixtures';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1, h2')).toContainText(/giriş yap|login/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should remain on login page or show error
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('coach login should redirect to coach dashboard', async ({ page }) => {
    await loginAsCoach(page);
    expect(page.url()).toContain('/coach/dashboard');
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('client login should redirect to client dashboard', async ({ page }) => {
    await loginAsClient(page);
    expect(page.url()).toContain('/client/dashboard');
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('should display coach dashboard content after login', async ({ page }) => {
    await loginAsCoach(page);
    
    // Should show coach-specific elements
    await expect(page.locator('text=/antrenmanlar|exercises|templates/i')).toBeVisible({ timeout: 5000 });
  });

  test('should display client dashboard content after login', async ({ page }) => {
    await loginAsClient(page);
    
    // Should show client-specific elements
    await expect(page.locator('text=/antrenörler|coaches|templates/i')).toBeVisible({ timeout: 5000 });
  });

  test('should prevent access to coach routes for non-coaches', async ({ page }) => {
    await loginAsClient(page);
    await page.goto('/coach/dashboard');
    
    // Should either redirect or show 404
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toContain('/coach/dashboard');
  });

  test('should prevent access to client routes for non-clients', async ({ page }) => {
    await loginAsCoach(page);
    await page.goto('/client/dashboard');
    
    // Should either redirect or show 404
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toContain('/client/dashboard');
  });
});
