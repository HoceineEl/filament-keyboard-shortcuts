import { makeConfig, mount, press, rootHtml, sidebarHtml, tableHtml } from './setup.js'
import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { setPlatform } from '../../resources/js/keys.js'

const calls = { navigate: [], dispatch: [], evaluate: [], open: [] }

window.Livewire = {
    navigate: (url) => calls.navigate.push(url),
    dispatch: (event, payload) => calls.dispatch.push([event, payload]),
    hook: () => {},
}
window.Alpine = { evaluate: (element, expression) => calls.evaluate.push(expression) }
window.open = (url, target) => calls.open.push([url, target])

await import('../../resources/js/index.js')

const sheet = () => document.querySelector('[data-ks-sheet]')
const isSheetOpen = () => !sheet().hidden && sheet().dataset.ksState !== 'leaving'
const activeRow = () => document.querySelector('[data-ks-active]')?.getAttribute('wire:key') ?? null
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

function boot(config = makeConfig(), ...extra) {
    mount(rootHtml(config), sidebarHtml(), ...extra)
    document.dispatchEvent(new Event('livewire:navigated'))
}

beforeEach(() => {
    setPlatform(false)
    Object.values(calls).forEach((list) => list.splice(0))
    boot()
})

test('? opens the sheet and consumes the key', () => {
    const event = press('?', { shiftKey: true, code: 'Slash' })

    assert.equal(isSheetOpen(), true)
    assert.equal(event.defaultPrevented, true)
})

test('mod+/ opens the sheet, even from a text field', () => {
    mount(rootHtml(), '<input id="name" />')
    document.dispatchEvent(new Event('livewire:navigated'))
    const input = document.getElementById('name')
    input.focus()

    press('/', { ctrlKey: true, code: 'Slash' }, input)

    assert.equal(isSheetOpen(), true)
})

test('ignores plain keys while typing in inputs, textareas, selects and contenteditable', () => {
    boot(makeConfig(), tableHtml(), '<input id="i" /><textarea id="t"></textarea><select id="s"><option>1</option></select><div id="c" contenteditable="true"></div>')

    for (const id of ['i', 't', 's', 'c']) {
        const field = document.getElementById(id)

        for (const key of ['?', 'g', 'j', '/']) {
            const event = press(key, {}, field)

            assert.equal(event.defaultPrevented, false, `${key} in #${id}`)
        }
    }

    assert.equal(isSheetOpen(), false)
    assert.equal(activeRow(), null)
})

test('does nothing while a Filament modal is open', () => {
    boot(makeConfig(), tableHtml(), '<div class="fi-modal fi-modal-open"></div>')

    press('?', { shiftKey: true, code: 'Slash' })
    press('j')
    press('g')

    assert.equal(isSheetOpen(), false)
    assert.equal(activeRow(), null)
    assert.equal(document.querySelector('[data-ks-pill]').hidden, true)
})

test('never intercepts reserved combinations', () => {
    boot(makeConfig({ shortcuts: [{ keys: ['mod+shift+f'], label: 'Clash', behavior: 'js', js: 'clash()' }] }))

    assert.equal(press('k', { ctrlKey: true }).defaultPrevented, false)
    assert.equal(press('f', { ctrlKey: true, shiftKey: true }).defaultPrevented, false)
    assert.deepEqual(calls.evaluate, [])
})

test('g then a letter navigates with Livewire in SPA mode', () => {
    press('g')
    assert.equal(document.querySelector('[data-ks-pill]').hidden, false)

    press('o')

    assert.deepEqual(calls.navigate, ['/admin/orders'])
})

test('g then a two-letter chord navigates', () => {
    press('g')
    press('c')
    assert.deepEqual(calls.navigate, [])

    press('u')
    assert.deepEqual(calls.navigate, ['/admin/customer-users'])
})

test('chords open new-tab items in a new tab', () => {
    press('g')
    press('d')
    press('s')

    assert.deepEqual(calls.open, [['https://filamentphp.com', '_blank']])
})

test('chords read the physical key on other keyboard layouts', () => {
    press('ل', { code: 'KeyG' })
    press('خ', { code: 'KeyO' })

    assert.deepEqual(calls.navigate, ['/admin/orders'])
})

test('escape cancels a pending chord', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    press('g')

    const event = press('Escape')
    t.mock.timers.tick(200)

    assert.equal(event.defaultPrevented, true)
    assert.equal(document.querySelector('[data-ks-pill]').hidden, true)

    press('o')
    assert.deepEqual(calls.navigate, [])
})

test('an unknown chord letter falls through to its own shortcut', () => {
    boot(makeConfig(), tableHtml())

    press('g')
    press('j')

    assert.deepEqual(calls.navigate, [])
    assert.equal(activeRow(), 'row-1')
})

test('table keys move, select and open rows', () => {
    boot(makeConfig(), tableHtml())

    press('j')
    press('j')
    assert.equal(activeRow(), 'row-2')

    press('k')
    assert.equal(activeRow(), 'row-1')

    press('x')
    assert.equal(document.querySelector('.fi-ta-record-checkbox[value="1"]').checked, true)

    press('X', { shiftKey: true })
    assert.equal(document.querySelector('.fi-ta-page-checkbox').checked, true)
})

test('table navigation can be turned off', () => {
    boot(makeConfig({ table: false }), tableHtml())

    assert.equal(press('j').defaultPrevented, false)
    assert.equal(activeRow(), null)
})

test('enter on a focused button is left alone', () => {
    boot(makeConfig(), tableHtml(), '<button id="b" type="button">Go</button>')
    press('j')
    const button = document.getElementById('b')
    button.focus()

    assert.equal(press('Enter', {}, button).defaultPrevented, false)
})

