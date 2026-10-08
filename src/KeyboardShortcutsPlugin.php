<?php

declare(strict_types=1);

namespace HoceineEl\KeyboardShortcuts;

use Closure;
use Filament\Contracts\Plugin;
use Filament\Facades\Filament;
use Filament\Panel;
use Filament\Support\Concerns\EvaluatesClosures;
use Filament\View\PanelsRenderHook;
use HoceineEl\KeyboardShortcuts\Enums\ShortcutGroup;
use HoceineEl\KeyboardShortcuts\Support\KeyCombo;
use HoceineEl\KeyboardShortcuts\Support\NavigationChord;
use HoceineEl\KeyboardShortcuts\Support\NavigationShortcuts;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Str;
use InvalidArgumentException;

class KeyboardShortcutsPlugin implements Plugin
{
    use EvaluatesClosures;

    public const int CHORD_TIMEOUT = 1200;

    /**
     * @var list<string>
     */
    protected array $sheetKeyBindings = ['?', 'mod+/'];

    /**
     * @var list<string>
     */
    protected array $searchKeyBindings = ['/'];

    protected bool|Closure $hasNavigationChords = true;

    protected string $navigationChordPrefix = 'g';

    /**
     * @var array<string, string>
     */
    protected array $chordOverrides = [];

    protected bool|Closure $hasNavigationHints = true;

    protected bool|Closure $hasTableNavigation = true;

    protected bool|Closure $hasTopbarButton = true;

    /**
     * @var list<array<Shortcut> | Closure>
     */
    protected array $shortcuts = [];

    public static function make(): static
    {
        return app(static::class);
    }

    public static function get(): static
    {
        /** @var static */
        return filament(app(static::class)->getId());
    }

    public function getId(): string
    {
        return 'keyboard-shortcuts';
    }

    public function register(Panel $panel): void
    {
        $panel
            ->renderHook(PanelsRenderHook::BODY_END, fn (): View => view('keyboard-shortcuts::sheet', ['plugin' => $this]))
            ->renderHook(PanelsRenderHook::GLOBAL_SEARCH_END, fn (): string => $this->renderButton())
            ->renderHook(PanelsRenderHook::TOPBAR_END, fn (): string => filament()->isGlobalSearchEnabled() ? '' : $this->renderButton())
            ->renderHook(PanelsRenderHook::SIDEBAR_FOOTER, fn (): string => (filament()->isGlobalSearchEnabled() || filament()->hasTopbar()) ? '' : $this->renderButton());
    }

    protected function renderButton(): string
    {
        return $this->hasTopbarButton()
            ? view('keyboard-shortcuts::topbar-button', ['plugin' => $this])->render()
            : '';
    }

    public function boot(Panel $panel): void {}

    /**
     * @param  list<string>  $keyBindings
     */
    public function sheetKeyBindings(array $keyBindings): static
    {
        $this->sheetKeyBindings = $this->normalizeBindings($keyBindings);

        return $this;
    }

    /**
     * @param  list<string>  $keyBindings
     */
    public function searchKeyBindings(array $keyBindings): static
    {
        $this->searchKeyBindings = $this->normalizeBindings($keyBindings);

        return $this;
    }

    public function navigationChords(bool|Closure $condition = true): static
    {
        $this->hasNavigationChords = $condition;

        return $this;
    }

    public function navigationChordPrefix(string $key): static
    {
        $key = KeyCombo::normalize($key);

        if (count(KeyCombo::tokens($key)) !== 1) {
            throw new InvalidArgumentException("Keyboard Shortcuts: the chord prefix must be a single key without modifiers, [{$key}] given.");
        }

        $this->navigationChordPrefix = $key;

        return $this;
    }

    /**
     * @param  array<string, string>  $overrides  navigation item key, resource / page class or label => one or two letters
     */
    public function chordOverrides(array $overrides): static
    {
        $this->chordOverrides = $overrides;

        return $this;
    }

    public function navigationHints(bool|Closure $condition = true): static
    {
        $this->hasNavigationHints = $condition;

        return $this;
    }

    public function tableNavigation(bool|Closure $condition = true): static
    {
        $this->hasTableNavigation = $condition;

        return $this;
    }

    public function topbarButton(bool|Closure $condition = true): static
    {
        $this->hasTopbarButton = $condition;

        return $this;
    }

    /**
     * @param  array<Shortcut> | Closure  $shortcuts
     */
    public function shortcuts(array|Closure $shortcuts): static
    {
        $this->shortcuts[] = $shortcuts;

        return $this;
    }

    /**
     * @return list<string>
     */
    public function getSheetKeyBindings(): array
    {
        return $this->sheetKeyBindings;
    }

    /**
     * @return list<string>
     */
    public function getSearchKeyBindings(): array
    {
        return $this->searchKeyBindings;
    }

    public function hasNavigationChords(): bool
    {
        return (bool) $this->evaluate($this->hasNavigationChords);
    }

    public function getNavigationChordPrefix(): string
    {
        return $this->navigationChordPrefix;
    }

    /**
     * @return array<string, string>
     */
    public function getChordOverrides(): array
    {
        return $this->chordOverrides;
    }

    public function hasNavigationHints(): bool
    {
        return (bool) $this->evaluate($this->hasNavigationHints);
    }

    public function hasTableNavigation(): bool
    {
        return (bool) $this->evaluate($this->hasTableNavigation);
    }

    public function hasTopbarButton(): bool
    {
        return (bool) $this->evaluate($this->hasTopbarButton);
    }

    /**
     * @return list<Shortcut>
     */
    public function getShortcuts(): array
    {
        $shortcuts = [];

        foreach ($this->shortcuts as $set) {
            array_push($shortcuts, ...array_values((array) $this->evaluate($set)));
        }

        return array_values(array_filter($shortcuts, fn (Shortcut $shortcut): bool => $shortcut->isVisible()));
    }

