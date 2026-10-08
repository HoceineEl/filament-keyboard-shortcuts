import { expect } from '@playwright/test'

export async function visit(page, path) {
    await page.goto(path)
    await page.waitForFunction(() => window.Livewire && document.querySelector('[data-ks-root]') && window.__keyboardShortcuts)
}

export const sheet = (page) => page.locator('[data-ks-sheet]')

export async function openSheet(page) {
    await page.keyboard.press('Shift+?')
    await expect(sheet(page)).toHaveAttribute('data-ks-state', 'open')
}

export const activeRowKey = (page) => page.evaluate(() => document.querySelector('[data-ks-active]')?.getAttribute('wire:key') ?? null)

export const searchField = (page) => page.getByRole('searchbox', { name: 'Search shortcuts' })
