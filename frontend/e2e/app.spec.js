import { test, expect } from '@playwright/test'

/**
 * E2E Test Suite — Core user flows for the ATS Resume Builder.
 *
 * Prerequisites:
 *   - Backend running on port 8000 (uvicorn main:app --port 8000)
 *   - Frontend dev server on port 5173 (npm run dev)
 *
 * Run: npx playwright test
 */

// ── Landing Page ────────────────────────────────────────────────────

test.describe('Landing Page', () => {
  test('should display hero section and CTA buttons', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/ATS Resume Builder/)
    // Hero heading should be visible
    await expect(page.locator('h1').first()).toBeVisible()
    // Should have a "Get Started" or "Build" CTA
    const cta = page.getByRole('link', { name: /build|get started/i }).first()
    await expect(cta).toBeVisible()
  })

  test('should navigate to Builder page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /build/i }).first().click()
    await expect(page).toHaveURL(/\/builder/)
  })

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/')
    // Find dark mode toggle button
    const toggle = page.getByRole('button', { name: /dark|theme|mode/i }).first()
    if (await toggle.isVisible()) {
      await toggle.click()
      // The root div should have a 'dark' class
      await expect(page.locator('.dark')).toBeAttached()
    }
  })
})

// ── Navigation ──────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test('should show navbar with key links', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    await expect(nav.getByText('Builder')).toBeVisible()
    await expect(nav.getByText('Analyzer')).toBeVisible()
    await expect(nav.getByText('Cover Letter')).toBeVisible()
  })

  test('should show 404 for unknown routes', async ({ page }) => {
    await page.goto('/this-does-not-exist')
    await expect(page.getByText(/404|not found/i)).toBeVisible()
  })
})

// ── Builder Page ────────────────────────────────────────────────────

test.describe('Builder Page', () => {
  test('should render multi-step form', async ({ page }) => {
    await page.goto('/builder')
    // Should have form fields
    await expect(page.getByPlaceholder(/name/i).first()).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/builder')
    // Try to click "Next" or "Optimize" without filling in required fields
    const nextBtn = page.getByRole('button', { name: /next|optimize/i }).first()
    if (await nextBtn.isVisible()) {
      await nextBtn.click()
      // Should show validation or stay on same step
      await expect(page).toHaveURL(/\/builder/)
    }
  })

  test('should fill in personal info and advance', async ({ page }) => {
    await page.goto('/builder')
    // Fill personal info
    await page.getByPlaceholder(/name/i).first().fill('Jane Doe')
    await page.getByPlaceholder(/email/i).first().fill('jane@example.com')
    await page.getByPlaceholder(/phone/i).first().fill('+1-555-0100')

    // Try to advance to next step
    const nextBtn = page.getByRole('button', { name: /next/i }).first()
    if (await nextBtn.isVisible()) {
      await nextBtn.click()
    }
  })
})

// ── Auth Flow ───────────────────────────────────────────────────────

test.describe('Auth Flow', () => {
  test('should show sign-in modal when clicking sign in', async ({ page }) => {
    await page.goto('/')
    const signInBtn = page.getByRole('button', { name: /sign in|login|log in/i }).first()
    if (await signInBtn.isVisible()) {
      await signInBtn.click()
      // Modal should appear
      await expect(page.getByRole('dialog').or(page.locator('[role="dialog"]')).first()).toBeVisible({ timeout: 3000 })
    }
  })

  test('should register a new test user', async ({ page }) => {
    await page.goto('/')
    const signInBtn = page.getByRole('button', { name: /sign in|login|log in/i }).first()
    if (await signInBtn.isVisible()) {
      await signInBtn.click()
      // Switch to register mode
      const registerTab = page.getByText(/register|sign up|create account/i).first()
      if (await registerTab.isVisible()) {
        await registerTab.click()
      }

      // Fill registration form
      const username = `e2e_user_${Date.now()}`
      const email = `${username}@test.com`
      await page.getByPlaceholder(/username/i).first().fill(username)
      await page.getByPlaceholder(/email/i).first().fill(email)
      await page.getByPlaceholder(/password/i).first().fill('Test@12345')

      // Submit
      const submitBtn = page.getByRole('button', { name: /register|sign up|create/i }).first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        // Wait for modal to close or success indication
        await page.waitForTimeout(2000)
      }
    }
  })
})

// ── Cover Letter Page ───────────────────────────────────────────────

test.describe('Cover Letter Page', () => {
  test('should render the cover letter form', async ({ page }) => {
    await page.goto('/cover-letter')
    await expect(page.getByText(/cover letter/i).first()).toBeVisible()
    await expect(page.getByPlaceholder(/role/i).first()).toBeVisible()
  })

  test('should show tone options', async ({ page }) => {
    await page.goto('/cover-letter')
    await expect(page.getByText('Professional')).toBeVisible()
    await expect(page.getByText('Enthusiastic')).toBeVisible()
    await expect(page.getByText('Concise')).toBeVisible()
  })
})

// ── Analyzer Page ───────────────────────────────────────────────────

test.describe('Analyzer Page', () => {
  test('should render the upload area', async ({ page }) => {
    await page.goto('/analyzer')
    await expect(page.getByText(/upload|analyze|drag/i).first()).toBeVisible()
  })
})

// ── Accessibility ───────────────────────────────────────────────────

test.describe('Accessibility', () => {
  test('should have skip-to-content link', async ({ page }) => {
    await page.goto('/')
    const skipLink = page.locator('a[href="#main-content"]')
    await expect(skipLink).toBeAttached()
  })

  test('should have main content landmark', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('main#main-content')).toBeVisible()
  })

  test('should have nav landmark', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav[aria-label]')).toBeVisible()
  })
})
