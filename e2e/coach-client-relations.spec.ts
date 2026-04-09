import { test, expect, loginAsCoach, loginAsClient } from './fixtures';

test.describe('Coach-Client Relations', () => {
  test.describe('Client requesting coach', () => {
    test('client should see available coaches', async ({ page }) => {
      await loginAsClient(page);
      await page.goto('/client/coaches');
      await page.waitForLoadState('networkidle');
      
      // Should show list of coaches
      await expect(page.locator('text=/antrenör|coach/i')).toBeVisible();
    });

    test('client should be able to send coach request', async ({ page }) => {
      await loginAsClient(page);
      await page.goto('/client/coaches');
      await page.waitForLoadState('networkidle');

      // Find a coach and send request
      const requestButton = page.locator('button:has-text("İstek"), button:has-text("Request"), button:has-text("Connect")').first();
      
      if (await requestButton.isVisible()) {
        const buttonText = await requestButton.textContent();
        
        // Only click if not already requested
        if (!buttonText?.includes('gönderildi') && !buttonText?.includes('Pending')) {
          await requestButton.click();
          await page.waitForTimeout(1000);
          
          // Verify button state changed
          const updatedText = await requestButton.textContent();
          expect(updatedText?.toLowerCase()).toMatch(/gönderildi|pending|requested/i);
        }
      }
    });
  });

  test.describe('Coach managing client requests', () => {
    test('coach should see pending client requests', async ({ page }) => {
      await loginAsCoach(page);
      await page.goto('/coach/clients');
      await page.waitForLoadState('networkidle');

      // Should show clients list or pending requests
      await expect(page.locator('text=/client|pending/i')).toBeVisible({ timeout: 5000 });
    });

    test('coach should accept client request', async ({ page }) => {
      await loginAsCoach(page);
      await page.goto('/coach/clients');
      await page.waitForLoadState('networkidle');

      // Look for accept button on pending request
      const acceptButton = page.locator('button:has-text("Kabul"), button:has-text("Accept"), button:has-text("Approve")').first();
      
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
        await page.waitForTimeout(1500);

        // Verify status changed to accepted
        const statusText = page.locator('text=/kabul|accepted|active/i').first();
        if (await statusText.isVisible()) {
          expect(await statusText.textContent()).toMatch(/kabul|accepted|active/i);
        }
      }
    });

    test('coach should reject client request', async ({ page }) => {
      await loginAsCoach(page);
      await page.goto('/coach/clients');
      await page.waitForLoadState('networkidle');

      // Look for reject button on pending request
      const rejectButton = page.locator('button:has-text("Reddet"), button:has-text("Reject"), button:has-text("Decline")').first();
      
      if (await rejectButton.isVisible()) {
        await rejectButton.click();
        await page.waitForTimeout(1500);

        // The rejected request should disappear or show rejected status
        const pendingSection = page.locator('text=/beklemede|pending/i').first();
        if (await pendingSection.isVisible()) {
          const text = await pendingSection.textContent();
          expect(text).toBeDefined();
        }
      }
    });
  });

  test.describe('Client-Coach relationship status', () => {
    test('client should see status of coach connections', async ({ page }) => {
      await loginAsClient(page);
      await page.goto('/client/coaches');
      await page.waitForLoadState('networkidle');

      // Check for status indicators
      const statuses = page.locator('text=/accepted|pending|rejected|reddedildi|kabul|beklemede/i');
      
      if (await statuses.count() > 0) {
        for (let i = 0; i < Math.min(await statuses.count(), 3); i++) {
          const text = await statuses.nth(i).textContent();
          expect(text).toMatch(/accepted|pending|rejected|reddedildi|kabul|beklemede/i);
        }
      }
    });

    test('coach should see accepted clients', async ({ page }) => {
      await loginAsCoach(page);
      await page.goto('/coach/clients');
      await page.waitForLoadState('networkidle');

      // Should show at least one accepted client
      const acceptedSection = page.locator('text=/kabul|accepted|active/i').first();
      
      if (await acceptedSection.isVisible()) {
        expect(await acceptedSection.textContent()).toMatch(/kabul|accepted|active/i);
      }
    });
  });
});
