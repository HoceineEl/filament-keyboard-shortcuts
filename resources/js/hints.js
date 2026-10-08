import { keyLabel } from './keys.js'

const LINK_SELECTOR = '.fi-sidebar-item-btn[href], .fi-topbar-item-btn[href]'

const LABEL_SELECTOR = '.fi-sidebar-item-label, .fi-topbar-item-label'

const GAP = 8

const viewportWidth = () => document.documentElement.clientWidth || window.innerWidth

function normalizeUrl(url) {
    try {
        const parsed = new URL(url, window.location.href)

        return parsed.origin + parsed.pathname.replace(/\/+$/, '') + parsed.search
    } catch {
        return null
    }
}

function isShown(element) {
    return element !== null && element.getClientRects().length > 0
}

export function navigationLinks(items) {
    const byUrl = new Map(items.map((item) => [normalizeUrl(item.url), item]))
    const links = []

    for (const anchor of document.querySelectorAll(LINK_SELECTOR)) {
        const item = byUrl.get(normalizeUrl(anchor.getAttribute('href')))

        if (item && !anchor.closest('[data-ks-root]')) {
            links.push({ anchor, item })
        }
    }

    return links
}

export function sequenceLabel(prefix, letters, i18n) {
    return [prefix, ...letters].map((token) => keyLabel(token, i18n.keys)).join(` ${i18n.then} `)
}

export function decorateNavigation(items, prefix, i18n) {
    for (const { anchor, item } of navigationLinks(items)) {
        const text = i18n.hint.replace(':keys', sequenceLabel(prefix, item.letter, i18n))

        anchor.setAttribute('aria-description', text)

        const ownsTitle = !anchor.hasAttribute('title') || anchor.hasAttribute('data-ks-hint-title')

        if (ownsTitle && !anchor.hasAttribute('x-tooltip.html')) {
            anchor.setAttribute('title', text)
            anchor.setAttribute('data-ks-hint-title', '')
        }
    }
}

function visibleRect(anchor) {
    const rect = anchor.getBoundingClientRect()
    const clip = anchor.closest('.fi-sidebar-nav, .fi-topbar')?.getBoundingClientRect()
    const middle = rect.top + rect.height / 2

    if (rect.width === 0 || rect.height === 0 || rect.right <= 0 || rect.left >= viewportWidth()) {
        return null
    }

    if (middle < 0 || middle > window.innerHeight || (clip && (middle < clip.top || middle > clip.bottom))) {
        return null
    }

    return rect
}

function place(badge, anchor, rect) {
    const width = viewportWidth()
    const isRtl = getComputedStyle(anchor).direction === 'rtl'
    const inlineEndOf = (box) => (isRtl ? width - box.left : box.right)
    const inlineStartOf = (box) => (isRtl ? width - box.right : box.left)
    const isCollapsed = !isShown(anchor.querySelector(LABEL_SELECTOR))
    const isTopbar = anchor.matches('.fi-topbar-item-btn')

    badge.style.insetBlockStart = `${Math.round(rect.top + rect.height / 2)}px`
    badge.style.insetInlineStart = ''
    badge.style.insetInlineEnd = ''
    badge.toggleAttribute('data-ks-outside', isCollapsed)

    if (isCollapsed) {
        badge.style.insetInlineStart = `${Math.round(inlineEndOf(rect) + GAP / 2)}px`

        return
    }

    const countBadge = anchor.querySelector('.fi-sidebar-item-badge-ctn, .fi-topbar-item-badge-ctn')
    const end = isShown(countBadge) ? inlineStartOf(countBadge.getBoundingClientRect()) - GAP / 2 : inlineEndOf(rect) - (isTopbar ? GAP / 2 : GAP)

    badge.style.insetInlineEnd = `${Math.round(width - end)}px`
}

export function createHints(root) {
    const layer = root.querySelector('[data-ks-hints]')
    let entries = []
    let frame = null

    function reposition() {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
            for (const { anchor, badge } of entries) {
                const rect = visibleRect(anchor)

                badge.hidden = rect === null || badge.hasAttribute('data-ks-filtered')

                if (rect) {
                    place(badge, anchor, rect)
                }
            }
        })
    }

    function render(items) {
        entries = navigationLinks(items).map(({ anchor, item }) => {
            const badge = document.createElement('kbd')
            badge.className = 'ks-hint'
            badge.dataset.ksHint = item.letter
            badge.hidden = true

            return { anchor, item, badge }
        })

        layer.replaceChildren(...entries.map(({ badge }) => badge))
    }

    function update(typed) {
        for (const { item, badge } of entries) {
            const matches = item.letter.startsWith(typed)

            badge.toggleAttribute('data-ks-filtered', !matches)

            if (!matches) {
                badge.hidden = true
            }

            badge.replaceChildren(
                ...[...item.letter].map((letter, index) => {
                    const span = document.createElement('span')
                    span.textContent = letter.toUpperCase()
                    span.toggleAttribute('data-ks-typed', index < typed.length)

                    return span
                }),
            )
        }
    }

    function show(items, typed = '') {
        if (!layer.hasAttribute('data-ks-visible')) {
            render(items)
            layer.hidden = false
            layer.setAttribute('data-ks-visible', '')
            window.addEventListener('scroll', reposition, true)
            window.addEventListener('resize', reposition)
            requestAnimationFrame(() => (layer.dataset.ksState = 'open'))
        }

        update(typed)
        reposition()
    }

    function hide() {
        if (!layer.hasAttribute('data-ks-visible')) {
            return
        }

        cancelAnimationFrame(frame)
        window.removeEventListener('scroll', reposition, true)
        window.removeEventListener('resize', reposition)
        layer.removeAttribute('data-ks-visible')
        layer.dataset.ksState = 'closed'
        layer.hidden = true
        layer.replaceChildren()
        entries = []
    }

    return {
        show,
        hide,
        get badges() {
            return entries.map(({ badge }) => badge)
        },
    }
}
