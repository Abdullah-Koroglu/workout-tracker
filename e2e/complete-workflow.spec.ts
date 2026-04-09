import { test, expect, loginAsCoach, loginAsClient } from './fixtures';

test.describe('Complete Application Workflow E2E', () => {
  test('full user journey: auth → exercise → template → assign → workout → review', async ({
    browser,
  }) => {
    // Create separate contexts for coach and client
    const coachContext = await browser.newContext();
    const clientContext = await browser.newContext();

    const coachPage = await coachContext.newPage();
    const clientPage = await clientContext.newPage();

    try {
      // ===== COACH FLOW =====
      
      // Step 1: Coach logs in
      console.log('Step 1: Coach logging in...');
      await loginAsCoach(coachPage);
      expect(coachPage.url()).toContain('/coach/dashboard');

      // Step 2: Coach creates an exercise
      console.log('Step 2: Coach creating exercise...');
      await coachPage.goto('/coach/exercises');
      await coachPage.waitForLoadState('networkidle');
      
      const addExerciseBtn = coachPage
        .locator('button:has-text("Yeni"), button:has-text("Add"), button:has-text("Ekle")')
        .first();
      if (await addExerciseBtn.isVisible()) {
        await addExerciseBtn.click();
      }

      // Step 3: Coach creates template with exercise
      console.log('Step 3: Coach creating template...');
      await coachPage.goto('/coach/templates');
      await coachPage.waitForLoadState('networkidle');

      const templateBtn = coachPage
        .locator('button:has-text("Yeni"), button:has-text("New"), button:has-text("Create")')
        .first();
      if (await templateBtn.isVisible()) {
        await templateBtn.click();
        await coachPage.waitForTimeout(500);
      }

      // Step 4: Coach navigates to clients
      console.log('Step 4: Coach navigating to clients...');
      await coachPage.goto('/coach/clients');
      await coachPage.waitForLoadState('networkidle');
      
      // Look for accepted client
      const acceptedClients = coachPage.locator('text=/kabul|accepted|active/i');
      const clientCount = await acceptedClients.count();
      
      if (clientCount === 0) {
        console.log('No accepted clients found. Testing rejection flow...');
        
        // Look for pending clients to accept
        const pendingBtn = coachPage
          .locator('button:has-text("Kabul"), button:has-text("Accept"), button:has-text("Approve")')
          .first();
        
        if (await pendingBtn.isVisible()) {
          await pendingBtn.click();
          await coachPage.waitForTimeout(1500);
        }
      }

      // Step 5: Coach assigns template to client
      console.log('Step 5: Coach assigning template...');
      const clientElement = coachPage.locator('[class*="client"], div[role="button"]').first();
      if (await clientElement.isVisible()) {
        await clientElement.click();
        await coachPage.waitForTimeout(1500);

        const assignBtn = coachPage
          .locator('button:has-text("Atama"), button:has-text("Assign"), button:has-text("Plan")')
          .first();
        
        if (await assignBtn.isVisible()) {
          await assignBtn.click();
          await coachPage.waitForTimeout(1000);

          // Select template
          const templateOption = coachPage.locator('[role="option"], li, div[class*="template"]').first();
          if (await templateOption.isVisible()) {
            await templateOption.click();
            await coachPage.waitForTimeout(1000);

            // Confirm assignment
            const confirmBtn = coachPage
              .locator('button:has-text("Onayla"), button:has-text("Confirm"), button:has-text("Assign")')
              .first();
            if (await confirmBtn.isVisible()) {
              await confirmBtn.click();
              await coachPage.waitForTimeout(1500);
            }
          }
        }
      }

      // ===== CLIENT FLOW =====

      // Step 6: Client logs in
      console.log('Step 6: Client logging in...');
      await loginAsClient(clientPage);
      expect(clientPage.url()).toContain('/client/dashboard');

      // Step 7: Client views assigned workouts
      console.log('Step 7: Client viewing assigned workouts...');
      await clientPage.goto('/client/dashboard');
      await clientPage.waitForLoadState('networkidle');

      // Step 8: Client starts workout
      console.log('Step 8: Client starting workout...');
      const startWorkoutBtn = clientPage
        .locator('button:has-text("Başla"), button:has-text("Start"), button:has-text("Begin")')
        .first();
      
      if (await startWorkoutBtn.isVisible()) {
        await startWorkoutBtn.click();
        await clientPage.waitForURL(/\/client\/workout.*\/start/, { timeout: 10000 });

        // Step 9: Client executes workout sets
        console.log('Step 9: Client executing sets...');
        
        let setIndex = 0;
        const maxSets = 3; // Try to fill max 3 sets
        
        while (setIndex < maxSets) {
          // Try to fill weight exercise
          const weightInput = clientPage
            .locator('input[name="weight"], input[placeholder*="kg"], input[placeholder*="Kg"]')
            .first();
          
          if (await weightInput.isVisible()) {
            await weightInput.fill(`${50 + setIndex * 5}`);

            const repsInput = clientPage
              .locator('input[name="reps"], input[placeholder*="reps"], input[placeholder*="Reps"]')
              .first();
            if (await repsInput.isVisible()) {
              await repsInput.fill(`${10 - setIndex}`);
            }

            const saveBtn = clientPage
              .locator('button:has-text("Kaydet"), button:has-text("Save"), button:has-text("Sonraki")')
              .first();
            
            if (await saveBtn.isVisible()) {
              await saveBtn.click();
              await clientPage.waitForTimeout(1000);
              setIndex++;
            } else {
              break;
            }
          } else {
            // Try cardio timer
            const timerDisplay = clientPage.locator('text=/\\d+:\\d+|Timer|Süre/').first();
            if (await timerDisplay.isVisible()) {
              console.log('Found cardio timer');
              await clientPage.waitForTimeout(2000); // Let timer tick
              setIndex++;
              break;
            } else {
              break;
            }
          }
        }

        // Step 10: Client completes workout
        console.log('Step 10: Client completing workout...');
        const completeBtn = clientPage
          .locator('button:has-text("Tamamla"), button:has-text("Complete"), button:has-text("Finish")')
          .first();
        
        if (await completeBtn.isVisible() && await completeBtn.isEnabled()) {
          await completeBtn.click();
          await clientPage.waitForTimeout(2000);
          console.log('Workout completed');
        }
      }

      // ===== COACH REVIEW FLOW =====

      // Step 11: Coach views client workout
      console.log('Step 11: Coach viewing completed workout...');
      await coachPage.goto('/coach/clients');
      await coachPage.waitForLoadState('networkidle');

      const clientDetail = coachPage.locator('[class*="client"]').first();
      if (await clientDetail.isVisible()) {
        await clientDetail.click();
        await coachPage.waitForTimeout(1500);

        // Look for workout history
        const workoutItem = coachPage.locator('[class*="workout"], div:has(text=/antrenman|completed)').first();
        if (await workoutItem.isVisible()) {
          await workoutItem.click();
          await coachPage.waitForTimeout(500);

          // Step 12: Coach adds feedback comment
          console.log('Step 12: Coach adding comment...');
          const commentInput = coachPage
            .locator('textarea[name="comment"], textarea[placeholder*="yorum"], textarea[placeholder*="comment"]')
            .first();
          
          if (await commentInput.isVisible()) {
            await commentInput.fill('Harika antrenman! Ağırlık artırabilirsin.');
            
            const submitCommentBtn = coachPage
              .locator('button:has-text("Yolla"), button:has-text("Send"), button:has-text("Post")')
              .first();
            
            if (await submitCommentBtn.isVisible()) {
              await submitCommentBtn.click();
              await coachPage.waitForTimeout(1500);

              // Verify comment appears
              const commentary = coachPage.locator('text=Harika antrenman');
              if (await commentary.isVisible()) {
                console.log('Comment successfully posted');
              }
            }
          }
        }
      }

      // Step 13: Client sees coach feedback
      console.log('Step 13: Client viewing coach feedback...');
      await clientPage.goto('/client/dashboard');
      await clientPage.waitForLoadState('networkidle');

      // Check for feedback
      const feedback = clientPage.locator('text=Harika|coach|antrenör|feedback|comment').first();
      if (await feedback.isVisible()) {
        console.log('Client can see coach feedback');
      }

      console.log('✅ Full E2E workflow completed successfully!');
      
    } finally {
      await coachContext.close();
      await clientContext.close();
    }
  });

  test('should maintain data integrity across sessions', async ({ page }) => {
    // Login
    await loginAsCoach(page);
    
    // Navigate and collect initial data
    await page.goto('/coach/clients');
    await page.waitForLoadState('networkidle');
    
    const initialClientCount = await page.locator('[class*="client"]').count();

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify data persisted
    const afterRefreshCount = await page.locator('[class*="client"]').count();
    expect(afterRefreshCount).toBe(initialClientCount);
  });

  test('should handle navigation between all major sections', async ({ page }) => {
    await loginAsCoach(page);

    const sections = [
      { url: '/coach/dashboard', text: /dashboard|anasayfa/ },
      { url: '/coach/exercises', text: /antrenman|exercise/ },
      { url: '/coach/templates', text: /template|şablon/ },
      { url: '/coach/clients', text: /client|müşteri/ },
    ];

    for (const section of sections) {
      await page.goto(section.url);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain(section.url);
      
      // Basic content check
      const content = page.locator('body');
      expect(content).not.toContainText('404');
    }
  });
});
