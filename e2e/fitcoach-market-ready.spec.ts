import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const COACH = { email: "demo.coach@fitcoach.dev", password: "123456" };
const CLIENT = { email: "demo.client.aylin@fitcoach.dev", password: "123456" };

test.skip(process.env.FITCOACH_DEMO_SMOKE !== "1", "Run with npm run test:e2e:demo");
test.describe.configure({ mode: "serial" });

async function login(page: Page, credentials: typeof COACH, expectedPath: RegExp) {
  await page.goto("/login");
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(expectedPath, { timeout: 15000 });
  await expect(page.locator("body")).not.toContainText(/404|Application error|Unhandled Runtime Error/i);
}

async function expectPageHealthy(page: Page) {
  await expect(page.locator("body")).not.toContainText(/404|Application error|Unhandled Runtime Error/i);
}

test.describe("FitCoach market-ready demo smoke", () => {
  test("coach can see the SaaS operating system flow", async ({ page }) => {
    await login(page, COACH, /\/coach\/dashboard/);
    await expect(page.getByText("Ece Arslan")).toBeVisible();
    await expect(page.getByText(/Aktif Abone|Bekleyen|Danışan|DanÄ±ÅŸan/i).first()).toBeVisible();

    await page.goto("/coach/profile");
    await expectPageHealthy(page);
    await expect(page.getByText(/Marketplace Vitrin Skoru/i)).toBeVisible();
    await expect(page.getByText("Online Dönüşüm Koçluğu")).toBeVisible();
    await expect(page.getByText("Premium Performans Paketi")).toBeVisible();

    await page.goto("/coach/templates");
    await expectPageHealthy(page);
    await expect(page.getByText("12 Hafta Dönüşüm - Full Body A")).toBeVisible();
    await expect(page.getByText("Premium Performans - Üst Vücut Güç")).toBeVisible();

    await page.goto("/coach/clients");
    await expectPageHealthy(page);
    await expect(page.getByText("Aylin Demir")).toBeVisible();
    await expect(page.getByText("Mert Kaya")).toBeVisible();
    await expect(page.getByText("Bekleyen")).toBeVisible();

    await page.goto("/coach/billing");
    await expectPageHealthy(page);
    await expect(page.getByText("Koç SaaS Planları")).toBeVisible();
    await expect(page.getByText("Elite").first()).toBeVisible();
  });

  test("client can discover and compare marketplace coaches", async ({ page }) => {
    await login(page, CLIENT, /\/client\/dashboard/);
    await expect(page.getByText(/Aylin Demir|Antrenman|Koç|Coach/i).first()).toBeVisible();

    await page.goto("/client/coaches");
    await expectPageHealthy(page);
    await expect(page.getByText("Ece Arslan")).toBeVisible();
    await expect(page.getByText("Baran Özkan")).toBeVisible();
    await expect(page.getByText(/Vitrin|Online Dönüşüm|Uygun Başlangıç/i).first()).toBeVisible();

    await page.getByText("Ece Arslan").first().click();
    await page.waitForURL(/\/client\/coaches\/.+/, { timeout: 10000 });
    await expectPageHealthy(page);
    await expect(page.getByText("Online Dönüşüm Koçluğu")).toBeVisible();
    await expect(page.getByText(/İlk kez bu kadar takipli hissettim|Performans odaklı/i).first()).toBeVisible();
  });
});