test('the page wins when it already binds a key', () => {
    boot(makeConfig(), tableHtml(), '<button id="jump" x-mousetrap.global.j="1">Jump</button>')

    assert.equal(press('j').defaultPrevented, false)
    assert.equal(activeRow(), null)
})

test('held keys do not repeat our shortcuts', () => {
    boot(makeConfig(), tableHtml())

    press('j', { repeat: true })

    assert.equal(activeRow(), null)
})

test('custom shortcuts dispatch, navigate and evaluate', () => {
    boot(makeConfig({
        shortcuts: [
            { keys: ['mod+shift+e'], behavior: 'dispatch', event: 'export-requested', payload: { format: 'csv' } },
            { keys: ['mod+b'], behavior: 'url', url: '/admin/docs', newTab: false },
            { keys: ['mod+alt+j'], behavior: 'js', js: '$store.sidebar.open()' },
        ],
    }))

    press('E', { ctrlKey: true, shiftKey: true })
    press('b', { ctrlKey: true })
    press('j', { ctrlKey: true, altKey: true })

    assert.deepEqual(calls.dispatch, [['export-requested', { format: 'csv' }]])
    assert.deepEqual(calls.navigate, ['/admin/docs'])
    assert.deepEqual(calls.evaluate, ['$store.sidebar.open()'])
})

test('/ focuses the table search', () => {
    boot(makeConfig(), tableHtml())

    const event = press('/', { code: 'Slash' })

    assert.equal(event.defaultPrevented, true)
    assert.equal(document.activeElement, document.querySelector('.fi-ta-search-field input'))
})

test('the sheet traps focus, clears search on Esc, then closes and returns focus', async () => {
    boot(makeConfig(), '<button id="origin" type="button">Origin</button>')
    const origin = document.getElementById('origin')
    origin.focus()

    press('?', { shiftKey: true, code: 'Slash' })
    await nextFrame()

    const search = document.querySelector('[data-ks-search]')
    assert.equal(document.activeElement, search)

    const close = document.querySelector('.ks-dialog [data-ks-close]')
    close.focus()
    assert.equal(press('Tab', { shiftKey: true }, close).defaultPrevented, true)
    assert.equal(document.activeElement, search)

    assert.equal(press('Tab', {}, search).defaultPrevented, true)
    assert.equal(document.activeElement, close)

    search.focus()

    search.value = 'zzz'
    search.dispatchEvent(new Event('input'))
    assert.equal(document.querySelector('[data-ks-empty]').hidden, false)
    assert.equal(document.querySelector('[data-ks-empty-text]').textContent, 'No shortcuts match “zzz”')

    press('Escape', {}, search)
    assert.equal(search.value, '')
    assert.equal(isSheetOpen(), true)

    press('Escape', {}, search)
    assert.equal(isSheetOpen(), false)
    assert.equal(document.activeElement, origin)
})

test('keys other than Esc and Tab are left to the sheet while it is open', () => {
    boot(makeConfig(), tableHtml())
    press('?', { shiftKey: true, code: 'Slash' })

    press('j')
    press('g')

    assert.equal(activeRow(), null)
    assert.equal(document.querySelector('[data-ks-pill]').hidden, true)
})

test('the sheet lists page actions and hides the table section without a table', () => {
    boot(makeConfig(), '<button id="save" x-mousetrap.global.mod-s="1">Save</button>', '<div data-keyboard-shortcut="mod+z" data-keyboard-shortcut-label="Undo last action"></div>')

    press('?', { shiftKey: true, code: 'Slash' })

    const pageActions = document.querySelector('[data-ks-section="page-actions"]')

    assert.equal(pageActions.hidden, false)
    assert.deepEqual([...pageActions.querySelectorAll('dt')].map((dt) => dt.textContent), ['Save', 'Undo last action'])
    assert.equal(document.querySelector('[data-ks-section="table"]').hidden, true)
})

test('search matches combos by key, not by label letters', () => {
    press('?', { shiftKey: true, code: 'Slash' })
    const search = document.querySelector('[data-ks-search]')

    search.value = 'g+c'
    search.dispatchEvent(new Event('input'))

    const visible = [...document.querySelectorAll('[data-ks-row]')].filter((row) => !row.hidden).map((row) => row.querySelector('dt').textContent)
    assert.deepEqual(visible, ['Customers'])
})

test('search matches key aliases like ctrl and cmd', () => {
    press('?', { shiftKey: true, code: 'Slash' })
    const search = document.querySelector('[data-ks-search]')

    search.value = 'ctrl /'
    search.dispatchEvent(new Event('input'))

    const visible = [...document.querySelectorAll('[data-ks-row]')].filter((row) => !row.hidden).map((row) => row.querySelector('dt').textContent)
    assert.deepEqual(visible, ['Show keyboard shortcuts'])
    assert.equal(document.querySelectorAll('[data-ks-section="general"] [data-ks-group]')[1].hidden, true)
})

test('decorates sidebar links with their chord', () => {
    assert.equal(document.querySelector('[href="/admin/orders"]').getAttribute('title'), 'Shortcut: G then O')
})

test('macOS shows glyphs in the sheet', () => {
    setPlatform(true)
    boot()

    assert.equal(document.querySelector('[data-ks-key="mod"]').textContent, '⌘')
    assert.equal(document.querySelector('[data-ks-platform]').textContent, '⌘ on this Mac')
})

test('re-initialises on livewire:navigated with a new root', () => {
    boot(makeConfig({ chords: { prefix: 'q', timeout: 1200, hints: false, items: [{ key: 'x', label: 'X', letter: 'x', url: '/admin/x', newTab: false }] } }))

    press('g')
    press('o')
    press('q')
    press('x')

    assert.deepEqual(calls.navigate, ['/admin/x'])
})
