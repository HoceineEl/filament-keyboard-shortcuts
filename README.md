<p class="filament-hidden"><img src="https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/cover.jpg" alt="Keyboard Shortcuts"></p>

# Keyboard Shortcuts for Filament

A keyboard layer for Filament 4 and 5 panels. It adds a `?` cheat sheet that lists every shortcut that works on the page in front of you, Gmail-style `g` navigation chords for every item in your sidebar, hint badges that show those letters while you type, and Vim-style keys for Filament tables.

Nothing in the sheet is hardcoded. It is built from three sources at runtime:

1. your panel navigation (every resource, page and custom navigation item gets a chord);
2. the actions already on the page that use Filament's `->keyBindings()`, plus any element that announces a key with a `data-keyboard-shortcut` attribute;
3. the shortcuts you register on the plugin.

![The shortcuts sheet listing general, navigation, page action, table and custom shortcuts](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/sheet.png)

## Why

Filament already lets you put `->keyBindings()` on actions, but users have no way to find out which keys exist, and there is no keyboard path to move between resources or through table rows. Power users of admin panels (support agents, editors, back-office staff) spend their whole day in the same few screens; a discoverable keyboard layer saves them a mouse trip on every action.

This plugin adds that layer without asking you to describe it twice. Register the plugin and the shortcuts you already have become discoverable, every navigation item becomes reachable in two key presses, and every table becomes navigable with `j` and `k`.

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Default shortcuts](#default-shortcuts)
- [The shortcuts sheet](#the-shortcuts-sheet)
- [Navigation chords](#navigation-chords)
  - [Hint mode](#hint-mode)
  - [How letters are assigned](#how-letters-are-assigned)
  - [Pinning a letter on a resource or page](#pinning-a-letter-on-a-resource-or-page)
  - [Overriding letters from the plugin](#overriding-letters-from-the-plugin)
- [Table navigation](#table-navigation)
- [Page actions and auto-discovery](#page-actions-and-auto-discovery)
  - [Filament `->keyBindings()`](#filament-keybindings)
  - [The `data-keyboard-shortcut` attribute (for other plugins)](#the-data-keyboard-shortcut-attribute-for-other-plugins)
- [Custom shortcuts](#custom-shortcuts)
  - [The `Shortcut` class](#the-shortcut-class)
  - [Groups and the `ShortcutGroup` enum](#groups-and-the-shortcutgroup-enum)
- [The open-sheet button](#the-open-sheet-button)
- [Configuration reference](#configuration-reference)
- [Key syntax](#key-syntax)
- [Platform key labels](#platform-key-labels)
- [How key presses are handled](#how-key-presses-are-handled)
- [Accessibility](#accessibility)
- [Right-to-left layouts](#right-to-left-layouts)
- [Translations](#translations)
- [Theming](#theming)
- [Multiple panels](#multiple-panels)
- [FAQ and troubleshooting](#faq-and-troubleshooting)
- [Testing](#testing)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [Security](#security)
- [Credits](#credits)
- [License](#license)

## Features

- **Shortcuts sheet** on `?` or `mod+/` (`⌘/` on macOS, `Ctrl+/` elsewhere). Searchable by label or by key, grouped into sections, laid out in two balanced columns, and limited to what works on the current page.
- **Navigation chords**: `g` then a letter opens any navigation item. Letters are assigned automatically and stay stable between requests. Large panels fall back to two-letter chords (`g` `c` `u`) before digits.
- **Hint mode**: while the plugin waits for the letter after `g`, every sidebar item shows its letter as a badge, and a pill at the bottom of the screen reads "G then a letter".
- **Table navigation**: `j` / `k` to move between rows, `Enter` or `o` to open, `x` to select, `shift+x` to select the page, `[` / `]` to change page, `f` to open filters.
- **Auto-discovery** of every Filament action with `->keyBindings()` on the page, and of any element carrying a `data-keyboard-shortcut` attribute, so other packages can list their keys in the sheet.
- **Custom shortcuts** that open a URL, dispatch a Livewire event or run an Alpine expression.
- **`/` focuses search**: the global search field, or the table search when the panel has no global search.
- **Platform-aware labels**: `⌘ ⇧ ⌥` on macOS, `Ctrl Shift Alt` elsewhere, translated per locale (`Strg`, `Maj`…).
- **Safe by default**: never fires while you type in a field, never steals Filament's `mod+k`, browser-reserved combinations are rejected at registration, and a page action that uses the same key always wins.
- Light and dark mode, right-to-left layouts, 23 languages, reduced motion, SPA mode.
- One dependency-free script and one stylesheet, registered through Filament's asset manager. No build step in your app.

## Requirements

| Dependency | Version |
| --- | --- |
| PHP | 8.3 or later |
| Laravel | 12 or 13 (11 is allowed by the constraints but not tested in CI) |
| Filament | 4.x or 5.x |
| Livewire | 3 or 4, whichever your Filament version uses |

CI runs PHP 8.3, 8.4 and 8.5 against Laravel 12 and 13 and Filament 4 and 5.

## Installation

Install the package with Composer:

```bash
composer require hoceineel/filament-keyboard-shortcuts
```

Publish the compiled script and stylesheet into `public/`:

```bash
php artisan filament:assets
```

If your `composer.json` already runs `@php artisan filament:upgrade` in `post-autoload-dump` (the Filament installer adds it), assets are republished on every `composer update` and you only need the second command once.

The package does not need a config file, migrations or a theme. It does not use Tailwind classes, so you do not have to add it to a custom theme's sources.

## Quick start

Register the plugin on a panel:

```php
use HoceineEl\KeyboardShortcuts\KeyboardShortcutsPlugin;

public function panel(Panel $panel): Panel
{
    return $panel
        // ...
        ->plugin(KeyboardShortcutsPlugin::make());
}
```

Open any page of the panel and press `?`. You now have:

- the sheet on `?` and `mod+/`;
- `g` chords for every navigation item, with hint badges;
- `j` / `k` and the other table keys on every list page;
- `/` to jump to search;
- a keyboard button inside the global search field.

Everything is on by default. Each feature can be turned off or reconfigured; see the [configuration reference](#configuration-reference).

## Default shortcuts

### General

| Keys | Action |
| --- | --- |
| `?` or `mod+/` | Open the shortcuts sheet. |
| `/` | Focus the global search field, or the table search field when there is no global search. |
| `Esc` | Close the sheet, cancel a pending chord, or let Filament close its own dialog or menu. |
| `mod+k` | Filament's global search binding. Left untouched. |

### Navigation chords

| Keys | Action |
| --- | --- |
| `g` then a letter | Open the navigation item with that letter (`g` `c` for Customers, `g` `o` for Orders…). |
| `g` then two letters | Open an item with a two-letter chord on large panels (`g` `c` `u`). |
| `Enter` while waiting | Open the item matching what you typed so far, without waiting for the timeout. |
| `Esc` while waiting | Cancel the chord and hide the hints. |

The letters depend on your navigation; the sheet always shows the current assignment. See [how letters are assigned](#how-letters-are-assigned).

### Table keys

| Keys | Action |
| --- | --- |
| `j` | Next row. The first press activates the first row. |
| `k` | Previous row. |
| `Enter` or `o` | Open the active row: its record URL or its record action. |
| `x` | Toggle the active row's checkbox. |
| `shift+x` | Toggle every row on the current page. |
| `[` | Previous page. |
| `]` | Next page. |
| `f` | Open the filters (dropdown, modal or collapsible layout). |

### Page actions

Whatever the current page binds. On a list page with an export header action using `->keyBindings(['mod+shift+e'])`, the sheet shows "Export customers `⌘ ⇧ E`". See [page actions and auto-discovery](#page-actions-and-auto-discovery).

### Your shortcuts

Anything registered with [`->shortcuts()`](#custom-shortcuts), in the group you choose.

## The shortcuts sheet

The sheet is a dialog rendered once at the end of the panel body and filled when it opens, so it only lists what works on the page you are on:

| Section | Source | Shown when |
| --- | --- | --- |
| General | Open the sheet, focus search, close dialogs. | Always. "Search" is omitted when `searchKeyBindings([])`. |
| Navigation | One row per navigation item that has a chord, grouped under its navigation group. | Navigation chords are on and at least one item has a chord. |
| Page actions | Discovered from the DOM each time the sheet opens. | At least one binding is found on the page. |
| Table | The table keys listed above. | Table navigation is on and the page has a Filament table. |
| Your groups | Shortcuts from `->shortcuts()`, grouped by `->group()`. | At least one visible shortcut is in the group. |

Sections flow into two balanced columns on wide screens and one column on phones. A footer reminds users how to open and close the sheet.

| Dark mode | Right to left (Arabic) |
| --- | --- |
| ![The sheet in dark mode](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/sheet-dark.png) | ![The sheet in Arabic, mirrored right to left](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/sheet-rtl.png) |

### Searching

The search field has focus as soon as the sheet opens. Type to filter rows across every section:

- words match row labels and navigation group names (`customers` finds the Customers chord and the "Export customers" action);
- key names match the keys of a row (`shift`, `esc`, `g`); `ctrl`, `cmd`, `command` and `⌘` all match `mod`, `option` and `⌥` match `alt`, `⇧` matches `shift`;
- a combination such as `shift+x` or `g+c` matches rows that use all of those keys, not labels that happen to contain the letters;
- several words narrow the results (all must match).

Sections and navigation groups with no match are hidden. When nothing matches, an empty state suggests searching by action or key and offers a "Clear search" button. The dialog keeps its height while you type, so results do not jump.

![Searching the sheet for "customers" shows the navigation chord and the page action](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/sheet-search.png)

`Esc` clears a non-empty search; a second `Esc` closes the sheet. Clicking the scrim or the close button also closes it. Focus returns to the element that had it before the sheet opened.

## Navigation chords

Press `g`, release it, then press a letter. The plugin waits 1.2 seconds (`KeyboardShortcutsPlugin::CHORD_TIMEOUT`, in milliseconds) for each next key. When the sequence matches an item, the plugin navigates to it:

- with `Livewire.navigate()` when the panel uses SPA mode (`$panel->spa()`);
- with a normal page load otherwise;
- in a new tab when the navigation item is set to open in a new tab (`->url($url, shouldOpenInNewTab: true)`).

Chords are built from `Filament::getCurrentPanel()->getNavigation()`, so they cover resources, pages, custom `NavigationItem`s and child items, and they respect each item's visibility and authorization. Items without a URL and hidden items are skipped.

### Hint mode

While the plugin waits for the next key, a pill at the bottom of the screen shows the keys typed so far followed by "then a letter", and every sidebar item shows its letter as a small badge, Vimium style. Nobody has to memorise the letters.

![Hint badges next to each sidebar item after pressing g, and the "G then a letter" pill](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/hints.png)

- Badges sit at the inline end of each item, before its count badge if it has one.
- With a collapsed sidebar, badges sit beside the icons.
- On large panels, badges narrow down as you type a two-letter chord: after `g` `p`, only the items starting with `p` keep their badges and the typed letter is dimmed.
- Topbar navigation links (`$panel->topNavigation()`) get badges too.
- Badges disappear when the chord completes, times out or is cancelled with `Esc`.
- Badges follow dark mode and right-to-left layouts, and only fade under `prefers-reduced-motion`.

| Collapsed sidebar, dark mode | Two-letter chords on a large panel |
| --- | --- |
| ![Hint badges beside the icons of a collapsed sidebar in dark mode](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/hints-collapsed-dark.png) | ![A crowded sidebar where later items have two-letter badges such as PL and RL](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/hints-two-letter.png) |

Hint mode also decorates every sidebar link that has a chord with an accessible description (`aria-description="Shortcut: G then C"`), and with the same text as `title` unless Filament already shows a tooltip for that link (collapsed sidebar). Turn badges and descriptions off with `->navigationHints(false)`; the chords keep working.

### How letters are assigned

Letters are assigned on the server, in navigation order, by `HoceineEl\KeyboardShortcuts\Support\ChordAssigner`. Every item gets the first free candidate from this list:

1. **Plugin override**, from [`->chordOverrides()`](#overriding-letters-from-the-plugin). Applied first, so it always wins.
2. **Pinned letter**, from the resource or page class ([`$keyboardShortcut`](#pinning-a-letter-on-a-resource-or-page)). Ignored if another item already took it.
3. **First letter of each word** of the label: `Customers` gets `c`; `Customer groups` gets `g` when `c` is taken.
4. **Any other letter** of the label, then of the aliases: the resource or page class name without its `Resource` / `Page` suffix (`CustomerResource` gives `customer`), and the last segment of the item's URL (`/admin/customer-groups` gives `customer groups`).
5. **Two letters**, once every single letter is taken: word initials first (`Customer users` gives `cu`), then the first letter of a word followed by any later letter (`Orders` gives `or`, `od`…).
6. **Digits** `1` to `9`, then `0`.
7. **No chord**: the item stays reachable with the mouse but does not appear in the Navigation section.

Some consequences:

- The assignment depends only on the navigation, so it is the same on every request and every page.
- Automatic letters are taken in navigation order, so appending an item never changes the automatic letters of the items above it.
- Labels are transliterated to ASCII and non-Latin text is ignored, so a label like `العملاء` on `CustomerResource` still gets `c` from the class name, and `Café` gets `c`.
- The chord prefix itself is a valid letter: an item can be `g` `g`.

When a single-letter chord is also the start of a two-letter chord (`c` and `cu`), `g` `c` waits for the next key. If none comes, the single-letter item opens after the timeout; press `Enter` to open it straight away.

### Pinning a letter on a resource or page

Give a resource or page a fixed letter, so it never moves when navigation changes:

```php
use Filament\Resources\Resource;

class CustomerResource extends Resource
{
    protected static ?string $keyboardShortcut = 'c';
}
```

Or compute it with a public static method, which wins over the property:

```php
use Filament\Pages\Page;

class Reports extends Page
{
    public static function getKeyboardShortcut(): ?string
    {
        return 'rp';
    }
}
```

Both are read with reflection: the property may be `protected`, and classes that have neither are ignored. The value must be one or two characters from `a`–`z` and `0`–`9` (case-insensitive); anything else throws an `InvalidArgumentException` that names the class. A pinned letter that is already taken by an override or an earlier pinned item is ignored, and the item falls back to automatic assignment.

### Overriding letters from the plugin

Override letters without touching the classes, for example for resources that come from another package:

```php
use App\Filament\Resources\CustomerResource;
use HoceineEl\KeyboardShortcuts\KeyboardShortcutsPlugin;

KeyboardShortcutsPlugin::make()
    ->chordOverrides([
        CustomerResource::class => 'c',
        'Dashboard' => 'h',
        'invoices' => 'iv',
    ]);
```

Each key is matched against, in order:

- the navigation item key: the class name for resources and pages, the `->key()` you set, or the label for custom `NavigationItem`s;
- the label, then the aliases (class base name, URL slug), case-insensitively.

Overrides that match nothing are ignored. Values follow the same rule as pinned letters (one or two of `a`–`z`, `0`–`9`), and an invalid value throws an `InvalidArgumentException`.

To use another prefix than `g`:

```php
KeyboardShortcutsPlugin::make()->navigationChordPrefix('space');
```

The prefix must be a single key without modifiers (`'shift+g'` throws).

## Table navigation

On any page with a Filament table, the table keys work without configuration.

![The active row highlighted with a tinted background and a primary focus ring](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/table.png)

- The plugin works with the table that contains focus, then the one with an active row, then the first visible table on the page. Tables inside modals are ignored.
- The active row gets a tinted background and an inset primary ring, and scrolls into view.
- The active row survives Livewire re-renders, for example after an action or a poll: the plugin remembers its `wire:key` (or record key) and restores the highlight after each update while the row is still on the page.
- `Enter` and `o` click the row's record link or record action. `Enter` on a focused link or button is left alone, so it keeps activating that element.
- `x` clicks the row's checkbox and `shift+x` the page checkbox, so bulk actions and selection counters update as usual. Tables without bulk actions have no checkboxes and these keys do nothing.
- `[` and `]` click the pagination's previous and next buttons.
- `f` opens the filters whatever their layout: dropdown, modal or collapsible.
- Grid and stacked layouts (`.fi-ta-record`) work as well as standard rows; group header rows are skipped.

Turn table keys off with `->tableNavigation(false)`. The Table section then disappears from the sheet.

## Page actions and auto-discovery

Every time the sheet opens, it scans the page and fills the Page actions section. Two sources are read.

![The Page actions section listing a header action and a key announced with a data attribute](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/page-actions.png)

### Filament `->keyBindings()`

Any Filament action with key bindings is listed automatically, whether it is a header action, a table action, a form action or an action rendered by another plugin:

```php
use Filament\Actions\Action;

protected function getHeaderActions(): array
{
    return [
        Action::make('export')
            ->label('Export customers')
            ->keyBindings(['mod+shift+e'])
            ->action(fn () => $this->export()),
    ];
}
```

Filament renders such actions with an `x-mousetrap.global.*` attribute. The plugin reads those attributes, decodes the keys, and labels the row with the element's `aria-label`, then its `<label>`, then its visible text, then its `title`; elements with none of those get "Unnamed action". Only elements that are currently rendered (not `display: none`) are listed, and keys used by several elements are listed once.

The plugin never runs these actions itself: Filament does. Because the plugin checks the same markup before handling a key, an action that binds `j`, `/` or `?` takes precedence over the plugin's own use of that key.

### The `data-keyboard-shortcut` attribute (for other plugins)

Packages and custom Blade views that handle keys themselves can announce them in the sheet with two attributes:

```html
<div
    hidden
    data-keyboard-shortcut="mod+z"
    data-keyboard-shortcut-label="Undo last action"
></div>
```

- `data-keyboard-shortcut` holds one or more bindings separated by spaces (`"mod+z ctrl+y"`). They are normalised with the [key syntax](#key-syntax), so `Cmd+Shift+Z` and `mod+shift+z` are the same.
- `data-keyboard-shortcut-label` is the row label. Without it, the row is labelled "Unnamed action".
- Unlike `x-mousetrap` elements, these elements are listed **even when hidden**, so a package can render a single invisible marker.
- The attribute is declarative only: the plugin lists the binding but does not run anything. Your package keeps handling the key. The plugin also treats the key as claimed by the page and will not use it for itself.
- If a key is already listed from an `x-mousetrap` element, the `data-keyboard-shortcut` entry for that key is skipped.

From PHP, a render hook is the simplest way to add a marker to one page:

```php
use Filament\View\PanelsRenderHook;

$panel->renderHook(
    PanelsRenderHook::PAGE_END,
    fn (): string => '<span hidden data-keyboard-shortcut="mod+z" data-keyboard-shortcut-label="Undo last action"></span>',
    scopes: ListCustomers::class,
);
```

## Custom shortcuts

Register your own shortcuts with `->shortcuts()`. Each one needs keys, a behaviour (`url()`, `dispatch()` or `js()`) and usually a label:

```php
use App\Filament\Resources\InvoiceResource;
use HoceineEl\KeyboardShortcuts\KeyboardShortcutsPlugin;
use HoceineEl\KeyboardShortcuts\Shortcut;

KeyboardShortcutsPlugin::make()
    ->shortcuts([
        Shortcut::make('mod+alt+n')
            ->label('New invoice')
            ->group('Billing')
            ->url(fn (): string => InvoiceResource::getUrl('create')),

        Shortcut::make('mod+shift+e')
            ->label('Export')
            ->group('Billing')
            ->dispatch('export-requested', ['format' => 'csv']),

        Shortcut::make('mod+b')
            ->label('Toggle sidebar')
            ->js('$store.sidebar.isOpen ? $store.sidebar.close() : $store.sidebar.open()'),

        Shortcut::make(['mod+alt+h', 'f1'])
            ->label('Help centre')
            ->url('https://help.example.com', shouldOpenInNewTab: true)
            ->visible(fn (): bool => auth()->user()->isStaff()),
    ]);
```

`->shortcuts()` can be called several times; each call appends. It also accepts a closure returning an array, evaluated on every request:

```php
KeyboardShortcutsPlugin::make()
    ->shortcuts(fn (): array => auth()->user()?->isAdmin()
        ? [Shortcut::make('mod+alt+u')->label('Users')->url(UserResource::getUrl())]
        : []);
```

Custom shortcuts work anywhere in the panel except while the user is typing in a field (see [typing safety](#how-key-presses-are-handled)). If a page action uses the same key, the page action wins on that page.

### The `Shortcut` class

| Method | Description |
| --- | --- |
| `Shortcut::make(string\|array $keys)` | One binding or a list of alternative bindings. Each binding is validated and normalised; reserved combinations throw an `InvalidArgumentException`. |
| `label(string\|Closure\|null $label)` | Text shown in the sheet. Defaults to the keys joined with commas. |
| `group(string\|ShortcutGroup\|Closure\|null $group)` | Section in the sheet. Defaults to `ShortcutGroup::Custom` ("More shortcuts"). |
| `url(string\|Closure\|null $url, bool\|Closure $shouldOpenInNewTab = false)` | Navigate to a URL. Uses `Livewire.navigate()` in SPA mode, a normal page load otherwise, or `window.open()` in a new tab. |
| `dispatch(string $event, array\|Closure $payload = [])` | Call `Livewire.dispatch($event, $payload)`. Listen with `#[On('export-requested')]` on any Livewire component on the page. |
| `js(string $expression)` | Evaluate an Alpine expression against the plugin's root element, so `$store`, `$dispatch` and other magics are available. |
| `visible(bool\|Closure $condition = true)` | Show the shortcut only when the condition is true. |
| `hidden(bool\|Closure $condition = true)` | The inverse of `visible()`. |

Getters: `getKeys()`, `getLabel()`, `getGroup()` (the resolved label), `getBehavior()` (a `ShortcutBehavior` case: `Url`, `Dispatch` or `Js`), `getUrl()`, `shouldOpenUrlInNewTab()`, `isVisible()` and `toArray()`.

Notes:

- Calling `url()`, `dispatch()` or `js()` sets the behaviour; the last call wins.
- A shortcut without a behaviour throws a `LogicException` when the panel renders, naming its keys.
- Closures are evaluated when the page renders, with Filament's closure evaluation, so they can use `auth()`, the current panel or injected services.
- `js()` is trusted developer input that runs in the user's browser. Never build it from user data.
- Hidden shortcuts are left out of both the sheet and the client configuration.

### Groups and the `ShortcutGroup` enum

`HoceineEl\KeyboardShortcuts\Enums\ShortcutGroup` lists the built-in sections. Each case implements Filament's `HasLabel` and returns a translated label:

| Case | Label (English) |
| --- | --- |
| `ShortcutGroup::General` | General |
| `ShortcutGroup::Navigation` | Navigation |
| `ShortcutGroup::PageActions` | Page actions |
| `ShortcutGroup::Table` | Table |
| `ShortcutGroup::Custom` | More shortcuts |

Pass a case to add rows to a built-in section, or any string to create your own section:

```php
use HoceineEl\KeyboardShortcuts\Enums\ShortcutGroup;

Shortcut::make('mod+alt+d')
    ->label('Recent drafts')
    ->group(ShortcutGroup::Navigation)
    ->url(fn (): string => PostResource::getUrl('index', ['tableFilters[status][value]' => 'draft']));
```

Groups are matched by their label, so a string equal to a built-in label in the current locale also lands in that section; prefer the enum, which follows the locale. Your own groups appear after the built-in sections in the order you register them, and "More shortcuts" always comes last. Rows added to the Table section are only shown on pages with a table.

## The open-sheet button

A keyboard icon button opens the sheet for mouse and touch users. Its tooltip names the first sheet binding ("Keyboard shortcuts (?)").

It is placed with Filament render hooks, in this order of preference:

1. **Inside the global search field** (`PanelsRenderHook::GLOBAL_SEARCH_END`), wherever the panel puts global search: the topbar, or the sidebar when the panel has no topbar or uses `GlobalSearchPosition::Sidebar`.
2. **At the end of the topbar** (`PanelsRenderHook::TOPBAR_END`) when global search is disabled.
3. **In the sidebar footer** (`PanelsRenderHook::SIDEBAR_FOOTER`) when the panel has neither global search nor a topbar.

| Beside global search in the topbar | Beside global search in the sidebar |
| --- | --- |
| ![The keyboard button next to the topbar search field, with its tooltip](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/button-topbar.png) | ![The keyboard button next to the search field at the top of the sidebar](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/button-sidebar.png) |

The button is hidden below 1024px, where Filament collapses the layout. Hide it everywhere, or conditionally:

```php
KeyboardShortcutsPlugin::make()->topbarButton(false);

KeyboardShortcutsPlugin::make()->topbarButton(fn (): bool => auth()->user()->prefersKeyboard());
```

Replace its icon through Filament's icon registry with the `keyboard-shortcuts::topbar-button` alias, for example in a service provider's `boot()`:

```php
use Filament\Support\Facades\FilamentIcon;
use Filament\Support\Icons\Heroicon;

FilamentIcon::register([
    'keyboard-shortcuts::topbar-button' => Heroicon::OutlinedCommandLine,
]);
```

Any element with a `data-ks-open` attribute also opens the sheet when clicked, so you can add your own trigger, for example in a user menu or a help page:

```blade
<x-filament::button data-ks-open>Keyboard shortcuts</x-filament::button>
```

## Configuration reference

Every method returns the plugin, so calls chain. All defaults are shown.

```php
use HoceineEl\KeyboardShortcuts\KeyboardShortcutsPlugin;

KeyboardShortcutsPlugin::make()
    ->sheetKeyBindings(['?', 'mod+/'])
    ->searchKeyBindings(['/'])
    ->navigationChords(true)
    ->navigationChordPrefix('g')
    ->chordOverrides([])
    ->navigationHints(true)
    ->tableNavigation(true)
    ->topbarButton(true)
    ->shortcuts([]);
```

| Method | Type | Default | Description |
| --- | --- | --- | --- |
| `sheetKeyBindings(array $keyBindings)` | `list<string>` | `['?', 'mod+/']` | Bindings that open the sheet. `[]` leaves only the button. Bindings that start with `mod+` also work while typing in a field. |
| `searchKeyBindings(array $keyBindings)` | `list<string>` | `['/']` | Bindings that focus search. `[]` disables it and removes the row from the sheet. |
| `navigationChords(bool\|Closure $condition = true)` | `bool\|Closure` | `true` | Turn `g` chords (and their sheet section and hints) on or off. |
| `navigationChordPrefix(string $key)` | `string` | `'g'` | The key that starts a chord. A single key without modifiers. |
| `chordOverrides(array $overrides)` | `array<string, string>` | `[]` | Fixed letters keyed by navigation item key, class name, label or slug. Replaces previous overrides. |
| `navigationHints(bool\|Closure $condition = true)` | `bool\|Closure` | `true` | Hint badges while a chord waits, and `aria-description` / `title` on sidebar links. |
| `tableNavigation(bool\|Closure $condition = true)` | `bool\|Closure` | `true` | Table keys and the Table section of the sheet. |
| `topbarButton(bool\|Closure $condition = true)` | `bool\|Closure` | `true` | The [open-sheet button](#the-open-sheet-button), wherever it renders. |
| `shortcuts(array\|Closure $shortcuts)` | `array<Shortcut>\|Closure` | none | Append [custom shortcuts](#custom-shortcuts). Can be called more than once. |

Closures are evaluated on every request, so features can depend on the user:

```php
KeyboardShortcutsPlugin::make()
    ->navigationHints(fn (): bool => ! auth()->user()->settings['hide_shortcut_hints'])
    ->tableNavigation(fn (): bool => auth()->user()->can('use-keyboard-tables'));
```

Other public API:

| Member | Description |
| --- | --- |
| `KeyboardShortcutsPlugin::make()` | Create an instance through the container. |
| `KeyboardShortcutsPlugin::get()` | The instance registered on the current panel. |
| `getId()` | `'keyboard-shortcuts'`. |
| `KeyboardShortcutsPlugin::CHORD_TIMEOUT` | `1200`: milliseconds a chord waits for its next key. |
| `getSheetKeyBindings()`, `getSearchKeyBindings()`, `getNavigationChordPrefix()`, `getChordOverrides()` | Read back the configuration (bindings are normalised). |
| `hasNavigationChords()`, `hasNavigationHints()`, `hasTableNavigation()`, `hasTopbarButton()` | The evaluated feature flags. |
| `getShortcuts()` | Visible custom shortcuts, closures evaluated. |
| `getNavigationChords()` | A list of `NavigationChord` objects (`key`, `label`, `group`, `letter`, `url`, `shouldOpenInNewTab`) for the current panel. Useful to show the letters elsewhere, for example in onboarding. |
| `getSheetSections()` | The sections and rows rendered in the sheet. |
| `getClientConfig()` | The JSON configuration passed to the script. |
| `getTopbarTooltip()` | The button's tooltip text. |

Example: list every chord on a help page.

```php
use HoceineEl\KeyboardShortcuts\KeyboardShortcutsPlugin;

$plugin = KeyboardShortcutsPlugin::get();

foreach ($plugin->getNavigationChords() as $chord) {
    echo $chord->label.': '.$chord->sequence($plugin->getNavigationChordPrefix()).PHP_EOL; // Customers: g c
}
```

## Key syntax

Bindings use the same syntax as Filament's `->keyBindings()`:

- Combine keys with `+`: `mod+shift+e`. Order of modifiers does not matter; `shift+mod+e` is stored as `mod+shift+e`.
- `mod` is `⌘` on macOS and `Ctrl` on Windows and Linux. Use it instead of `ctrl` or `cmd` so the same binding works on both.
- Aliases: `cmd`, `command`, `meta`, `ctrl` and `control` mean `mod`; `option` and `opt` mean `alt`; `esc` means `escape`; `return` means `enter`; `del` means `delete`; `spacebar` means `space`.
- Named keys: `enter`, `escape`, `space`, `tab`, `backspace`, `delete`, `up`, `down`, `left`, `right`, `f1` to `f12`.
- Symbols are written as typed: `?`, `/`, `[`, `]`, `.`, `,`. Do not add `shift` to a symbol: `?` already implies it.
- A literal plus is `+` on its own, or `mod++`.
- Bindings are case-insensitive.

These combinations are reserved and throw an `InvalidArgumentException` naming the binding, whether passed to `Shortcut::make()`, `sheetKeyBindings()` or `searchKeyBindings()`:

| Reserved | Why |
| --- | --- |
| `mod+k` | Filament global search. |
| `mod+l`, `mod+n`, `mod+q`, `mod+r`, `mod+t`, `mod+w`, `mod+tab` | Browser address bar, new window, quit, reload, new tab, close tab, switch tab. |
| `mod+shift+n`, `mod+shift+q`, `mod+shift+r`, `mod+shift+t`, `mod+shift+w`, `mod+shift+tab` | Private window, quit, hard reload, reopen tab, close window, previous tab. |

The panel's own `->globalSearchKeyBindings()` are never intercepted either, whatever they are.

## Platform key labels

Keys are labelled the way the user's keyboard prints them. The plugin detects macOS, iOS and iPadOS from the browser and switches labels on the client:

| Token | macOS | Windows and Linux (English) |
| --- | --- | --- |
| `mod` | `⌘` | `Ctrl` |
| `shift` | `⇧` | `Shift` |
| `alt` | `⌥` | `Alt` |
| `enter` | `return` | `Enter` |
| `escape` | `esc` | `Esc` |
| arrows | `↑ ↓ ← →` | `↑ ↓ ← →` |
| letters | `G` | `G` |

| macOS | Windows and Linux |
| --- | --- |
| ![General section with the Command glyph](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/keys-mac.png) | ![General section with Ctrl](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/keys-windows.png) |

The sheet header says which one applies ("⌘ on this Mac" or "Ctrl on this device"). Non-Mac labels are translated: German shows `Strg`, `Umschalt` and `Eingabe`, French `Maj` and `Suppr`, and so on. Mac glyphs carry an accessible name, so screen readers announce "Command" rather than a symbol.

## How key presses are handled

The script adds one `keydown` listener on `document` and decides, for every key press, whether it is the plugin's to handle:

- **Typing is safe.** Keys are ignored while focus is in an `input`, `textarea`, `select` or `contenteditable` element, so typing `g`, `j` or `?` in a form never navigates. The only exception is a sheet binding that starts with `mod+` (`mod+/` by default), which works everywhere.
- **Filament modals win.** While a Filament modal or slide-over is open, the plugin does nothing. While the sheet is open, only `Esc` and `Tab` (focus trap) are handled.
- **Page actions win.** If an action on the page binds the same key (via `->keyBindings()` or `data-keyboard-shortcut`), the plugin leaves the key to it.
- **Filament and the browser win.** `mod+k`, the panel's global search bindings and the reserved combinations above are never intercepted. `Ctrl` combinations on macOS and `⌘` / Windows-key combinations elsewhere are ignored.
- **No auto-repeat.** Holding a key down does not repeat a shortcut.
- **No IME interference.** Key presses during text composition (Chinese, Japanese, Korean input methods) are ignored.
- **Non-Latin layouts work.** When the layout does not produce a Latin character, letters and digits are read from the physical key position, so chords and table keys work with Arabic, Hebrew, Cyrillic or Greek layouts, and with `alt` on macOS (which otherwise types `©` for `alt+g`).
- **SPA aware.** The script re-initialises after `livewire:navigated` and re-applies hint descriptions and the active table row after each Livewire morph.
- **`/` only takes over when there is a field.** If the page has no visible global search or table search, `/` is passed through.

## Accessibility

- The sheet is a `role="dialog"` labelled by its title. `aria-modal="true"` is set only while the sheet is open, so a closed sheet never makes Filament think a modal is open (which would disable every Filament key binding on the page).
- Opening the sheet moves focus to its search field; `Tab` and `Shift+Tab` stay inside the dialog; closing it returns focus to the element that had it before.
- The search field has a label ("Search shortcuts"), and the list is a set of `<dl>` definition lists with section headings, so screen readers read "Customers, G then C".
- macOS glyphs have accessible names (`⌘` is "Command", `⌥` is "Option", `⇧` is "Shift").
- The chord pill is a polite live region that announces "Waiting for the next key". Hint badges are decorative (`aria-hidden`); the same information is on each sidebar link as `aria-description` ("Shortcut: G then C").
- Every control has a visible focus ring and at least a 44px touch target. The open-sheet button has a label and a tooltip.
- Under `prefers-reduced-motion: reduce`, the sheet, pill and badges only fade, and the active table row scrolls into view without smooth scrolling.
- Letter keys use the panel font, so `O` and `0` never look alike.
- The sheet locks page scroll while open and is excluded from print styles.

## Right-to-left layouts

When the panel locale is right to left (Arabic, Hebrew, Persian), Filament sets `dir="rtl"` and the plugin follows:

- the sheet, its search field, its close button and its columns mirror;
- key combinations stay left to right (`⌘ /`, not `/ ⌘`), as users read them on the keyboard;
- hint badges sit at the inline end of each sidebar item, which is the left side in RTL;
- the chord pill stays centred and its keys stay left to right.

![Hebrew panel in hint mode, with badges on the inline end of each sidebar item](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/hints-rtl.png)

## Translations

The sheet, the chord pill, hint descriptions and key labels ship in 23 languages, using the same locale codes as Filament:

Arabic (`ar`), Chinese Simplified (`zh_CN`), Chinese Traditional (`zh_TW`), Czech (`cs`), Dutch (`nl`), English (`en`), French (`fr`), German (`de`), Hebrew (`he`), Hindi (`hi`), Indonesian (`id`), Italian (`it`), Japanese (`ja`), Korean (`ko`), Persian (`fa`), Polish (`pl`), Portuguese (`pt`), Portuguese, Brazil (`pt_BR`), Russian (`ru`), Spanish (`es`), Turkish (`tr`), Ukrainian (`uk`) and Vietnamese (`vi`).

The application locale is picked up automatically. Wording follows Filament's own translations for each language (Search, Filters, Next page…), and key labels follow what keyboards in that language print.

| German, on Windows | Japanese, on macOS |
| --- | --- |
| ![The sheet in German with Strg and Umschalt key labels](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/sheet-de.png) | ![The sheet in Japanese](https://raw.githubusercontent.com/HoceineEl/filament-keyboard-shortcuts/main/docs/images/sheet-ja.png) |

Navigation labels, page action labels and custom shortcut labels come from your app, so they are translated wherever you translate them.

To change any string, publish the translation files:

```bash
php artisan vendor:publish --tag=keyboard-shortcuts-translations
```

Then edit `lang/vendor/keyboard-shortcuts/{locale}/shortcuts.php`. You only need to keep the keys you change; anything missing falls back to the package. To add a language, create `lang/vendor/keyboard-shortcuts/{locale}/shortcuts.php` with the keys from `en/shortcuts.php`.

The views can be published the same way (`--tag=keyboard-shortcuts-views`), but they are tied to the script's `data-ks-*` hooks; prefer CSS variables and translations for customisation.

## Theming

The sheet, the chord pill, the hint badges and the active row use your panel's `primary` and `gray` palettes and follow its dark mode, so they match any panel colour without configuration.

Override any of these CSS variables on `.ks-root` (and `.dark .ks-root` for dark mode) in your theme or in a stylesheet registered with `FilamentAsset`:

| Variable | Default (light) | Controls |
| --- | --- | --- |
| `--ks-width` | `min(44rem, calc(100vw - 2rem))` | Sheet width. |
| `--ks-max-height` | `80dvh` | Sheet maximum height. |
| `--ks-z` | `50` | `z-index` of the sheet, pill and hints. |
| `--ks-radius` | `0.75rem` | Sheet corner radius. |
| `--ks-surface` | `#fff` | Sheet background. |
| `--ks-surface-muted` | `var(--gray-50)` | Search field, footer and hover backgrounds. |
| `--ks-border` | 8% `gray-950` | Dividers and borders. |
| `--ks-ink` | `var(--gray-950)` | Main text. |
| `--ks-ink-muted` | `var(--gray-500)` | Secondary text ("then", "or", group names). |
| `--ks-key-bg`, `--ks-key-ink`, `--ks-key-edge` | white, `gray-700`, 14% `gray-950` | Key caps. |
| `--ks-ring` | `0 0 0 2px var(--primary-500)` | Focus ring. |
| `--ks-scrim` | `rgb(0 0 0 / 0.5)` | Backdrop behind the sheet. |
| `--ks-shadow` | layered shadow | Sheet and pill shadow. |
| `--ks-hint-bg`, `--ks-hint-ink` | `var(--primary-600)`, `#fff` | Hint badges. |
| `--ks-enter`, `--ks-exit` | `180ms …`, `120ms ease-in` | Open and close transitions. |

```css
.ks-root {
    --ks-width: min(52rem, calc(100vw - 2rem));
    --ks-max-height: 70dvh;
    --ks-radius: 1rem;
    --ks-scrim: rgb(0 0 0 / 0.6);
}
```

The active table row lives outside `.ks-root`, so its background is set with `--ks-row-active` on `:root`:

```css
:root {
    --ks-row-active: rgb(250 204 21 / 0.15);
}
```

All plugin classes are prefixed with `ks-` and all attributes with `data-ks-`, so they do not collide with Filament or your app.

## Multiple panels

The plugin is registered per panel, and each registration has its own configuration:

```php
// AdminPanelProvider
->plugin(
    KeyboardShortcutsPlugin::make()
        ->shortcuts([Shortcut::make('mod+alt+u')->label('Users')->url(fn (): string => UserResource::getUrl())]),
)

// AppPanelProvider
->plugin(
    KeyboardShortcutsPlugin::make()
        ->tableNavigation(false)
        ->navigationChordPrefix('space'),
)
```

Chords are built from the navigation of the panel being rendered, and `KeyboardShortcutsPlugin::get()` returns the instance of the current panel. Panels without the plugin are not affected: the script and stylesheet are loaded on every panel by Filament's asset manager but do nothing when the plugin's markup is absent.

## FAQ and troubleshooting

**Pressing `?` does nothing.**
Run `php artisan filament:assets` and hard-reload. Check that focus is not in a text field, that no Filament modal is open, and that no action on the page binds `?` itself. Open the browser console and check that `window.__keyboardShortcuts` is `true`.

**A shortcut conflicts with a browser shortcut.**
The most common browser combinations are rejected at registration. Others depend on the browser and OS (`mod+d` bookmarks the page in most browsers, `mod+p` prints, `mod+s` saves, `mod+f` finds). Browsers do not let a page override some of them at all. Prefer single keys, `g` chords, or `mod+alt+…` and `mod+shift+…` combinations, which browsers rarely use.

**`?` does not work on my keyboard layout.**
`?` is matched by the character it produces, so it works wherever your layout types `?`. On layouts where `?` needs `AltGr`, use the `mod+/` binding, or add your own with `->sheetKeyBindings(['?', 'mod+/', 'f1'])`.

**My action's key binding is not in the sheet.**
Only actions rendered on the page and visible when the sheet opens are listed. Actions inside a closed dropdown or action group are not in the DOM. Announce them with a [`data-keyboard-shortcut`](#the-data-keyboard-shortcut-attribute-for-other-plugins) marker if you want them listed.

**An action shows as "Unnamed action".**
Icon-only actions without a label: add `->label()` or `->tooltip()` to the action, or an `aria-label`.

**A navigation item has the "wrong" letter.**
Pin it on the class with `protected static ?string $keyboardShortcut`, or set it with `->chordOverrides()`. The sheet always shows the current letters.

**An item is missing from the Navigation section.**
It is hidden for the current user, it has no URL, or every letter, pair and digit is taken. Give it an override.

**Chords navigate with a full page load.**
Enable SPA mode on the panel with `->spa()`; chords then use `Livewire.navigate()`.

**`j` and `k` do nothing.**
The page needs a visible Filament table outside a modal, and focus must not be in a field (press `Esc` or click an empty area first). If a page action binds `j` or `k`, that action wins.

**`/` types a slash instead of focusing search.**
That is expected when focus is already in a field, or when the page has no visible search field.

**The button is not visible.**
It is hidden below 1024px. On wider screens, check `->topbarButton()` and whether your panel replaces the global search or topbar with a custom Livewire component that does not call the render hooks.

**Does it work with custom themes?**
Yes. The stylesheet is independent of Tailwind and only reads Filament's `--primary-*` and `--gray-*` variables.

## Testing

```bash
composer test         # Pest: plugin API, chord assignment, sheet rendering, translations
composer analyse      # PHPStan level 6
composer format       # Pint
npm test              # JavaScript unit tests (node:test + happy-dom)
npm run test:e2e      # Playwright against the Testbench workbench panel
```

The JavaScript is built with esbuild: `npm install && npm run build` (or `npm run dev` to watch). The compiled files in `dist/` are committed.

The browser suite builds the Testbench workbench (an SPA panel with customers, orders and products, navigation groups, a header action with `->keyBindings()` and a `data-keyboard-shortcut` marker) and serves it on a free port with `vendor/bin/testbench serve`. It covers the sheet, focus handling, chords and hint mode, table keys, typing in inputs, Arabic, Hebrew and Persian right to left, dark mode, a 375px phone and reduced motion. Run `npx playwright install chromium` once, or point `KS_CHROMIUM_PATH` at an existing Chromium.

To click around yourself, run `composer serve` and open `/admin`. Query parameters are stored in the session:

| Parameter | Effect |
| --- | --- |
| `?locale=ar` | Switch to any shipped locale. |
| `?big=1` | Add 26 navigation items to force two-letter chords. |
| `?hints=0` | Turn hint mode off. |
| `?topbar=0` | Remove the topbar, which moves global search and the button into the sidebar. |

The README screenshots are generated by `tests/e2e/screenshots.spec.mjs`, skipped unless `KS_SCREENSHOTS` is set:

```bash
npm run build && php vendor/bin/testbench workbench:build
KS_SCREENSHOTS=1 npx playwright test screenshots
```

They are written to `docs/images` at a device scale factor of 2 (`KS_SCREENSHOTS_DIR` overrides the folder).

## Contributing

Pull requests are welcome. Please:

1. run `composer test`, `composer analyse`, `composer format`, `npm test` and `npm run test:e2e`;
2. rebuild `dist/` with `npm run build` when you change `resources/js` or `resources/css`;
3. add or update tests for behaviour changes.

Translation fixes and new languages are especially welcome: add or edit `resources/lang/{locale}/shortcuts.php` and run `composer test`, which checks that every locale has the same keys and placeholders as English.

## Works well with

- [Quick Action Dock](https://github.com/HoceineEl/filament-quick-action-dock): its items' key bindings appear in the sheet under Page actions automatically.
- [Undo Toast](https://github.com/HoceineEl/filament-undo-toast): Gmail-style undo after deletes and edits; its `mod+z` appears in the sheet as "Undo last action".

Each plugin works on its own.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for what changed in each release.

## Security

See [SECURITY.md](SECURITY.md). Please report vulnerabilities by email to contact@hoceine.com rather than in a public issue.

## Credits

- [Hoceine El Idrissi](https://github.com/HoceineEl)
- [All contributors](https://github.com/HoceineEl/filament-keyboard-shortcuts/contributors)

## License

The MIT License (MIT). See [LICENSE.md](LICENSE.md).
