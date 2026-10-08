export function detectMac(nav = globalThis.navigator) {
    return /Mac|iPhone|iPad|iPod/i.test(nav?.userAgentData?.platform || nav?.platform || nav?.userAgent || '')
}

export let isMac = detectMac()

export function setPlatform(mac) {
    isMac = mac
}

const MODIFIERS = ['mod', 'alt', 'shift']

const ALIASES = { cmd: 'mod', command: 'mod', meta: 'mod', ctrl: 'mod', control: 'mod', option: 'alt', opt: 'alt', esc: 'escape', return: 'enter' }

const NAMED = {
    Escape: 'escape',
    Esc: 'escape',
    Enter: 'enter',
    ' ': 'space',
    Tab: 'tab',
    Backspace: 'backspace',
    Delete: 'delete',
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
}

const CODES = {
    Slash: ['/', '?'],
    BracketLeft: ['[', '{'],
    BracketRight: [']', '}'],
    Period: ['.', '>'],
    Comma: [',', '<'],
    Minus: ['-', '_'],
    Equal: ['=', '+'],
    Semicolon: [';', ':'],
    Quote: ["'", '"'],
    Backquote: ['`', '~'],
    Backslash: ['\\', '|'],
}

const MAC_GLYPHS = { mod: ['⌘', 'Command'], shift: ['⇧', 'Shift'], alt: ['⌥', 'Option'], enter: ['return', 'Return'], escape: ['esc', 'Escape'] }

const ARROWS = { up: '↑', down: '↓', left: '←', right: '→' }

export function tokens(binding) {
    const value = binding.trim().toLowerCase()

    if (value === '+' || value.endsWith('++')) {
        return [...tokens(value.slice(0, -2)), '+'].filter(Boolean)
    }

    return value.split('+').map((token) => token.trim()).filter(Boolean)
}

export function normalize(binding) {
    const parts = tokens(binding).map((token) => ALIASES[token] ?? token)

    return [...MODIFIERS.filter((modifier) => parts.includes(modifier)), ...parts.filter((part) => !MODIFIERS.includes(part))].join('+')
}

function keyFromEvent(event) {
    if (NAMED[event.key]) {
        return NAMED[event.key]
    }

    if (/^F\d{1,2}$/.test(event.key)) {
        return event.key.toLowerCase()
    }

    const isPrintableAscii = event.key?.length === 1 && event.key.charCodeAt(0) > 32 && event.key.charCodeAt(0) < 127

    if (isPrintableAscii && !event.altKey) {
        return event.key.toLowerCase()
    }

    if (/^Key[A-Z]$/.test(event.code)) {
        return event.code.slice(3).toLowerCase()
    }

    if (/^Digit\d$/.test(event.code)) {
        return event.code.slice(5)
    }

    if (CODES[event.code]) {
        return CODES[event.code][event.shiftKey ? 1 : 0]
    }

    return null
}

export function comboFromEvent(event) {
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(event.key)) {
        return null
    }

    if (isMac ? event.ctrlKey : event.metaKey) {
        return null
    }

    const key = keyFromEvent(event)

    if (!key) {
        return null
    }

    const isSymbol = key.length === 1 && !/[a-z0-9]/.test(key)

    return [
        (isMac ? event.metaKey : event.ctrlKey) && 'mod',
        event.altKey && 'alt',
        event.shiftKey && !isSymbol && 'shift',
        key,
    ]
        .filter(Boolean)
        .join('+')
}

export function decodeMousetrap(segment) {
    return normalize(segment.replace(/-(?=.)/g, '+'))
}

export function keyLabel(token, labels = {}) {
    if (isMac && MAC_GLYPHS[token]) {
        return MAC_GLYPHS[token][0]
    }

    return ARROWS[token] ?? labels[token] ?? token.toUpperCase()
}

export function keyName(token) {
    return isMac && MAC_GLYPHS[token] ? MAC_GLYPHS[token][1] : null
}
