import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register({ url: 'http://localhost/admin', width: 1280, height: 800 })

function isRendered(element) {
    for (let node = element; node instanceof Element; node = node.parentElement) {
        if (node.hidden || node.style.display === 'none') {
            return false
        }
    }

    return element.isConnected
}

Element.prototype.getClientRects = function () {
    return isRendered(this) ? [{ x: 0, y: 0, width: 10, height: 10 }] : []
}

Element.prototype.scrollIntoView = function () {}

export const i18n = {
    then: 'then',
    or: 'or',
    unnamed: 'Unnamed action',
    hint: 'Shortcut: :keys',
    keys: { mod: 'Ctrl', alt: 'Alt', shift: 'Shift', enter: 'Enter', escape: 'Esc' },
}

export const chordItems = [
    { key: 'dashboard', label: 'Dashboard', group: null, letter: 'd', url: '/admin', newTab: false },
    { key: 'customers', label: 'Customers', group: 'Sales', letter: 'c', url: '/admin/customers', newTab: false },
    { key: 'customer-users', label: 'Customer users', group: 'Sales', letter: 'cu', url: '/admin/customer-users', newTab: false },
    { key: 'orders', label: 'Orders', group: 'Sales', letter: 'o', url: '/admin/orders', newTab: false },
    { key: 'docs', label: 'Docs', group: null, letter: 'ds', url: 'https://filamentphp.com', newTab: true },
]

export function makeConfig(overrides = {}) {
    return {
        sheet: ['?', 'mod+/'],
        search: ['/'],
        chords: { prefix: 'g', timeout: 1200, hints: true, items: chordItems },
        table: true,
        spa: true,
        shortcuts: [
            { keys: ['mod+shift+e'], label: 'Export', group: 'Billing', behavior: 'dispatch', event: 'export-requested', payload: { format: 'csv' } },
            { keys: ['mod+b'], label: 'Docs', group: 'More', behavior: 'url', url: '/admin/docs', newTab: false },
        ],
        reserved: ['mod+k', 'mod+w', 'mod+t', 'mod+shift+f'],
        i18n,
        ...overrides,
    }
}

export function rootHtml(config = makeConfig()) {
    return `
        <div class="ks-root" data-ks-root>
            <script type="application/json" data-ks-config>${JSON.stringify(config)}</script>
            <div class="ks-sheet" data-ks-sheet hidden>
                <div class="ks-scrim" data-ks-close></div>
                <div class="ks-dialog" role="dialog" data-ks-dialog>
                    <p data-ks-platform data-ks-mac="⌘ on this Mac">Ctrl on this device</p>
                    <button type="button" data-ks-close>Close</button>
                    <input type="search" data-ks-search />
                    <div data-ks-body>
                        <section data-ks-section="general">
                            <div data-ks-group><dl data-ks-list>
                                <div class="ks-row" data-ks-row data-ks-search="show keyboard shortcuts" data-ks-keys="? mod /"><dt>Show keyboard shortcuts</dt><dd><kbd data-ks-key="mod">Ctrl</kbd><kbd data-ks-key="/">/</kbd></dd></div>
                            </dl></div>
                            <div data-ks-group><h4>Sales</h4><dl data-ks-list>
                                <div class="ks-row" data-ks-row data-ks-search="customers sales" data-ks-keys="g c"><dt>Customers</dt><dd><kbd data-ks-key="g">G</kbd><kbd data-ks-key="c">C</kbd></dd></div>
                            </dl></div>
                        </section>
                        <section data-ks-section="page-actions" data-ks-dynamic hidden><div data-ks-group><dl data-ks-list></dl></div></section>
                        <section data-ks-section="table" data-ks-requires="table">
                            <div data-ks-group><dl data-ks-list><div class="ks-row" data-ks-row data-ks-search="next row" data-ks-keys="j"><dt>Next row</dt><dd><kbd data-ks-key="j">J</kbd></dd></div></dl></div>
                        </section>
                        <div data-ks-empty hidden>
                            <p data-ks-empty-text data-ks-template="No shortcuts match “:query”"></p>
                            <button type="button" data-ks-clear>Clear search</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="ks-pill" data-ks-pill hidden><span data-ks-pill-keys></span></div>
            <div class="ks-hints" data-ks-hints hidden></div>
        </div>`
}

export function sidebarHtml(items = chordItems) {
    const links = items
        .map((item) => `<li class="fi-sidebar-item"><a class="fi-sidebar-item-btn" href="${item.url}"><span class="fi-sidebar-item-label">${item.label}</span></a></li>`)
        .join('')

    return `<aside class="fi-sidebar"><nav class="fi-sidebar-nav"><ul>${links}</ul></nav></aside>`
}

export function tableHtml({ rows = 3, prev = false, next = true, filters = 'dropdown' } = {}) {
    const body = Array.from(
        { length: rows },
        (_, index) => `
            <tr class="fi-ta-row" wire:key="row-${index + 1}">
                <td><input type="checkbox" class="fi-ta-record-checkbox" value="${index + 1}" /></td>
                <td><a class="fi-ta-col" href="/admin/customers/${index + 1}/edit">Customer ${index + 1}</a></td>
            </tr>`,
    ).join('')

    const filtersHtml = filters === 'dropdown' ? '<div class="fi-ta-filters-dropdown"><button class="fi-dropdown-trigger" type="button">Filter</button></div>' : ''

    return `
        <div class="fi-ta-ctn">
            ${filtersHtml}
            <div class="fi-ta-search-field"><input type="search" /></div>
            <table><thead><tr><th><input type="checkbox" class="fi-ta-page-checkbox" /></th></tr></thead><tbody>${body}</tbody></table>
            <nav class="fi-pagination">
                <button type="button" rel="prev" ${prev ? '' : 'disabled'}>Previous</button>
                <button type="button" rel="next" ${next ? '' : 'disabled'}>Next</button>
            </nav>
        </div>`
}

export function mount(...parts) {
    document.body.innerHTML = parts.join('')
}

export function press(key, options = {}, target = document.activeElement ?? document.body) {
    const code = options.code ?? (/^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : /^\d$/.test(key) ? `Digit${key}` : '')
    const event = new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true, ...options })

    ;(target ?? document.body).dispatchEvent(event)

    return event
}
