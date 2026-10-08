import { comboFromEvent } from './keys.js'
import { createChords } from './chords.js'
import { createHints, decorateNavigation } from './hints.js'
import { createSheet } from './sheet.js'
import { isClaimedByPage } from './discover.js'
import { handlesTableKey, resetTable, restoreActiveRow, runTableKey } from './table.js'

let state = null

const TYPING_SELECTOR = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

const INTERACTIVE_SELECTOR = 'a[href], button, summary, [role="button"], [role="link"], [role="menuitem"], [role="option"], [role="checkbox"], [role="tab"]'

function isTyping(target) {
    return target instanceof Element && (target.isContentEditable || target.closest(TYPING_SELECTOR) !== null)
}

function isFilamentModalOpen() {
    return document.querySelector('.fi-modal.fi-modal-open') !== null
}

function navigate(url, newTab = false) {
    if (newTab) {
        window.open(url, '_blank', 'noopener')
    } else if (state?.config.spa && window.Livewire?.navigate) {
        window.Livewire.navigate(url)
    } else {
        window.location.href = url
    }
}

function focusSearch() {
    const input = [...document.querySelectorAll('.fi-global-search-field input, .fi-ta-search-field input')].find(
        (candidate) => candidate.getClientRects().length > 0 && !candidate.closest('.fi-modal'),
    )

    input?.focus()
    input?.select()

    return Boolean(input)
}

function runShortcut(shortcut) {
    switch (shortcut.behavior) {
        case 'url':
            navigate(shortcut.url, shortcut.newTab)
            break
        case 'dispatch':
            window.Livewire?.dispatch(shortcut.event, shortcut.payload ?? {})
            break
        case 'js':
            window.Alpine?.evaluate(state.root, shortcut.js)
            break
    }
}

function consume(event) {
    event.preventDefault()
    event.stopPropagation()
}

function onKeydown(event) {
    if (!state || event.isComposing || event.defaultPrevented) {
        return
    }

    if (state.sheet.isOpen()) {
        state.sheet.onKeydown(event)

        return
    }

    const combo = comboFromEvent(event)

    if (!combo || state.reserved.has(combo)) {
        return
    }

    if (state.chords.isWaiting) {
        if (combo === 'escape') {
            state.chords.cancel()
            consume(event)

            return
        }

        if (state.chords.resolve(combo)) {
            consume(event)

            return
        }
    }

    const typing = isTyping(event.target)
    const isSheetKey = state.config.sheet.includes(combo)

    if (isFilamentModalOpen() || (typing && !(isSheetKey && combo.startsWith('mod+')))) {
        return
    }

    const custom = state.config.shortcuts.find((shortcut) => shortcut.keys.includes(combo))
    const isTableKey = state.config.table && handlesTableKey(combo)
    const isOurs = isSheetKey || custom || isTableKey || state.config.search.includes(combo) || state.chords.isPrefix(combo)

    if (!isOurs || event.repeat || isClaimedByPage(combo)) {
        return
    }

    if (isSheetKey) {
        consume(event)
        state.sheet.open()
    } else if (custom) {
        consume(event)
        runShortcut(custom)
    } else if (state.config.search.includes(combo)) {
        if (focusSearch()) {
            consume(event)
        }
    } else if (state.chords.isPrefix(combo)) {
        consume(event)
        state.chords.start()
    } else if (isTableKey) {
        if (combo === 'enter' && event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) {
            return
        }

        if (runTableKey(combo)) {
            consume(event)
        }
    }
}

function onClick(event) {
    if (state && event.target instanceof Element && event.target.closest('[data-ks-open]')) {
        event.preventDefault()
        state.sheet.open()
    }
}

function init() {
    const root = document.querySelector('[data-ks-root]')

    if (!root) {
        state = null

        return
    }

    if (state?.root === root) {
        decorate()

        return
    }

    state?.chords.cancel()

    const config = JSON.parse(root.querySelector('[data-ks-config]').textContent)

    state = {
        root,
        config,
        reserved: new Set(config.reserved),
        sheet: createSheet({ config, root }),
        chords: createChords({ config, root, navigate, hints: createHints(root) }),
    }

    resetTable()
    decorate()
}

function decorate() {
    const chords = state?.config.chords

    if (chords?.hints) {
        decorateNavigation(chords.items, chords.prefix, state.config.i18n)
    }
}

function onMorphed() {
    restoreActiveRow()
    decorate()
}

let isHooked = false

function hookLivewire() {
    if (!isHooked && window.Livewire?.hook) {
        isHooked = true
        window.Livewire.hook('morphed', onMorphed)
    }
}

if (!window.__keyboardShortcuts) {
    window.__keyboardShortcuts = true

    document.addEventListener('keydown', onKeydown)
    document.addEventListener('click', onClick)
    document.addEventListener('livewire:navigated', init)
    document.addEventListener('livewire:init', hookLivewire)

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init)
    } else {
        init()
    }

    hookLivewire()
}
