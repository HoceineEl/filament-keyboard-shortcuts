import { chordItems, i18n, makeConfig, mount, rootHtml, sidebarHtml } from './setup.js'
import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createChords } from '../../resources/js/chords.js'
import { createHints, decorateNavigation, navigationLinks, sequenceLabel } from '../../resources/js/hints.js'
import { setPlatform } from '../../resources/js/keys.js'

let visits

function setup(config = makeConfig()) {
    mount(rootHtml(config), sidebarHtml())
    visits = []

    const root = document.querySelector('[data-ks-root]')
    const hints = createHints(root)
    const chords = createChords({ config, root, hints, navigate: (url, newTab) => visits.push([url, newTab]) })

    return { root, hints, chords, pill: root.querySelector('[data-ks-pill]') }
}

const pillText = (pill) => [...pill.querySelectorAll('kbd')].map((kbd) => kbd.textContent).join(' ')

beforeEach(() => setPlatform(false))

test('the prefix starts a chord only when there are items', () => {
    assert.equal(setup().chords.isPrefix('g'), true)
    assert.equal(setup().chords.isPrefix('h'), false)
    assert.equal(setup(makeConfig({ chords: { prefix: 'g', timeout: 1200, hints: true, items: [] } })).chords.isPrefix('g'), false)
    assert.equal(setup(makeConfig({ chords: null })).chords.isPrefix('g'), false)
})

test('a single letter navigates right away', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const { chords, pill } = setup()

    chords.start()
    assert.equal(chords.isWaiting, true)
    assert.equal(pill.hidden, false)
    assert.equal(pillText(pill), 'G')

    assert.equal(chords.resolve('o'), true)
    assert.deepEqual(visits, [['/admin/orders', false]])
    assert.equal(chords.isWaiting, false)

    t.mock.timers.tick(120)
    assert.equal(pill.hidden, true)
})

test('an unknown letter cancels without navigating', () => {
    const { chords } = setup()

    chords.start()

    assert.equal(chords.resolve('z'), false)
    assert.equal(chords.resolve('mod+s'), false)
    assert.deepEqual(visits, [])
    assert.equal(chords.isWaiting, false)
})

test('the chord times out after the configured delay', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const { chords } = setup()

    chords.start()
    t.mock.timers.tick(1199)
    assert.equal(chords.isWaiting, true)

    t.mock.timers.tick(1)
    assert.equal(chords.isWaiting, false)
    assert.deepEqual(visits, [])
})

test('two-letter chords wait for the second letter', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const { chords, pill } = setup()

    chords.start()
    assert.equal(chords.resolve('c'), true)
    assert.equal(chords.isWaiting, true)
    assert.equal(chords.typed, 'c')
    assert.equal(pillText(pill), 'G C')
    assert.deepEqual(visits, [])

    assert.equal(chords.resolve('u'), true)
    assert.deepEqual(visits, [['/admin/customer-users', false]])
})

test('an ambiguous prefix opens its own item on timeout or enter', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const { chords } = setup()

    chords.start()
    chords.resolve('c')
    t.mock.timers.tick(1200)
    assert.deepEqual(visits, [['/admin/customers', false]])

    chords.start()
    chords.resolve('c')
    assert.equal(chords.resolve('enter'), true)
    assert.equal(visits.length, 2)
})

test('a second letter restarts the timeout', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const { chords } = setup()

    chords.start()
    t.mock.timers.tick(1000)
    chords.resolve('d')
    t.mock.timers.tick(1000)
    assert.equal(chords.isWaiting, true)

    chords.resolve('s')
    assert.deepEqual(visits, [['https://filamentphp.com', true]])
})

test('cancel hides the pill and the hints', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const { chords, pill, root } = setup()

    chords.start()
    assert.equal(root.querySelector('[data-ks-hints]').hidden, false)

    chords.cancel()
    t.mock.timers.tick(120)

    assert.equal(pill.hidden, true)
    assert.equal(root.querySelector('[data-ks-hints]').hidden, true)
    assert.equal(root.querySelectorAll('.ks-hint').length, 0)
})

test('hints show one badge per matching navigation link', () => {
    const { chords, hints } = setup()

    chords.start()

    assert.deepEqual(
        hints.badges.map((badge) => badge.dataset.ksHint),
        ['d', 'c', 'cu', 'o', 'ds'],
    )

    chords.resolve('c')

    assert.deepEqual(
        hints.badges.filter((badge) => !badge.hasAttribute('data-ks-filtered')).map((badge) => badge.textContent),
        ['C', 'CU'],
    )
    assert.deepEqual(
        [...hints.badges[2].children].map((span) => span.hasAttribute('data-ks-typed')),
        [true, false],
    )
})

test('hints stay off when disabled', () => {
    const { chords, root } = setup(makeConfig({ chords: { prefix: 'g', timeout: 1200, hints: false, items: chordItems } }))

    chords.start()

    assert.equal(root.querySelector('[data-ks-hints]').hidden, true)
})

test('hints place badges inside expanded items and beside collapsed ones', async () => {
    const { chords, hints } = setup()
    const anchors = document.querySelectorAll('.fi-sidebar-item-btn')

    anchors.forEach((anchor, index) => {
        anchor.getBoundingClientRect = () => ({ top: 100 + index * 40, bottom: 136 + index * 40, left: 16, right: 256, width: 240, height: 36 })
    })
    anchors[1].querySelector('.fi-sidebar-item-label').hidden = true
    document.querySelector('.fi-sidebar-nav').getBoundingClientRect = () => ({ top: 64, bottom: 800, left: 0, right: 272, width: 272, height: 736 })

    chords.start()
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await new Promise((resolve) => requestAnimationFrame(resolve))

    const [dashboard, customers] = hints.badges

    assert.equal(dashboard.hidden, false)
    assert.equal(dashboard.style.insetBlockStart, '118px')
    assert.equal(dashboard.style.insetInlineEnd, `${window.innerWidth - 248}px`)
    assert.equal(customers.hasAttribute('data-ks-outside'), true)
    assert.equal(customers.style.insetInlineStart, '260px')
})

test('navigationLinks matches sidebar links by url', () => {
    setup()

    assert.deepEqual(
        navigationLinks(chordItems).map(({ item }) => item.letter),
        ['d', 'c', 'cu', 'o', 'ds'],
    )
})

test('decorateNavigation adds the chord to titles and descriptions', () => {
    setup()
    document.querySelector('[href="/admin/orders"]').setAttribute('title', 'Mine')
    document.querySelector('[href="/admin"]').setAttribute('x-tooltip.html', 'tooltip')

    decorateNavigation(chordItems, 'g', i18n)

    const customers = document.querySelector('[href="/admin/customer-users"]')

    assert.equal(customers.getAttribute('title'), 'Shortcut: G then C then U')
    assert.equal(customers.getAttribute('aria-description'), 'Shortcut: G then C then U')
    assert.equal(document.querySelector('[href="/admin/orders"]').getAttribute('title'), 'Mine')
    assert.equal(document.querySelector('[href="/admin"]').hasAttribute('title'), false)
    assert.equal(document.querySelector('[href="/admin"]').getAttribute('aria-description'), 'Shortcut: G then D')
})

test('sequenceLabel joins translated keys', () => {
    assert.equal(sequenceLabel('g', 'cu', { ...i18n, then: 'ثم' }), 'G ثم C ثم U')
})
