import { test, expect, loginAsCoach } from './fixtures';

test.describe('Exercise & Template Management (Coach)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCoach(page);
    // Navigate to exercises page
    await page.goto('/coach/exercises');
    await page.waitForURL('**/coach/exercises', { timeout: 10000 });
  });

  test('should display exercises list', async ({ page }) => {
    // Wait for exercises to load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/antrenman|exercise/i')).toBeVisible();
  });

  test('should create a new exercise', async ({ page }) => {
    // Click add button
    const addButton = page.locator('button:has-text("Yeni Antrenman"), button:has-text("New Exercise"), button:has-text("Add")').first();
    await addButton.click();

    // Fill exercise form
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"], input[placeholder*="Name"]').first();
    await nameInput.fill('Test Squat');

    // Select exercise type (WEIGHT)
    const typeSelect = page.locator('select, [role="combobox"]').first();
    await typeSelect.click();
    await page.locator('text=/weight|ağırlık/i').first().click();

    // Submit form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Verify exercise was created
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Test Squat')).toBeVisible();
  });

  test('should navigate to template creation', async ({ page }) => {
    // Click on Templates link
    await page.locator('text=/template|antrenman şablonu|workout plan/i').click();
    await page.waitForURL('**/coach/templates', { timeout: 10000 });
    expect(page.url()).toContain('/coach/templates');
  });
});

test.describe('Template Creation & Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCoach(page);
    await page.goto('/coach/templates');
    await page.waitForURL('**/coach/templates', { timeout: 10000 });
  });

  test('should display templates list', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // Should show list or empty state
    await expect(page.locator('body')).toContainText(/template|şablon/i);
  });

  test('should create a new template with weight exercise', async ({ page }) => {
    // Click create new template button
    const createButton = page.locator('button:has-text("Yeni"), button:has-text("New"), button:has-text("Create")').first();
    await createButton.click();

    // Wait for form to appear and fill template name
    const templateNameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
    await templateNameInput.fill('Full Body Workout');

    const descInput = page.locator('input[name="description"], input[placeholder*="description"], textarea').first();
    await descInput.fill('A full body workout template');

    // Look for add exercise button
    const addExerciseBtn = page.locator('button:has-text("Ekle"), button:has-text("Add Exercise")').first();
    
    // Try to interact with exercise selection
    if (await addExerciseBtn.isVisible()) {
      await addExerciseBtn.click();
      
      // Select first available exercise from list
      const exerciseOption = page.locator('[role="option"], li[data-testid*="exercise"], div[class*="exercise"]').first();
      if (await exerciseOption.isVisible()) {
        await exerciseOption.click();
      }

      // Fill in exercise details (sets, reps, RIR)
      const setsInput = page.locator('input[name*="targetSets"], input[placeholder*="sets"]').first();
      if (await setsInput.isVisible()) {
        await setsInput.fill('3');
      }

      const repsInput = page.locator('input[name*="targetReps"], input[placeholder*="reps"]').first();
      if (await repsInput.isVisible()) {
        await repsInput.fill('10');
      }

      // Submit template
      const submitBtn = page.locator('button[type="submit"], button:has-text("Kaydet"), button:has-text("Save")').first();
      await submitBtn.click();

      // Verify creation
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/coach\/(templates|dashboard)/);
    }
  });

  test('should edit existing template', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Find a template card and click edit
    const editButton = page.locator('button:has-text("Düzenle"), button:has-text("Edit")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForURL(/\/coach\/templates\/\d+\/edit/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/coach\/templates\/\d+\/edit/);
    }
  });
});
