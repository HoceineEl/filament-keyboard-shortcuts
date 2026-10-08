import { decodeMousetrap, normalize } from './keys.js'

const PREFIX = 'x-mousetrap.global.'

const XPATH = `//*[@*[starts-with(name(), '${PREFIX}')]]`

function labelFor(element, fallback) {
    const candidates = [
        element.getAttribute('aria-label'),
        element.labels?.[0]?.textContent,
        element.innerText,
        element.getAttribute('title'),
    ]

    return candidates.map((value) => value?.replace(/\s+/g, ' ').trim()).find(Boolean) ?? fallback
}

function boundElements() {
    if (typeof document.evaluate === 'function') {
        const result = document.evaluate(XPATH, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)

        return Array.from({ length: result.snapshotLength }, (_, index) => result.snapshotItem(index))
    }

    return [...document.querySelectorAll('*')].filter((element) => element.getAttributeNames().some((name) => name.startsWith(PREFIX)))
}

export function discoverPageBindings(fallbackLabel = '') {
    const seen = new Map()

    for (const element of boundElements()) {
        if (element.closest('[data-ks-root]') || element.getClientRects().length === 0) {
            continue
        }

        for (const attribute of element.getAttributeNames()) {
            if (!attribute.startsWith(PREFIX)) {
                continue
            }

            const keys = attribute
                .slice(PREFIX.length)
                .split('.')
                .filter(Boolean)
                .map(decodeMousetrap)
                .filter((key, position, all) => all.indexOf(key) === position && !seen.has(key))

            if (keys.length === 0) {
                continue
            }

            const label = labelFor(element, fallbackLabel)

            keys.forEach((key) => seen.set(key, label))
        }
    }

    for (const element of document.querySelectorAll('[data-keyboard-shortcut]')) {
        if (element.closest('[data-ks-root]')) {
            continue
        }

        const label = element.getAttribute('data-keyboard-shortcut-label')?.trim() || fallbackLabel

        element
            .getAttribute('data-keyboard-shortcut')
            .split(/\s+/)
            .map((key) => normalize(key.trim()))
            .filter((key) => key && !seen.has(key))
            .forEach((key) => seen.set(key, label))
    }

    const grouped = new Map()

    for (const [key, label] of seen) {
        grouped.set(label, [...(grouped.get(label) ?? []), key])
    }

    return [...grouped].map(([label, keys]) => ({ label, keys }))
}

export function isClaimedByPage(combo) {
    return discoverPageBindings().some((binding) => binding.keys.includes(combo))
}
