import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { openSheet, searchField, visit } from './helpers.mjs'

const directory = process.env.KS_SCREENSHOTS_DIR || fileURLToPath(new URL('../../docs/images', import.meta.url))

test.skip(!process.env.KS_SCREENSHOTS, 'Set KS_SCREENSHOTS=1 to retake the README screenshots.')

test.use({ deviceScaleFactor: 2 })

const settle = (page, ms = 350) => page.waitForTimeout(ms)

const clipAround = async (page, locator, padding = 24) => {
    const box = await locator.boundingBox()
    const viewport = page.viewportSize()
    const x = Math.max(0, box.x - padding)
    const y = Math.max(0, box.y - padding)

    return {
        x,
        y,
        width: Math.min(viewport.width - x, box.width + padding * 2),
        height: Math.min(viewport.height - y, box.height + padding * 2),
    }
}

const shoot = (page, name, clip = null) => page.screenshot({ path: `${directory}/${name}.png`, ...(clip ? { clip } : {}) })

const useDark = (page) => page.addInitScript(() => window.localStorage.setItem('theme', 'dark'))

const useWindows = (page) =>
    page.addInitScript(() => {
        Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => undefined })
        Object.defineProperty(Navigator.prototype, 'platform', { get: () => 'Win32' })
    })

const dialog = (page) => page.locator('.ks-dialog')

const showSheet = async (page, path) => {
    await page.setViewportSize({ width: 1280, height: 960 })
    await visit(page, path)
    await openSheet(page)
    await settle(page)
}

const between = async (page, top, bottom, padding = 16) => {
    const start = await top.boundingBox()
    const end = await bottom.boundingBox()

    return { x: start.x - padding, y: start.y - padding, width: start.width + padding * 2, height: end.y + end.height - start.y + padding * 2 }
}

const sectionClip = (page, id) => {
    const section = page.locator(`[data-ks-section="${id}"]`)

    return between(page, section, section.locator('[data-ks-row]:visible').last())
}

const holdChords = (page) =>
    page.evaluate(() => {
        const original = window.setTimeout

        window.setTimeout = (callback, delay, ...rest) => (delay === 1200 ? 0 : original(callback, delay, ...rest))
    })

const pressPrefix = async (page) => {
    await holdChords(page)
    await page.mouse.move(640, 790)
    await page.keyboard.press('g')
    await expect(page.locator('[data-ks-pill]')).toHaveAttribute('data-ks-state', 'open')
    await settle(page, 200)
}

test('sheet', async ({ page }) => {
    await showSheet(page, '/admin/customers')
    await shoot(page, 'sheet')
})

test('sheet dark', async ({ page }) => {
    await useDark(page)
    await showSheet(page, '/admin/customers')
    await shoot(page, 'sheet-dark', await clipAround(page, dialog(page), 32))
})

test('sheet search', async ({ page }) => {
    await showSheet(page, '/admin/customers')
    await searchField(page).fill('customers')
    await settle(page)
    const box = await dialog(page).boundingBox()
    const bottom = await page.evaluate(() => Math.max(...[...document.querySelectorAll('[data-ks-row]')].filter((row) => row.getClientRects().length > 0).map((row) => row.getBoundingClientRect().bottom)))
    await shoot(page, 'sheet-search', { x: box.x - 24, y: box.y - 24, width: box.width + 48, height: bottom - box.y + 56 })
})

test('page actions', async ({ page }) => {
    await showSheet(page, '/admin/customers')
    await shoot(page, 'page-actions', await sectionClip(page, 'page-actions'))
})

test('platform key labels', async ({ page }) => {
    await showSheet(page, '/admin/customers')
    await shoot(page, 'keys-mac', await sectionClip(page, 'general'))
})

test('platform key labels on Windows and Linux', async ({ page }) => {
    await useWindows(page)
    await showSheet(page, '/admin/customers')
    await shoot(page, 'keys-windows', await sectionClip(page, 'general'))
})

test('hint mode', async ({ page }) => {
    await visit(page, '/admin/orders')
    await pressPrefix(page)
    await shoot(page, 'hints')
})

test('two-letter hints', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await visit(page, '/admin/orders?big=1')
    await page.locator('.fi-sidebar-nav').evaluate((nav) => nav.scrollTo({ top: nav.scrollHeight }))
    await settle(page)
    await pressPrefix(page)
    const sidebar = await page.locator('.fi-sidebar').boundingBox()
    await shoot(page, 'hints-two-letter', { x: 0, y: 0, width: sidebar.width + 8, height: 720 })
})

test('collapsed sidebar hints', async ({ page }) => {
    await useDark(page)
    await visit(page, '/admin/orders')
    await page.evaluate(() => window.Alpine.store('sidebar').close())
    await settle(page, 400)
    await pressPrefix(page)
    await shoot(page, 'hints-collapsed-dark', { x: 0, y: 0, width: 360, height: 420 })
})

test('table navigation', async ({ page }) => {
    await visit(page, '/admin/customers')
    await page.mouse.move(0, 0)

    for (let step = 0; step < 3; step++) {
        await page.keyboard.press('j')
    }

    await expect(page.locator('[data-ks-active]')).toHaveCount(1)
    await settle(page)
    await shoot(page, 'table', await between(page, page.locator('.fi-ta-ctn'), page.locator('tr.fi-ta-row').nth(5)))
})

test('button beside topbar search', async ({ page }) => {
    await visit(page, '/admin/customers')
    await page.locator('[data-ks-open]').hover()
    await settle(page, 500)
    const search = await page.locator('.fi-topbar .fi-global-search-ctn').boundingBox()
    const viewport = page.viewportSize()
    const x = Math.max(0, search.x - 260)

    await shoot(page, 'button-topbar', { x, y: 0, width: viewport.width - x, height: search.y + search.height + 56 })
})

test('button in sidebar search', async ({ page }) => {
    await visit(page, '/admin/customers?topbar=0')
    await page.mouse.move(640, 790)
    const sidebar = await page.locator('.fi-sidebar').boundingBox()
    const search = await page.locator('.fi-sidebar .fi-global-search-ctn').boundingBox()

    await shoot(page, 'button-sidebar', { x: 0, y: 0, width: sidebar.width + 8, height: search.y + search.height + 120 })
})

test('arabic right to left', async ({ page }) => {
    await showSheet(page, '/admin/customers?locale=ar')
    await shoot(page, 'sheet-rtl', await clipAround(page, dialog(page), 32))
})

test('hebrew hint mode', async ({ page }) => {
    await visit(page, '/admin/orders?locale=he')
    await pressPrefix(page)
    await shoot(page, 'hints-rtl')
})

test('german on Windows', async ({ page }) => {
    await useWindows(page)
    await showSheet(page, '/admin/customers?locale=de')
    await shoot(page, 'sheet-de', await clipAround(page, dialog(page), 32))
})

test('japanese', async ({ page }) => {
    await showSheet(page, '/admin/customers?locale=ja')
    await shoot(page, 'sheet-ja', await clipAround(page, dialog(page), 32))
})
