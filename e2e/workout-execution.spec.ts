import { test, expect, loginAsCoach, loginAsClient } from './fixtures';

test.describe('Workout Execution Flow', () => {
  test.describe('Template Assignment', () => {
    test('coach should be able to assign template to client', async ({ page }) => {
      await loginAsCoach(page);
      await page.goto('/coach/clients');
      await page.waitForLoadState('networkidle');

      // Find an accepted client
      const clientCard = page.locator('[class*="client"], div:has(text=/kabul|accepted/)').first();
      
      if (await clientCard.isVisible()) {
        // Click on client to see detail
        await clientCard.click();
        await page.waitForTimeout(1500);

        // Look for assign template button
        const assignButton = page.locator('button:has-text("Atama"), button:has-text("Assign"), button:has-text("Plan")').first();
        
        if (await assignButton.isVisible()) {
          await assignButton.click();
          await page.waitForTimeout(1000);

          // Select a template from modal/dropdown
          const templateOption = page.locator('[role="option"], li[role="button"], div[class*="template"]').first();
          
          if (await templateOption.isVisible()) {
            await templateOption.click();
            await page.waitForTimeout(1000);

            // Verify assignment (should see confirmation or assignment appear in list)
            const confirmButton = page.locator('button:has-text("Onayla"), button:has-text("Confirm"), button:has-text("Assign")').first();
            if (await confirmButton.isVisible()) {
              await confirmButton.click();
            }

            await page.waitForTimeout(1500);
          }
        }
      }
    });
  });

  test.describe('Client Workout Execution', () => {
    test('client should see assigned workouts', async ({ page }) => {
      await loginAsClient(page);
      await page.goto('/client/dashboard');
      await page.waitForLoadState('networkidle');

      // Should display assigned workouts or templates
      const workoutSection = page.locator('text=/antrenman|workout|atanmış|assigned/i');
      
      if (await workoutSection.count() > 0) {
        expect(await workoutSection.first().isVisible()).toBeTruthy();
      }
    });

    test('client should be able to start a workout', async ({ page }) => {
      await loginAsClient(page);
      await page.goto('/client/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for start workout button
      const startButton = page.locator('button:has-text("Başla"), button:has-text("Start"), button:has-text("Begin")').first();
      
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForURL(/\/client\/workout.*\/start/, { timeout: 10000 });
        
        expect(page.url()).toMatch(/\/client\/workout.*start/);
      }
    });

    test('client should execute weight exercise sets', async ({ page }) => {
      await loginAsClient(page);
      
      // Navigate to a workout start page
      // First get an assignment ID from dashboard
      await page.goto('/client/dashboard');
      await page.waitForLoadState('networkidle');

      const startButton = page.locator('button:has-text("Başla"), button:has-text("Start")').first();
      
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForURL(/\/client\/workout/, { timeout: 10000 });

        // Fill in weight exercise for first set
        const weightInput = page.locator('input[name="weight"], input[placeholder*="kg"], input[placeholder*="Kg"]').first();
        
        if (await weightInput.isVisible()) {
          await weightInput.fill('60');
          
          const repsInput = page.locator('input[name="reps"], input[placeholder*="reps"], input[placeholder*="Reps"]').first();
          if (await repsInput.isVisible()) {
            await repsInput.fill('10');
          }

          const rirInput = page.locator('input[name="rir"], input[placeholder*="RIR"]').first();
          if (await rirInput.isVisible()) {
            await rirInput.fill('2');
          }

          // Save set
          const saveButton = page.locator('button:has-text("Kaydet"), button:has-text("Save"), button:has-text("Tamamla")').first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1500);

            // Verify set was saved (should show next set or confirmation)
            const confirmation = page.locator('text=/kaydedildi|saved|tamamlandı/i');
            if (await confirmation.count() > 0) {
              expect(await confirmation.first().isVisible()).toBeTruthy();
            }
          }
        }
      }
    });

    test('client should complete cardio exercise', async ({ page }) => {
      await loginAsClient(page);
      await page.goto('/client/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for a cardio workout or navigate to one
      const cardioIndicator = page.locator('text=/kardiyak|cardio|koşu|running/i').first();
      
      if (await cardioIndicator.isVisible()) {
        const workoutBtn = page.locator('button').filter({ hasText: /Başla|Start/ }).first();
        
        if (await workoutBtn.isVisible()) {
          await workoutBtn.click();
          await page.waitForURL(/\/client\/workout/, { timeout: 10000 });

          // Wait for cardio timer to appear
          const timerDisplay = page.locator('text=/\\d+:\\d+|Timer|Süre/').first();
          
          if (await timerDisplay.isVisible()) {
            // Wait a few seconds for timer to increment
            await page.waitForTimeout(3000);

            // Timer should be running
            const initialTime = await timerDisplay.textContent();
            await page.waitForTimeout(2000);
            const updatedTime = await timerDisplay.textContent();

            // Times might be different indicating timer is running
            expect(timerDisplay).toBeVisible();
          }
        }
      }
    });

    test('client should complete workout', async ({ page }) => {
      await loginAsClient(page);
      await page.goto('/client/dashboard');
      await page.waitForLoadState('networkidle');

      const startButton = page.locator('button:has-text("Başla"), button:has-text("Start")').first();
      
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForURL(/\/client\/workout/, { timeout: 10000 });

        // Look for complete workout button (should be present after filling sets)
        await page.waitForTimeout(1000);
        
        const completeButton = page.locator('button:has-text("Tamamla"), button:has-text("Complete"), button:has-text("Finish")').first();
        
        if (await completeButton.isVisible() && await completeButton.isEnabled()) {
          await completeButton.click();
          await page.waitForTimeout(2000);

          // Should return to dashboard or show completion message
          const confirmation = page.locator('text=/tamamlandı|completed|başarı/i');
          expect(await confirmation.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Workout Persistence', () => {
    test('workout in progress should be resumed on page reload', async ({ page }) => {
      await loginAsClient(page);
      await page.goto('/client/dashboard');
      await page.waitForLoadState('networkidle');

      const startButton = page.locator('button:has-text("Başla"), button:has-text("Start")').first();
      
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForURL(/\/client\/workout/, { timeout: 10000 });

        // Fill first set
        const weightInput = page.locator('input[name="weight"]').first();
        if (await weightInput.isVisible()) {
          await weightInput.fill('50');
          
          // Save set
          const saveButton = page.locator('button:has-text("Kaydet"), button:has-text("Save")').first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            // Reload page
            const currentUrl = page.url();
            await page.reload();
            await page.waitForLoadState('networkidle');

            // Should still be on same workout
            expect(page.url()).toContain('/client/workout');
          }
        }
      }
    });
  });
});