    /**
     * @return list<NavigationChord>
     */
    public function getNavigationChords(): array
    {
        $panel = Filament::getCurrentPanel();

        if (! $this->hasNavigationChords() || $panel === null) {
            return [];
        }

        return NavigationShortcuts::for($panel, $this->getChordOverrides());
    }

    /**
     * @return array<string, mixed>
     */
    public function getClientConfig(): array
    {
        $panel = Filament::getCurrentPanel();

        return [
            'sheet' => $this->getSheetKeyBindings(),
            'search' => $this->getSearchKeyBindings(),
            'chords' => $this->hasNavigationChords() ? [
                'prefix' => $this->getNavigationChordPrefix(),
                'timeout' => static::CHORD_TIMEOUT,
                'hints' => $this->hasNavigationHints(),
                'items' => array_map(fn (NavigationChord $chord): array => $chord->toArray(), $this->getNavigationChords()),
            ] : null,
            'table' => $this->hasTableNavigation(),
            'spa' => (bool) $panel?->hasSpaMode(),
            'shortcuts' => array_map(fn (Shortcut $shortcut): array => $shortcut->toArray(), $this->getShortcuts()),
            'reserved' => array_values(array_unique([
                ...KeyCombo::RESERVED,
                ...array_map(KeyCombo::normalize(...), $panel?->getGlobalSearchKeyBindings() ?? []),
            ])),
            'i18n' => [
                'then' => __('keyboard-shortcuts::shortcuts.then'),
                'or' => __('keyboard-shortcuts::shortcuts.or'),
                'unnamed' => __('keyboard-shortcuts::shortcuts.unnamed_action'),
                'keys' => __('keyboard-shortcuts::shortcuts.keys'),
                'hint' => __('keyboard-shortcuts::shortcuts.navigation_hint'),
            ],
        ];
    }

    /**
     * @return list<array{id: string, label: string, requires: ?string, dynamic: bool, rows: list<array{label: string, keys: list<string>, meta: ?string}>}>
     */
    public function getSheetSections(): array
    {
        $sections = [];

        $section = function (string $id, string $label, array $rows, ?string $requires = null, bool $dynamic = false) use (&$sections): void {
            $sections[$id] = ['id' => $id, 'label' => $label, 'requires' => $requires, 'dynamic' => $dynamic, 'rows' => $rows];
        };

        $section('general', ShortcutGroup::General->getLabel(), array_values(array_filter([
            $this->row(__('keyboard-shortcuts::shortcuts.general.open_sheet'), $this->getSheetKeyBindings()),
            $this->getSearchKeyBindings() === [] ? null : $this->row(__('keyboard-shortcuts::shortcuts.general.focus_search'), $this->getSearchKeyBindings()),
            $this->row(__('keyboard-shortcuts::shortcuts.general.close_dialog'), ['escape']),
        ])));

        if (filled($chords = $this->getNavigationChords())) {
            $section('navigation', ShortcutGroup::Navigation->getLabel(), array_map(
                fn (NavigationChord $chord): array => $this->row($chord->label, [$chord->sequence($this->getNavigationChordPrefix())], $chord->group),
                $chords,
            ));
        }

        $section('page-actions', ShortcutGroup::PageActions->getLabel(), [], dynamic: true);

        if ($this->hasTableNavigation()) {
            $section('table', ShortcutGroup::Table->getLabel(), array_map(
                fn (array $row): array => $this->row(__("keyboard-shortcuts::shortcuts.table.{$row[0]}"), $row[1]),
                [
                    ['next_row', ['j']],
                    ['previous_row', ['k']],
                    ['open_row', ['enter', 'o']],
                    ['select_row', ['x']],
                    ['select_page', ['shift+x']],
                    ['previous_page', ['[']],
                    ['next_page', [']']],
                    ['filters', ['f']],
                ],
            ), requires: 'table');
        }

        $custom = [];

        foreach ($this->getShortcuts() as $shortcut) {
            $custom[$shortcut->getGroup()][] = $this->row($shortcut->getLabel(), $shortcut->getKeys());
        }

        $fallback = ShortcutGroup::Custom->getLabel();

        uksort($custom, fn (string $a, string $b): int => ($a === $fallback) <=> ($b === $fallback));

        foreach ($custom as $label => $rows) {
            $id = collect($sections)->firstWhere('label', $label)['id'] ?? 'custom-'.Str::slug($label);
            $existing = $sections[$id] ?? null;

            $section($id, $label, [...($existing['rows'] ?? []), ...$rows], $existing['requires'] ?? null, $existing['dynamic'] ?? false);
        }

        return array_values($sections);
    }

    public function getTopbarTooltip(): string
    {
        $binding = $this->getSheetKeyBindings()[0] ?? null;

        if ($binding === null) {
            return __('keyboard-shortcuts::shortcuts.open');
        }

        $keys = implode('+', array_map(KeyCombo::label(...), KeyCombo::tokens($binding)));

        return __('keyboard-shortcuts::shortcuts.open')." ({$keys})";
    }

    /**
     * @param  list<string>  $keys
     * @return array{label: string, keys: list<string>, meta: ?string}
     */
    protected function row(string $label, array $keys, ?string $meta = null): array
    {
        return ['label' => $label, 'keys' => $keys, 'meta' => $meta];
    }

    /**
     * @param  list<string>  $keyBindings
     * @return list<string>
     */
    protected function normalizeBindings(array $keyBindings): array
    {
        return array_map(KeyCombo::assertAllowed(...), array_values($keyBindings));
    }
}
