import { test as base, expect } from '@playwright/test';

export const test = base.extend({});

export { expect };

/**
 * Test fixtures and utilities for FitCoach E2E tests
 */

export const COACH_CREDENTIALS = {
  email: 'coach@fitcoach.dev',
  password: '123456',
};

export const CLIENT_CREDENTIALS = {
  email: 'client@fitcoach.dev',
  password: '123456',
};

export const NEW_COACH_CREDENTIALS = {
  name: 'New Coach',
  email: 'newcoach@fitcoach.dev',
  password: 'password123456',
};

export const NEW_CLIENT_CREDENTIALS = {
  name: 'New Client',
  email: 'newclient@fitcoach.dev',
  password: 'password123456',
};

/**
 * Login helper function
 */
export async function loginAsCoach(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', COACH_CREDENTIALS.email);
  await page.fill('input[type="password"]', COACH_CREDENTIALS.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(coach|client)\/dashboard/, { timeout: 10000 });
}

export async function loginAsClient(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', CLIENT_CREDENTIALS.email);
  await page.fill('input[type="password"]', CLIENT_CREDENTIALS.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(coach|client)\/dashboard/, { timeout: 10000 });
}

/**
 * Register helper function
 */
export async function registerAsCoach(page: any, credentials = NEW_COACH_CREDENTIALS) {
  await page.goto('/register');
  await page.fill('input[name="name"]', credentials.name);
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.selectOption('select', 'COACH');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(coach|client)\/dashboard/, { timeout: 10000 });
}

export async function registerAsClient(page: any, credentials = NEW_CLIENT_CREDENTIALS) {
  await page.goto('/register');
  await page.fill('input[name="name"]', credentials.name);
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.selectOption('select', 'CLIENT');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(coach|client)\/dashboard/, { timeout: 10000 });
}

/**
 * Logout helper
 */
export async function logout(page: any) {
  // Click on user menu or logout button
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/login');
}
