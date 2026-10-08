import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { defineConfig } from '@playwright/test'

function freePort() {
    return new Promise((resolve, reject) => {
        const server = createServer()

        server.unref()
        server.on('error', reject)
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address()

            server.close(() => resolve(port))
        })
    })
}

process.env.KS_E2E_PORT ??= String(await freePort())

const localChromium = join(homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell')
const executablePath = process.env.KS_CHROMIUM_PATH || (existsSync(localChromium) ? localChromium : undefined)
const baseURL = `http://127.0.0.1:${process.env.KS_E2E_PORT}`

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: '*.spec.mjs',
    outputDir: './test-results',
    fullyParallel: true,
    workers: process.env.CI ? 2 : 4,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    use: {
        baseURL,
        trace: 'retain-on-failure',
        launchOptions: { executablePath },
    },
    projects: [{ name: 'chromium', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } }],
    webServer: {
        command: `vendor/bin/testbench workbench:build --ansi && vendor/bin/testbench serve --host=127.0.0.1 --port=${process.env.KS_E2E_PORT} --no-reload`,
        url: `${baseURL}/admin`,
        timeout: 120_000,
        reuseExistingServer: false,
        env: { PHP_CLI_SERVER_WORKERS: '4' },
        stdout: 'ignore',
        stderr: 'pipe',
    },
})
