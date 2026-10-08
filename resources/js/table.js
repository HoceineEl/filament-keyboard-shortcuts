const ROW_SELECTOR = 'tr.fi-ta-row:not(.fi-ta-group-header-row):not(.fi-ta-individual-search-row), .fi-ta-record'

const OPEN_SELECTOR = 'a.fi-ta-record-content, a.fi-ta-col:not(.fi-ta-col-has-column-url), button.fi-ta-col, a.fi-ta-col, a[href]'

let activeKey = null

function isUsable(element) {
    return element && !element.closest('.fi-modal') && element.getClientRects().length > 0
}

function findTable() {
    const candidates = [
        document.activeElement?.closest?.('.fi-ta-ctn'),
        document.querySelector('[data-ks-active]')?.closest('.fi-ta-ctn'),
        ...document.querySelectorAll('.fi-ta-ctn'),
    ]

    return candidates.find(isUsable) ?? null
}

function rowsOf(table) {
    return [...table.querySelectorAll(ROW_SELECTOR)].filter((row) => row.closest('.fi-ta-ctn') === table && row.getClientRects().length > 0)
}

function keyOf(row) {
    return row.getAttribute('wire:key') ?? row.querySelector('.fi-ta-record-checkbox')?.value ?? null
}

function activeRow(rows) {
    return rows.find((row) => row.hasAttribute('data-ks-active')) ?? rows.find((row) => activeKey !== null && keyOf(row) === activeKey) ?? null
}

function activate(row) {
    document.querySelectorAll('[data-ks-active]').forEach((element) => element.removeAttribute('data-ks-active'))

    if (!row) {
        activeKey = null

        return
    }

    activeKey = keyOf(row)
    row.setAttribute('data-ks-active', '')
    row.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}

function click(element) {
    if (element && !element.disabled && element.getAttribute('aria-disabled') !== 'true') {
        element.click()

        return true
    }

    return false
}

function openFilters(table) {
    const dropdownTrigger = table.querySelector('.fi-ta-filters-dropdown > .fi-dropdown-trigger')

    if (dropdownTrigger) {
        dropdownTrigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))

        return true
    }

    const modalTrigger = table.querySelector('.fi-ta-filters-modal')?.previousElementSibling

    if (modalTrigger?.classList.contains('fi-modal-trigger')) {
        return click(modalTrigger.querySelector('button') ?? modalTrigger)
    }

    return click(table.querySelector('.fi-ta-filters-trigger-action-ctn button'))
}

export function hasTable() {
    return findTable() !== null
}

export function restoreActiveRow() {
    if (activeKey === null || document.querySelector('[data-ks-active]')) {
        return
    }

    const table = findTable()
    const row = table && rowsOf(table).find((candidate) => keyOf(candidate) === activeKey)

    row?.setAttribute('data-ks-active', '')
}

export function resetTable() {
    activeKey = null
}

const ACTIONS = {
    j: (table, rows, current) => activate(rows[current ? Math.min(rows.indexOf(current) + 1, rows.length - 1) : 0]),
    k: (table, rows, current) => activate(rows[current ? Math.max(rows.indexOf(current) - 1, 0) : 0]),
    enter: (table, rows, current) => current && click(current.querySelector(OPEN_SELECTOR)),
    o: (table, rows, current) => current && click(current.querySelector(OPEN_SELECTOR)),
    x: (table, rows, current) => current && click(current.querySelector('.fi-ta-record-checkbox')),
    'shift+x': (table) => click(table.querySelector('.fi-ta-page-checkbox')),
    '[': (table) => click(table.querySelector('.fi-pagination [rel="prev"]')),
    ']': (table) => click(table.querySelector('.fi-pagination [rel="next"]')),
    f: openFilters,
}

export function handlesTableKey(combo) {
    return combo in ACTIONS
}

export function runTableKey(combo) {
    const table = findTable()

    if (!table) {
        return false
    }

    const rows = rowsOf(table)
    const current = activeRow(rows)

    if (['enter', 'o', 'x'].includes(combo) && !current) {
        return false
    }

    if (['j', 'k'].includes(combo) && rows.length === 0) {
        return false
    }

    ACTIONS[combo](table, rows, current)

    return true
}
