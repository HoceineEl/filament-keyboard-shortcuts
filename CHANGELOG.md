# Changelog

## 0.2.0 - 2026-10-08

### Added

- Hint mode: pressing `g` shows each item's letter as a badge next to the sidebar item (beside the icon when the sidebar is collapsed), narrowing as you type; works in dark mode and RTL, fades only under reduced motion. Turn off with `->navigationHints(false)`.
- Sidebar links expose their chord as `aria-description`, and as `title` when Filament shows no tooltip.
- Resources and pages can pin their chord with `protected static ?string $keyboardShortcut` or a public static `getKeyboardShortcut()`.
- Big panels fall back to two-letter chords built from the label (`g` `c` `u`) before digits. Overrides accept one or two characters. `Enter` confirms an ambiguous prefix.
- The chord pill shows the keys typed so far and a "then a letter" hint. `Esc` now hides it immediately.
- Sheet: sections flow into balanced columns, navigation rows are grouped by navigation group, a footer shows how to open and close it, the empty state suggests what to search, the dialog keeps its height while filtering, and the search field has a softer focus ring.
- Search matches combos by key: `shift+x` or `g+c` no longer match labels that merely contain those letters.
- The active table row uses a direction-agnostic focus ring instead of an inline-start bar.
- Letter keys and badges use the panel font so `O` and `0` stay distinct.
- Translations for Chinese (Simplified and Traditional), Czech, Dutch, German, Hebrew, Hindi, Indonesian, Italian, Japanese, Korean, Persian, Polish, Portuguese (Portugal and Brazil), Russian, Spanish, Turkish, Ukrainian and Vietnamese, alongside English, French and Arabic. Terms match Filament's own translations and key labels match each locale's keyboards. A test keeps every locale in step with English.
- JavaScript unit tests (`npm test`) and a Playwright suite against a Testbench workbench (`npm run test:e2e`), both in CI.

### Fixed

- The closed sheet no longer carries `aria-modal="true"`, which made Filament treat a modal as open and silently disabled every Filament key binding on the page (global search, action `->keyBindings()`). It is now set only while the sheet is open.
- The shortcuts button now shows on panels that put global search in the sidebar (`->topbar(false)` or `GlobalSearchPosition::Sidebar`). It renders inside the global search field, falling back to the topbar end, or the sidebar footer when the panel has neither search nor a topbar.

## 0.1.0 - 2026-10-07

- `?` / `mod+/` shortcuts sheet built from the live page: general keys, navigation chords, page actions discovered from Filament's `->keyBindings()` markup, table keys and custom shortcuts, with search, empty state and platform-aware key labels.
- Gmail-style `g` navigation chords for every panel navigation item, with automatic, stable letter assignment, overrides by class, label or slug, and SPA-aware navigation.
- Keyboard table navigation: `j` / `k`, `Enter` / `o`, `x`, `shift+x`, `[` / `]`, `f`.
- Custom shortcuts that open a URL, dispatch a Livewire event or run an Alpine expression; browser-reserved combinations and `mod+k` are rejected.
- `/` focuses search; topbar button next to global search.
- Light and dark, RTL, English, French and Arabic. Filament 4 and 5, Laravel 12 and 13.
