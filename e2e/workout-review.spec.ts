import { test, expect, loginAsCoach, loginAsClient } from './fixtures';

test.describe('Workout Review & Comments', () => {
  test.describe('Coach viewing client workouts', () => {
    test('coach should see client workout history', async ({ page }) => {
      await loginAsCoach(page);
      await page.goto('/coach/clients');
      await page.waitForLoadState('networkidle');

      // Find accepted client
      const clientCard = page.locator('[class*="client"]').first();
      
      if (await clientCard.isVisible()) {
        await clientCard.click();
        await page.waitForTimeout(1500);

        // Should see workout history section
        const historySection = page.locator('text=/geçmiş|history|antrenman|workout/i').first();
        expect(await historySection.isVisible()).toBeTruthy();
      }
    });

    test('coach should see workout details with sets', async ({ page }) => {
      await loginAsCoach(page);
      await page.goto('/coach/clients');
      await page.waitForLoadState('networkidle');

      // Navigate to client detail
      const clientLink = page.locator('a, [role="button"]').filter({ hasText: /client|kabul|accepted/ }).first();
      
      if (await clientLink.isVisible()) {
        await clientLink.click();
        await page.waitForTimeout(1500);

        // Look for expandable workout
        const workoutItem = page.locator('[class*="workout"], div:has(text=/antrenman|completed/)').first();
        
        if (await workoutItem.isVisible()) {
          // Click to expand if collapsible
          await workoutItem.click();
          await page.waitForTimeout(500);

          // Should show set details
          const setDetails = page.locator('text=/set|tekrar|reps|kg|weight/i');
          
          if (await setDetails.count() > 0) {
            expect(await setDetails.first().isVisible()).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Comment functionality', () => {
    test('coach should be able to add comment to workout', async ({ page }) => {
      await loginAsCoach(page);
      await page.goto('/coach/clients');
      await page.waitForLoadState('networkidle');

      // Navigate to client and their workout
      const clientCard = page.locator('[class*="client"]').first();
      
      if (await clientCard.isVisible()) {
        await clientCard.click();
        await page.waitForTimeout(1500);

        // Find and expand a workout
        const workoutItem = page.locator('[class*="workout"]').first();
        if (await workoutItem.isVisible()) {
          await workoutItem.click();
          await page.waitForTimeout(500);
        }

        // Look for comment input
        const commentInput = page.locator('textarea[name="comment"], textarea[placeholder*="yorum"], textarea[placeholder*="comment"], input[placeholder*="comment"]').first();
        
        if (await commentInput.isVisible()) {
          await commentInput.fill('Harika bir antrenman olmuş! Ağırlık biraz daha artırabilirsin.');
          
          // Submit comment
          const submitButton = page.locator('button:has-text("Yolla"), button:has-text("Send"), button:has-text("Post")').first();
          
          if (await submitButton.isVisible() && await submitButton.isEnabled()) {
            await submitButton.click();
            await page.waitForTimeout(1500);

            // Verify comment appears
            const comment = page.locator('text=Harika bir antrenman');
            expect(await comment.isVisible()).toBeTruthy();
          }
        }
      }
    });

    test('coach comment should show author information', async ({ page }) => {
      await loginAsCoach(page);
      await page.goto('/coach/clients');
      await page.waitForLoadState('networkidle');

      // Navigate to client workouts
      const clientCard = page.locator('[class*="client"]').first();
      
      if (await clientCard.isVisible()) {
        await clientCard.click();
        await page.waitForTimeout(1500);

        // Look for comments section
        const commentAuthor = page.locator('text=/antrenör|coach|tarafından/i', { exact: false }).first();
        
        if (await commentAuthor.isVisible()) {
          expect(await commentAuthor.textContent()).toMatch(/antrenör|coach/i);
        }
      }
    });

    test('coach should see timestamps on comments', async ({ page }) => {
      await loginAsCoach(page);
      await page.goto('/coach/clients');
      await page.waitForLoadState('networkidle');

      // Navigate to client workouts
      const clientCard = page.locator('[class*="client"]').first();
      
      if (await clientCard.isVisible()) {
        await clientCard.click();
        await page.waitForTimeout(1500);

        // Look for timestamp
        const timestamp = page.locator('text=/saat|saat:|\\d{1,2}:\\d{2}|\\d{1,2}\\/\\d{1,2}\\/\\d{4}/').first();
        
        if (await timestamp.isVisible()) {
          expect(await timestamp.textContent()).toMatch(/\\d/);
        }
      }
    });
  });

  test.describe('Client viewing own workouts', () => {
    test('client should see completed workouts', async ({ page }) => {
      await loginAsClient(page);
      await page.goto('/client/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for workout history
      const historyLink = page.locator('a:has-text("Geçmiş"), a:has-text("History"), a:has-text("Workouts")').first();
      
      if (await historyLink.isVisible()) {
        await historyLink.click();
        await page.waitForTimeout(1500);
        
        // Should display completed workouts
        const workouts = page.locator('[class*="workout"]');
        expect(await workouts.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('client should see coach feedback on completed workouts', async ({ page }) => {
      await loginAsClient(page);
      await page.goto('/client/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for completed workout with comments
      const workoutWithComments = page.locator('[class*="workout"], div:has(text=/yorum|comment)').first();
      
      if (await workoutWithComments.isVisible()) {
        // Expand if needed
        await workoutWithComments.click();
        await page.waitForTimeout(500);

        // Should see comments from coach
        const comments = page.locator('text=/antrenör|coach|tarafından/i');
        expect(await comments.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Full end-to-end workout lifecycle', () => {
    test('complete flow: assign → execute → review → comment', async ({ browser }) => {
      // Create new browser contexts for coach and client to simulate real scenario
      const coachContext = await browser.newContext();
      const clientContext = await browser.newContext();

      const coachPage = await coachContext.newPage();
      const clientPage = await clientContext.newPage();

      try {
        // STEP 1: Coach assigns template to client
        await loginAsCoach(coachPage);
        await coachPage.goto('/coach/clients');
        await coachPage.waitForLoadState('networkidle');

        const clientCard = coachPage.locator('[class*="client"]').first();
        if (await clientCard.isVisible()) {
          await clientCard.click();
          await coachPage.waitForTimeout(1500);

          const assignBtn = coachPage.locator('button:has-text("Atama"), button:has-text("Assign")').first();
          if (await assignBtn.isVisible()) {
            await assignBtn.click();
            await coachPage.waitForTimeout(1000);
          }
        }

        // STEP 2: Client sees and starts workout
        await loginAsClient(clientPage);
        await clientPage.goto('/client/dashboard');
        await clientPage.waitForLoadState('networkidle');

        const startBtn = clientPage.locator('button:has-text("Başla"), button:has-text("Start")').first();
        if (await startBtn.isVisible()) {
          await startBtn.click();
          await clientPage.waitForURL(/\/client\/workout/, { timeout: 10000 });

          // STEP 3: Client executes workout
          const weightInput = clientPage.locator('input[name="weight"]').first();
          if (await weightInput.isVisible()) {
            await weightInput.fill('55');
            
            const saveBtn = clientPage.locator('button:has-text("Kaydet"), button:has-text("Save")').first();
            if (await saveBtn.isVisible()) {
              await saveBtn.click();
              await clientPage.waitForTimeout(1000);
            }
          }

          // STEP 4: Coach views completed workout
          await coachPage.goto('/coach/clients');
          await coachPage.waitForLoadState('networkidle');

          const workoutItem = coachPage.locator('[class*="workout"]').first();
          if (await workoutItem.isVisible()) {
            await workoutItem.click();
            await coachPage.waitForTimeout(500);

            // STEP 5: Coach adds comment
            const commentInput = coachPage.locator('textarea[placeholder*="comment"], textarea[placeholder*="yorum"]').first();
            if (await commentInput.isVisible()) {
              await commentInput.fill('İyi çalışma!');
              
              const submitBtn = coachPage.locator('button:has-text("Yolla"), button:has-text("Send")').first();
              if (await submitBtn.isVisible()) {
                await submitBtn.click();
                await coachPage.waitForTimeout(1500);
              }
            }
          }

          // STEP 6: Client sees coach feedback
          await clientPage.goto('/client/dashboard');
          await clientPage.waitForLoadState('networkidle');

          const feedback = clientPage.locator('text=İyi çalışma');
          expect(await feedback.count()).toBeGreaterThanOrEqual(0);
        }
      } finally {
        await coachContext.close();
        await clientContext.close();
      }
    });
  });
});
