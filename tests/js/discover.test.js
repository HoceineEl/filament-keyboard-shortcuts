import { mount } from './setup.js'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { discoverPageBindings, isClaimedByPage } from '../../resources/js/discover.js'

test('finds Filament key bindings and labels them from aria-label, text, then title', () => {
    mount(`
        <button id="a" x-mousetrap.global.mod-s="1" aria-label="Save changes">💾</button>
        <button id="b" x-mousetrap.global.mod-shift-e="1"> Export
            invoices </button>
        <a id="c" href="#" x-mousetrap.global.mod-alt-n="1" title="New invoice"></a>
    `)

    assert.deepEqual(discoverPageBindings('Unnamed'), [
        { label: 'Save changes', keys: ['mod+s'] },
        { label: 'Export invoices', keys: ['mod+shift+e'] },
        { label: 'New invoice', keys: ['mod+alt+n'] },
    ])
})

test('splits several bindings on one element and decodes aliases', () => {
    mount('<button id="a" x-mousetrap.global.command-s.ctrl-s="1">Save</button>')

    assert.deepEqual(discoverPageBindings(), [{ label: 'Save', keys: ['mod+s'] }])
})

test('dedupes by key, keeping the first element', () => {
    mount(`
        <button id="a" x-mousetrap.global.mod-s="1">Save</button>
        <button id="b" x-mousetrap.global.mod-s="1">Save again</button>
        <button id="c" x-mousetrap.global.mod-d="1">Save</button>
    `)

    assert.deepEqual(discoverPageBindings(), [{ label: 'Save', keys: ['mod+s', 'mod+d'] }])
})

test('skips hidden elements and the plugin itself', () => {
    mount(`
        <div hidden><button id="a" x-mousetrap.global.mod-h="1">Hidden</button></div>
        <div data-ks-root><button id="b" x-mousetrap.global.mod-i="1">Ours</button></div>
        <button id="c" x-mousetrap.global.mod-v="1">Visible</button>
    `)

    assert.deepEqual(discoverPageBindings(), [{ label: 'Visible', keys: ['mod+v'] }])
})

test('falls back to the given label when nothing names the element', () => {
    mount('<button id="a" x-mousetrap.global.mod-u="1"></button>')

    assert.deepEqual(discoverPageBindings('Unnamed action'), [{ label: 'Unnamed action', keys: ['mod+u'] }])
})

test('reads [data-keyboard-shortcut] markers even when they are hidden', () => {
    mount(`
        <div hidden data-keyboard-shortcut="mod+z" data-keyboard-shortcut-label="Undo last action"></div>
        <span data-keyboard-shortcut="Cmd+Shift+Z  ctrl+y"></span>
    `)

    assert.deepEqual(discoverPageBindings('Unnamed action'), [
        { label: 'Undo last action', keys: ['mod+z'] },
        { label: 'Unnamed action', keys: ['mod+shift+z', 'mod+y'] },
    ])
})

test('lets Filament markup win over a marker for the same key', () => {
    mount(`
        <button id="a" x-mousetrap.global.mod-z="1">Revert</button>
        <div data-keyboard-shortcut="mod+z" data-keyboard-shortcut-label="Undo last action"></div>
        <div data-ks-root><div data-keyboard-shortcut="mod+q" data-keyboard-shortcut-label="Ours"></div></div>
    `)

    assert.deepEqual(discoverPageBindings(), [{ label: 'Revert', keys: ['mod+z'] }])
})

test('isClaimedByPage tells whether the page already uses a key', () => {
    mount('<button id="a" x-mousetrap.global.j="1">Jump</button><div data-keyboard-shortcut="mod+z"></div>')

    assert.equal(isClaimedByPage('j'), true)
    assert.equal(isClaimedByPage('mod+z'), true)
    assert.equal(isClaimedByPage('k'), false)
})
