import { keyLabel } from './keys.js'

export function createChords({ config, root, navigate, hints = null }) {
    const chords = config.chords
    const items = chords?.items ?? []
    const map = new Map(items.map((item) => [item.letter, item]))
    const pill = root.querySelector('[data-ks-pill]')
    const pillKeys = root.querySelector('[data-ks-pill-keys]')
    let timer = null
    let hideTimer = null
    let typed = ''

    function renderPill() {
        pillKeys.replaceChildren(
            ...[chords.prefix, ...typed].map((token) => {
                const kbd = document.createElement('kbd')
                kbd.className = 'ks-kbd'
                kbd.textContent = keyLabel(token, config.i18n.keys)

                return kbd
            }),
        )
    }

    function cancel() {
        clearTimeout(timer)
        clearTimeout(hideTimer)
        timer = null
        typed = ''
        hints?.hide()
        pill.dataset.ksState = 'leaving'
        hideTimer = setTimeout(() => {
            if (timer === null) {
                pill.hidden = true
            }
        }, 120)
    }

    function go(item) {
        cancel()
        navigate(item.url, item.newTab)
    }

    function wait() {
        clearTimeout(timer)
        timer = setTimeout(() => {
            const item = map.get(typed)

            item ? go(item) : cancel()
        }, chords.timeout)
    }

    function start() {
        clearTimeout(hideTimer)
        typed = ''
        renderPill()
        pill.hidden = false
        pill.dataset.ksState = 'entering'
        requestAnimationFrame(() => (pill.dataset.ksState = 'open'))

        if (chords.hints) {
            hints?.show(items, typed)
        }

        wait()
    }

    function resolve(combo) {
        if (combo === 'enter' && map.has(typed)) {
            go(map.get(typed))

            return true
        }

        const next = typed + combo
        const exact = /^[a-z0-9]$/.test(combo) ? map.get(next) : undefined
        const hasLonger = /^[a-z0-9]$/.test(combo) && items.some((item) => item.letter.length > next.length && item.letter.startsWith(next))

        if (!hasLonger) {
            exact ? go(exact) : cancel()

            return Boolean(exact)
        }

        typed = next
        renderPill()

        if (chords.hints) {
            hints?.show(items, typed)
        }

        wait()

        return true
    }

    return {
        get isWaiting() {
            return timer !== null
        },

        get typed() {
            return typed
        },

        isPrefix(combo) {
            return Boolean(chords) && map.size > 0 && combo === chords.prefix
        },

        start,

        cancel,

        resolve,
    }
}
