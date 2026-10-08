import { discoverPageBindings } from './discover.js'
import { hasTable } from './table.js'
import { isMac, keyLabel, keyName, normalize, tokens } from './keys.js'

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

const QUERY_ALIASES = { ctrl: 'mod', cmd: 'mod', command: 'mod', '⌘': 'mod', '⇧': 'shift', '⌥': 'alt', option: 'alt', esc: 'escape' }

function element(tag, className, text) {
    const node = document.createElement(tag)

    if (className) {
        node.className = className
    }

    if (text !== undefined) {
        node.textContent = text
    }

    return node
}

export function decorateKey(kbd, labels) {
    const token = kbd.dataset.ksKey
    const name = keyName(token)

    kbd.textContent = keyLabel(token, labels)

    if (name) {
        kbd.setAttribute('title', name)
        kbd.setAttribute('aria-label', name)
        kbd.toggleAttribute('data-ks-glyph', kbd.textContent.length === 1)
    }
}

function renderKeys(bindings, i18n) {
    const wrapper = element('span', 'ks-keys')

    bindings.forEach((binding, index) => {
        if (index > 0) {
            wrapper.append(element('span', 'ks-or', i18n.or))
        }

        const chord = element('span', 'ks-chord')
        const combo = element('span', 'ks-combo')

        tokens(binding).forEach((token) => {
            const kbd = element('kbd', 'ks-kbd')
            kbd.dataset.ksKey = token
            decorateKey(kbd, i18n.keys)
            combo.append(kbd)
        })

        chord.append(combo)
        wrapper.append(chord)
    })

    return wrapper
}

function renderRow({ label, keys }, i18n) {
    const row = element('div', 'ks-row')
    row.dataset.ksRow = ''
    row.dataset.ksSearch = label.toLowerCase()
    row.dataset.ksKeys = [...new Set(keys.flatMap((binding) => binding.split(' ').flatMap(tokens)))].join(' ')

    const term = element('dt', 'ks-label', label)
    const definition = element('dd', 'ks-row-keys')
    definition.append(renderKeys(keys, i18n))
    row.append(term, definition)

    return row
}

export function createSheet({ config, root }) {
    const sheet = root.querySelector('[data-ks-sheet]')
    const dialog = root.querySelector('[data-ks-dialog]')
    const search = root.querySelector('[data-ks-search]')
    const empty = root.querySelector('[data-ks-empty]')
    const emptyText = root.querySelector('[data-ks-empty-text]')
    const pageActions = root.querySelector('[data-ks-section="page-actions"]')
    let returnFocus = null
    let closeTimer = null

    if (isMac) {
        root.querySelectorAll('[data-ks-key]').forEach((kbd) => decorateKey(kbd, config.i18n.keys))

        const platform = root.querySelector('[data-ks-platform]')
        platform.textContent = platform.dataset.ksMac
    }

    function sections() {
        return [...root.querySelectorAll('[data-ks-section]')]
    }

    function renderPageActions() {
        const list = pageActions.querySelector('[data-ks-list]')
        const bindings = discoverPageBindings(config.i18n.unnamed)

        list.replaceChildren(...bindings.map((binding) => renderRow(binding, config.i18n)))
        pageActions.toggleAttribute('data-ks-unavailable', bindings.length === 0)
    }

    function lockHeight(lock) {
        dialog.style.height = lock ? `${dialog.getBoundingClientRect().height}px` : ''
    }

    function filter() {
        const raw = search.value.trim().toLowerCase()
        const terms = raw
            .split(/\s+/)
            .filter(Boolean)
            .flatMap((word) => (word.length > 1 && word.includes('+') ? tokens(normalize(word)).map((key) => ({ key })) : [{ text: word, key: QUERY_ALIASES[word] ?? normalize(word) }]))
        let visible = 0

        if (raw === '') {
            lockHeight(false)
        } else if (!dialog.style.height) {
            lockHeight(true)
        }

        for (const section of sections()) {
            let rowsShown = 0

            for (const group of section.querySelectorAll('[data-ks-group]')) {
                let groupShown = 0

                for (const row of group.querySelectorAll('[data-ks-row]')) {
                    const keys = (row.dataset.ksKeys ?? '').split(' ')
                    const matches = terms.every(({ text, key }) => (text !== undefined && row.dataset.ksSearch.includes(text)) || keys.includes(key))

                    row.hidden = !matches
                    groupShown += matches ? 1 : 0
                }

                group.hidden = groupShown === 0
                rowsShown += groupShown
            }

            const unavailable = section.hasAttribute('data-ks-unavailable')

            section.hidden = unavailable || rowsShown === 0
            visible += section.hidden ? 0 : rowsShown
        }

        empty.hidden = visible > 0 || raw === ''
        emptyText.textContent = emptyText.dataset.ksTemplate.replace(':query', search.value.trim())
    }

    function open() {
        if (isOpen()) {
            return
        }

        clearTimeout(closeTimer)
        returnFocus = document.activeElement
        renderPageActions()

        const table = root.querySelector('[data-ks-requires="table"]')
        table?.toggleAttribute('data-ks-unavailable', !hasTable())

        search.value = ''
        filter()

        sheet.hidden = false
        dialog.setAttribute('aria-modal', 'true')
        sheet.dataset.ksState = 'entering'
        document.documentElement.classList.add('ks-locked')
        requestAnimationFrame(() => {
            sheet.dataset.ksState = 'open'
            search.focus({ preventScroll: true })
        })
    }

    function close() {
        if (!isOpen()) {
            return
        }

        sheet.dataset.ksState = 'leaving'
        dialog.removeAttribute('aria-modal')
        lockHeight(false)
        document.documentElement.classList.remove('ks-locked')
        closeTimer = setTimeout(() => (sheet.hidden = true), 120)
        search.blur()

        if (returnFocus?.isConnected) {
            returnFocus.focus({ preventScroll: true })
        }

        returnFocus = null
    }

    function isOpen() {
        return !sheet.hidden && sheet.dataset.ksState !== 'leaving'
    }

    function trapFocus(event) {
        const focusable = [...dialog.querySelectorAll(FOCUSABLE)].filter((node) => node.getClientRects().length > 0)

        if (focusable.length === 0) {
            return
        }

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
            event.preventDefault()
            last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
        }
    }

    function onKeydown(event) {
        if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()

            if (search.value !== '' && document.activeElement === search) {
                search.value = ''
                filter()

                return
            }

            close()
        } else if (event.key === 'Tab') {
            trapFocus(event)
        }
    }

    search.addEventListener('input', filter)

    root.querySelectorAll('[data-ks-close]').forEach((node) => node.addEventListener('click', close))

    root.querySelector('[data-ks-clear]').addEventListener('click', () => {
        search.value = ''
        filter()
        search.focus()
    })

    return { open, close, isOpen, onKeydown }
}
