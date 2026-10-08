import { expect, test } from '@playwright/test'
import { activeRowKey, visit } from './helpers.mjs'

test.beforeEach(async ({ page }) => visit(page, '/admin/customers'))

const rowKeys = (page) => page.evaluate(() => [...document.querySelectorAll('tr.fi-ta-row')].map((row) => row.getAttribute('wire:key')))

test('j and k move the active row', async ({ page }) => {
    const keys = await rowKeys(page)

    await page.keyboard.press('j')
    expect(await activeRowKey(page)).toBe(keys[0])

    await page.keyboard.press('j')
    await page.keyboard.press('j')
    expect(await activeRowKey(page)).toBe(keys[2])

    await page.keyboard.press('k')
    expect(await activeRowKey(page)).toBe(keys[1])
})

test('x selects the active row and shift+x the whole page', async ({ page }) => {
    await page.keyboard.press('j')
    await page.keyboard.press('x')

    await expect(page.locator('[data-ks-active] .fi-ta-record-checkbox')).toBeChecked()

    await page.keyboard.press('Shift+X')
    await expect(page.locator('.fi-ta-record-checkbox:not(:checked)')).toHaveCount(0)
})

test('] and [ change pages and the active row survives re-renders', async ({ page }) => {
    await expect(page.getByText('customer1@example.com', { exact: true })).toBeVisible()

    await page.keyboard.press(']')
    await expect(page.getByText('customer11@example.com', { exact: true })).toBeVisible()

    await page.keyboard.press('[')
    await expect(page.getByText('customer1@example.com', { exact: true })).toBeVisible()
})

test('f opens the filters', async ({ page }) => {
    await page.keyboard.press('f')

    await expect(page.locator('.fi-ta-filters-dropdown .fi-dropdown-panel')).toBeVisible()
})

test('Enter opens the active row', async ({ page }) => {
    await page.keyboard.press('j')
    await page.keyboard.press('j')
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/admin\/customers\/2\/edit$/)
})

test('the active row keeps its highlight after a Livewire update', async ({ page }) => {
    await page.keyboard.press('j')
    await page.keyboard.press('j')
    const key = await activeRowKey(page)

    await page.keyboard.press('x')
    await page.waitForTimeout(500)

    expect(await activeRowKey(page)).toBe(key)
})
