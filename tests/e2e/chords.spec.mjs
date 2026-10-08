import { expect, test } from '@playwright/test'
import { visit } from './helpers.mjs'

const pill = (page) => page.locator('[data-ks-pill]')
const hints = (page) => page.locator('.ks-hint:visible')

test('g then a letter navigates with SPA mode, without a full reload', async ({ page }) => {
    await visit(page, '/admin/customers')
    await page.evaluate(() => (window.__ksMarker = true))

    await page.keyboard.press('g')
    await expect(pill(page)).toBeVisible()
    await expect(pill(page)).toContainText('then a letter')

    await page.keyboard.press('o')

    await expect(page).toHaveURL(/\/admin\/orders$/)
    await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible()
    expect(await page.evaluate(() => window.__ksMarker)).toBe(true)

    await page.keyboard.press('g')
    await page.keyboard.press('c')
    await expect(page).toHaveURL(/\/admin\/customers$/)
})

test('a resource can pin its own letter', async ({ page }) => {
    await visit(page, '/admin?big=1')

    await expect(page.locator('a.fi-sidebar-item-btn[href$="/admin/customers"]')).toHaveAttribute('aria-description', 'Shortcut: G then C')
})

test('g shows a hint badge next to every navigation item until the chord ends', async ({ page }) => {
    await visit(page, '/admin/customers')

    await page.keyboard.press('g')
    await expect(hints(page)).toHaveCount(5)
    await expect(page.locator('.ks-hint[data-ks-hint="o"]')).toBeVisible()

    const badge = await page.locator('.ks-hint[data-ks-hint="o"]').boundingBox()
    const link = await page.locator('a.fi-sidebar-item-btn[href$="/admin/orders"]').boundingBox()
    expect(badge.y).toBeGreaterThanOrEqual(link.y)
    expect(badge.y + badge.height).toBeLessThanOrEqual(link.y + link.height)
    expect(badge.x + badge.width).toBeLessThanOrEqual(link.x + link.width)

    await page.keyboard.press('Escape')
    await expect(hints(page)).toHaveCount(0)
    await expect(pill(page)).toBeHidden()
})

test('the chord times out after 1.2 seconds', async ({ page }) => {
    await visit(page, '/admin/customers')

    await page.keyboard.press('g')
    await expect(pill(page)).toBeVisible()
    await page.waitForTimeout(1400)

    await expect(pill(page)).toBeHidden()
    await expect(hints(page)).toHaveCount(0)
    await page.keyboard.press('o')
    await expect(page).toHaveURL(/\/admin\/customers$/)
})

test('hints sit beside icons when the sidebar is collapsed', async ({ page }) => {
    await visit(page, '/admin/customers')
    await page.evaluate(() => window.Alpine.store('sidebar').close())
    await page.waitForTimeout(300)

    await page.keyboard.press('g')

    const badge = await page.locator('.ks-hint[data-ks-hint="c"]').boundingBox()
    const link = await page.locator('a.fi-sidebar-item-btn[href$="/admin/customers"]').boundingBox()

    await expect(page.locator('.ks-hint[data-ks-hint="c"]')).toHaveAttribute('data-ks-outside', '')
    expect(badge.x).toBeGreaterThanOrEqual(link.x + link.width)
})

test('two-letter chords on panels with more items than letters', async ({ page }) => {
    await visit(page, '/admin/customers?big=1')

    const pair = await page.evaluate(() => {
        const config = JSON.parse(document.querySelector('[data-ks-config]').textContent)

        return config.chords.items.find((item) => item.letter.length === 2)
    })

    expect(pair).toBeTruthy()
    expect(pair.letter).toMatch(/^[a-z]{2}$/)

    await page.keyboard.press('g')
    await page.keyboard.press(pair.letter[0])
    await expect(page.locator(`.ks-hint[data-ks-hint="${pair.letter}"]`)).toBeAttached()
    await expect(pill(page).locator('kbd')).toHaveCount(2)
    await page.keyboard.press(pair.letter[1])

    await expect(page).toHaveURL(new RegExp(`queue=${pair.label[0].toLowerCase()}$`))
})

test('sidebar links describe their chord', async ({ page }) => {
    await visit(page, '/admin/customers')

    await expect(page.locator('a.fi-sidebar-item-btn[href$="/admin/orders"]')).toHaveAttribute('aria-description', 'Shortcut: G then O')
})

test('navigation hints can be turned off', async ({ page }) => {
    await visit(page, '/admin/customers?hints=0')

    await page.keyboard.press('g')
    await expect(pill(page)).toBeVisible()
    await expect(page.locator('.ks-hint')).toHaveCount(0)
    await expect(page.locator('a.fi-sidebar-item-btn[href$="/admin/orders"]')).not.toHaveAttribute('aria-description', /.+/)
})

test('typing in an input never triggers shortcuts', async ({ page }) => {
    await visit(page, '/admin/customers')
    const search = page.locator('.fi-ta').getByPlaceholder('Search', { exact: true })

    await search.click()
    await page.keyboard.type('gjk?')

    await expect(search).toHaveValue('gjk?')
    await expect(pill(page)).toBeHidden()
    await expect(page.locator('[data-ks-sheet]')).toBeHidden()
    await expect(page.locator('[data-ks-active]')).toHaveCount(0)
})
