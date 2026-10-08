import { expect, test } from '@playwright/test'
import { openSheet, visit } from './helpers.mjs'

test.describe('Arabic, right to left', () => {
    test('mirrors the sheet and keeps hints at the inline end', async ({ page }) => {
        await visit(page, '/admin/customers?locale=ar')

        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

        await openSheet(page)
        await expect(page.getByRole('dialog', { name: 'اختصارات لوحة المفاتيح' })).toBeVisible()

        const title = await page.locator('#ks-title').boundingBox()
        const close = await page.locator('.ks-close').boundingBox()
        expect(close.x).toBeLessThan(title.x)

        await page.keyboard.press('Escape')
        await page.keyboard.press('g')
        await expect(page.locator('[data-ks-pill]')).toContainText('ثم اضغط حرفًا')

        const badge = await page.locator('.ks-hint[data-ks-hint="c"]').boundingBox()
        const link = await page.locator('a.fi-sidebar-item-btn[href$="/admin/customers"]').boundingBox()
        expect(badge.x).toBeGreaterThanOrEqual(link.x)
        expect(badge.x).toBeLessThan(link.x + link.width / 2)
    })
})

test.describe('Hebrew and Persian, right to left', () => {
    for (const [locale, title, then] of [
        ['he', 'קיצורי מקלדת', 'ואז'],
        ['fa', 'میان‌برهای صفحه‌کلید', 'سپس'],
    ]) {
        test(`${locale} mirrors the sheet and keeps combos left to right`, async ({ page }) => {
            await visit(page, `/admin/customers?locale=${locale}`)

            await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

            await openSheet(page)
            await expect(page.getByRole('dialog', { name: title })).toBeVisible()

            const heading = await page.locator('#ks-title').boundingBox()
            const close = await page.locator('.ks-close').boundingBox()
            expect(close.x).toBeLessThan(heading.x)

            await expect(page.locator('.ks-then', { hasText: then }).first()).toBeVisible()

            const combo = page.locator('.ks-combo').filter({ has: page.locator('[data-ks-key="mod"]') }).first()
            await expect(combo).toHaveCSS('direction', 'ltr')

            const modifier = await combo.locator('.ks-kbd').first().boundingBox()
            const key = await combo.locator('.ks-kbd').last().boundingBox()
            expect(modifier.x).toBeLessThan(key.x)
        })
    }
})

test.describe('dark mode', () => {
    test.use({ colorScheme: 'dark' })

    test('uses dark surfaces', async ({ page }) => {
        await visit(page, '/admin/customers')
        await expect(page.locator('html')).toHaveClass(/dark/)

        await openSheet(page)

        const background = await page.locator('.ks-dialog').evaluate((node) => getComputedStyle(node).backgroundColor)
        expect(background).not.toBe('rgb(255, 255, 255)')

        await page.keyboard.press('Escape')
        await page.keyboard.press('j')
        const shadow = await page.locator('[data-ks-active]').evaluate((node) => getComputedStyle(node).boxShadow)
        expect(shadow).toContain('inset')
    })
})

test.describe('375px mobile', () => {
    test.use({ viewport: { width: 375, height: 740 }, hasTouch: true })

    test('fits the screen in one column without horizontal scroll', async ({ page }) => {
        await visit(page, '/admin/customers')

        await expect(page.locator('[data-ks-open]')).toBeHidden()

        await openSheet(page)

        const dialog = await page.locator('.ks-dialog').boundingBox()
        expect(dialog.x).toBeGreaterThanOrEqual(0)
        expect(dialog.x + dialog.width).toBeLessThanOrEqual(375)
        expect(await page.locator('.ks-body').evaluate((node) => getComputedStyle(node).columnCount)).toBe('1')
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)

        const close = await page.locator('.ks-close').boundingBox()
        expect(close.width).toBeGreaterThanOrEqual(44)
        expect(close.height).toBeGreaterThanOrEqual(44)
    })
})

test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' })

    test('only fades', async ({ page }) => {
        await visit(page, '/admin/customers')
        await openSheet(page)

        const dialog = await page.locator('.ks-dialog').evaluate((node) => {
            const style = getComputedStyle(node)

            return { transform: style.transform, property: style.transitionProperty, duration: style.transitionDuration }
        })

        expect(dialog.transform).toBe('none')
        expect(dialog.property).toBe('opacity')
        expect(parseFloat(dialog.duration)).toBeLessThanOrEqual(0.1)

        await page.keyboard.press('Escape')
        await page.keyboard.press('g')
        const hint = await page.locator('.ks-hints').evaluate((node) => getComputedStyle(node).transitionDuration)
        expect(parseFloat(hint)).toBeLessThanOrEqual(0.1)
    })
})
