import { mount, tableHtml } from './setup.js'
import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { handlesTableKey, hasTable, resetTable, restoreActiveRow, runTableKey } from '../../resources/js/table.js'

const activeKey = () => document.querySelector('[data-ks-active]')?.getAttribute('wire:key') ?? null

beforeEach(() => {
    resetTable()
    mount(tableHtml())
})

test('knows its keys', () => {
    for (const key of ['j', 'k', 'enter', 'o', 'x', 'shift+x', '[', ']', 'f']) {
        assert.equal(handlesTableKey(key), true, key)
    }

    assert.equal(handlesTableKey('g'), false)
})

test('j and k move the active row and stop at the edges', () => {
    assert.equal(runTableKey('j'), true)
    assert.equal(activeKey(), 'row-1')

    runTableKey('j')
    runTableKey('j')
    runTableKey('j')
    assert.equal(activeKey(), 'row-3')

    runTableKey('k')
    assert.equal(activeKey(), 'row-2')

    runTableKey('k')
    runTableKey('k')
    assert.equal(activeKey(), 'row-1')
    assert.equal(document.querySelectorAll('[data-ks-active]').length, 1)
})

test('k starts on the first row', () => {
    runTableKey('k')

    assert.equal(activeKey(), 'row-1')
})

test('skips hidden rows', () => {
    document.querySelector('[wire\\:key="row-2"]').hidden = true

    runTableKey('j')
    runTableKey('j')

    assert.equal(activeKey(), 'row-3')
})

test('enter, o and x need an active row', () => {
    assert.equal(runTableKey('enter'), false)
    assert.equal(runTableKey('o'), false)
    assert.equal(runTableKey('x'), false)
})

test('enter and o click the row link', () => {
    const clicks = []
    document.querySelectorAll('a.fi-ta-col').forEach((link) => link.addEventListener('click', (event) => {
        event.preventDefault()
        clicks.push(link.textContent)
    }))

    runTableKey('j')
    runTableKey('j')
    runTableKey('enter')
    runTableKey('o')

    assert.deepEqual(clicks, ['Customer 2', 'Customer 2'])
})

test('x toggles the active row checkbox and shift+x the page checkbox', () => {
    runTableKey('j')
    runTableKey('x')

    assert.equal(document.querySelector('.fi-ta-record-checkbox[value="1"]').checked, true)

    runTableKey('x')
    assert.equal(document.querySelector('.fi-ta-record-checkbox[value="1"]').checked, false)

    runTableKey('shift+x')
    assert.equal(document.querySelector('.fi-ta-page-checkbox').checked, true)
})

test('[ and ] click pagination and respect disabled buttons', () => {
    const clicked = []
    document.querySelectorAll('.fi-pagination button').forEach((button) => button.addEventListener('click', () => clicked.push(button.getAttribute('rel'))))

    assert.equal(runTableKey(']'), true)
    assert.equal(runTableKey('['), true)

    assert.deepEqual(clicked, ['next'])
})

test('f opens the filters dropdown', () => {
    let opened = 0
    document.querySelector('.fi-dropdown-trigger').addEventListener('mousedown', () => opened++)

    runTableKey('f')

    assert.equal(opened, 1)
})

test('f falls back to the filters trigger action', () => {
    mount(tableHtml({ filters: 'none' }).replace('<table>', '<div class="fi-ta-filters-trigger-action-ctn"><button type="button">Filters</button></div><table>'))
    let opened = 0
    document.querySelector('.fi-ta-filters-trigger-action-ctn button').addEventListener('click', () => opened++)

    runTableKey('f')

    assert.equal(opened, 1)
})

test('does nothing without a table, or with one inside a modal', () => {
    mount('<p>No table</p>')
    assert.equal(hasTable(), false)
    assert.equal(runTableKey('j'), false)

    mount(`<div class="fi-modal">${tableHtml()}</div>`)
    assert.equal(hasTable(), false)
})

test('works with the table that contains focus', () => {
    mount(tableHtml({ rows: 2 }), tableHtml({ rows: 4 }).replaceAll('row-', 'second-'))
    document.querySelectorAll('.fi-ta-ctn')[1].querySelector('input[type="search"]').focus()

    runTableKey('j')

    assert.equal(activeKey(), 'second-1')
})

test('restores the active row after a re-render', () => {
    runTableKey('j')
    runTableKey('j')

    mount(tableHtml())
    assert.equal(activeKey(), null)

    restoreActiveRow()
    assert.equal(activeKey(), 'row-2')
})

test('resetTable forgets the active row', () => {
    runTableKey('j')
    resetTable()
    mount(tableHtml())
    restoreActiveRow()

    assert.equal(activeKey(), null)
})
