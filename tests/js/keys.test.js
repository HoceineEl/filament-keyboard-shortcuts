import './setup.js'
import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { comboFromEvent, decodeMousetrap, detectMac, keyLabel, keyName, normalize, setPlatform, tokens } from '../../resources/js/keys.js'

const keydown = (key, options = {}) => new KeyboardEvent('keydown', { key, ...options })

afterEach(() => setPlatform(false))

test('detectMac reads the platform hints in order', () => {
    assert.equal(detectMac({ userAgentData: { platform: 'macOS' } }), true)
    assert.equal(detectMac({ platform: 'MacIntel' }), true)
    assert.equal(detectMac({ platform: '', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }), true)
    assert.equal(detectMac({ platform: 'Win32' }), false)
    assert.equal(detectMac({ platform: 'Linux x86_64' }), false)
    assert.equal(detectMac(undefined), false)
})

test('tokens splits on plus and keeps a literal plus key', () => {
    assert.deepEqual(tokens('mod+shift+n'), ['mod', 'shift', 'n'])
    assert.deepEqual(tokens(' Mod + K '), ['mod', 'k'])
    assert.deepEqual(tokens('mod++'), ['mod', '+'])
    assert.deepEqual(tokens('+'), ['+'])
})

test('normalize resolves aliases and orders modifiers', () => {
    assert.equal(normalize('Shift+CMD+N'), 'mod+shift+n')
    assert.equal(normalize('ctrl+/'), 'mod+/')
    assert.equal(normalize('option+command+e'), 'mod+alt+e')
    assert.equal(normalize('esc'), 'escape')
    assert.equal(normalize('return'), 'enter')
})

test('decodeMousetrap turns Filament attribute segments into bindings', () => {
    assert.equal(decodeMousetrap('mod-s'), 'mod+s')
    assert.equal(decodeMousetrap('command-shift-e'), 'mod+shift+e')
    assert.equal(decodeMousetrap('ctrl-alt-n'), 'mod+alt+n')
    assert.equal(decodeMousetrap('-'), '-')
    assert.equal(decodeMousetrap('g'), 'g')
})

test('comboFromEvent uses ctrl as mod outside macOS', () => {
    setPlatform(false)

    assert.equal(comboFromEvent(keydown('k', { ctrlKey: true })), 'mod+k')
    assert.equal(comboFromEvent(keydown('k', { metaKey: true })), null)
    assert.equal(comboFromEvent(keydown('E', { ctrlKey: true, shiftKey: true })), 'mod+shift+e')
})

test('comboFromEvent uses meta as mod on macOS and ignores ctrl', () => {
    setPlatform(true)

    assert.equal(comboFromEvent(keydown('k', { metaKey: true })), 'mod+k')
    assert.equal(comboFromEvent(keydown('k', { ctrlKey: true })), null)
})

test('comboFromEvent drops shift for symbols that need it', () => {
    assert.equal(comboFromEvent(keydown('?', { shiftKey: true, code: 'Slash' })), '?')
    assert.equal(comboFromEvent(keydown('X', { shiftKey: true, code: 'KeyX' })), 'shift+x')
    assert.equal(comboFromEvent(keydown('/', { ctrlKey: true, code: 'Slash' })), 'mod+/')
})

test('comboFromEvent names special keys and ignores lone modifiers', () => {
    assert.equal(comboFromEvent(keydown('Escape')), 'escape')
    assert.equal(comboFromEvent(keydown('Enter')), 'enter')
    assert.equal(comboFromEvent(keydown('ArrowDown')), 'down')
    assert.equal(comboFromEvent(keydown('F1')), 'f1')
    assert.equal(comboFromEvent(keydown('Shift', { shiftKey: true })), null)
    assert.equal(comboFromEvent(keydown('Meta', { metaKey: true })), null)
    assert.equal(comboFromEvent(keydown('Dead')), null)
})

test('comboFromEvent reads the physical key on non-latin layouts and with alt', () => {
    assert.equal(comboFromEvent(keydown('ل', { code: 'KeyG' })), 'g')
    assert.equal(comboFromEvent(keydown('ج', { code: 'BracketRight' })), ']')
    assert.equal(comboFromEvent(keydown('٣', { code: 'Digit3' })), '3')

    setPlatform(true)
    assert.equal(comboFromEvent(keydown('∂', { altKey: true, code: 'KeyD' })), 'alt+d')
})

test('keyLabel shows glyphs on macOS and words elsewhere', () => {
    setPlatform(true)
    assert.equal(keyLabel('mod'), '⌘')
    assert.equal(keyLabel('shift'), '⇧')
    assert.equal(keyLabel('alt'), '⌥')
    assert.equal(keyLabel('enter'), 'return')
    assert.equal(keyName('mod'), 'Command')

    setPlatform(false)
    assert.equal(keyLabel('mod', { mod: 'Ctrl' }), 'Ctrl')
    assert.equal(keyLabel('shift', { shift: 'Maj' }), 'Maj')
    assert.equal(keyName('mod'), null)
})

test('keyLabel draws arrows and uppercases letters', () => {
    assert.equal(keyLabel('up'), '↑')
    assert.equal(keyLabel('left'), '←')
    assert.equal(keyLabel('g'), 'G')
    assert.equal(keyLabel('/'), '/')
})
