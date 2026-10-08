import { expect, test } from '@playwright/test'
import { openSheet, searchField, sheet, visit } from './helpers.mjs'

test.beforeEach(async ({ page }) => visit(page, '/admin/customers'))

test('? opens the sheet with focus in the search field', async ({ page }) => {
    await openSheet(page)

    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible()
    await expect(searchField(page)).toBeFocused()
    await expect(page.locator('[data-ks-section="navigation"]')).toContainText('Customers')
    await expect(page.locator('[data-ks-section="table"]')).toBeVisible()
})

test('lists page actions discovered from ->keyBindings()', async ({ page }) => {
    await openSheet(page)

    const row = page.locator('[data-ks-section="page-actions"] [data-ks-row]', { hasText: 'Export customers' })

    await expect(row).toBeVisible()
    await expect(row.locator('kbd')).toHaveCount(3)
})

test('search filters rows, shows the empty state and clears', async ({ page }) => {
    await openSheet(page)

    await page.keyboard.type('next row')
    await expect(page.locator('[data-ks-row]:visible')).toHaveCount(1)
    await expect(page.locator('[data-ks-row]:visible')).toContainText('Next row')

    await searchField(page).fill('zzzz')
    await expect(page.locator('[data-ks-empty]')).toBeVisible()
    await expect(page.locator('[data-ks-empty-text]')).toHaveText('No shortcuts match “zzzz”')

    await page.locator('[data-ks-clear]').click()
    await expect(page.locator('[data-ks-empty]')).toBeHidden()
    await expect(searchField(page)).toBeFocused()
    await expect(page.locator('[data-ks-section="general"]')).toBeVisible()
})

test('search understands key aliases', async ({ page }) => {
    await openSheet(page)

    await page.keyboard.type('shift+x')

    await expect(page.locator('[data-ks-row]:visible')).toHaveCount(1)
    await expect(page.locator('[data-ks-row]:visible')).toContainText('Select all on page')
})

test('traps focus inside the dialog', async ({ page }) => {
    await openSheet(page)

    for (let index = 0; index < 4; index++) {
        await page.keyboard.press('Tab')
        expect(await page.evaluate(() => document.activeElement.closest('[data-ks-dialog]') !== null)).toBe(true)
    }

    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Shift+Tab')
    expect(await page.evaluate(() => document.activeElement.closest('[data-ks-dialog]') !== null)).toBe(true)
})

test('Esc clears the search first, then closes and returns focus', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: 'Export customers' })
    await exportButton.focus()

    await openSheet(page)
    await page.keyboard.type('row')

    await page.keyboard.press('Escape')
    await expect(searchField(page)).toHaveValue('')
    await expect(sheet(page)).toHaveAttribute('data-ks-state', 'open')

    await page.keyboard.press('Escape')
    await expect(sheet(page)).toBeHidden()
    await expect(exportButton).toBeFocused()
})

test('the scrim and close button close the sheet', async ({ page }) => {
    await openSheet(page)
    await page.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(sheet(page)).toBeHidden()

    await openSheet(page)
    await page.mouse.click(10, 10)
    await expect(sheet(page)).toBeHidden()
})

test('the button sits beside the global search and opens the sheet', async ({ page }) => {
    await expect(page.locator('[data-ks-open]')).toHaveCount(1)
    await expect(page.locator('.fi-global-search-ctn > [data-ks-open]')).toBeVisible()

    await page.locator('[data-ks-open]').click()

    await expect(sheet(page)).toHaveAttribute('data-ks-state', 'open')
})

test('mod+/ opens the sheet from inside a text field', async ({ page }) => {
    await page.locator('.fi-ta').getByPlaceholder('Search', { exact: true }).focus()
    await page.keyboard.press('ControlOrMeta+/')

    await expect(sheet(page)).toHaveAttribute('data-ks-state', 'open')
})

test('Filament key bindings keep working while the sheet is closed, and pause while it is open', async ({ page }) => {
    await page.keyboard.press('ControlOrMeta+Shift+E')
    await expect(page.getByText('Export started')).toBeVisible()

    await openSheet(page)
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toHaveAttribute('aria-modal', 'true')

    await page.keyboard.press('Escape')
    await expect(page.locator('[data-ks-dialog]')).not.toHaveAttribute('aria-modal', /.*/)
})
