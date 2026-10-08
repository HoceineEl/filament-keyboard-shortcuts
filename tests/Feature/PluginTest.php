<?php

declare(strict_types=1);

use Filament\Facades\Filament;
use HoceineEl\KeyboardShortcuts\Enums\ShortcutGroup;
use HoceineEl\KeyboardShortcuts\KeyboardShortcutsPlugin;
use HoceineEl\KeyboardShortcuts\Shortcut;

it('registers under the keyboard-shortcuts id', function (): void {
    $plugin = usePanel();

    expect($plugin)->toBeInstanceOf(KeyboardShortcutsPlugin::class)
        ->and($plugin->getId())->toBe('keyboard-shortcuts')
        ->and(KeyboardShortcutsPlugin::get())->toBe($plugin);
});

it('ships sensible defaults', function (): void {
    $plugin = KeyboardShortcutsPlugin::make();

    expect($plugin->getSheetKeyBindings())->toBe(['?', 'mod+/'])
        ->and($plugin->getSearchKeyBindings())->toBe(['/'])
        ->and($plugin->getNavigationChordPrefix())->toBe('g')
        ->and($plugin->hasNavigationChords())->toBeTrue()
        ->and($plugin->hasNavigationHints())->toBeTrue()
        ->and($plugin->hasTableNavigation())->toBeTrue()
        ->and($plugin->hasTopbarButton())->toBeTrue()
        ->and($plugin->getShortcuts())->toBe([]);
});

it('accepts fluent configuration and closures', function (): void {
    $plugin = KeyboardShortcutsPlugin::make()
        ->sheetKeyBindings(['shift+/'])
        ->searchKeyBindings([])
        ->navigationChords(fn (): bool => false)
        ->navigationChordPrefix('Q')
        ->navigationHints(fn (): bool => false)
        ->tableNavigation(false)
        ->topbarButton(false)
        ->shortcuts(fn (): array => [Shortcut::make('mod+e')->label('Edit')->js('1')]);

    expect($plugin->getSheetKeyBindings())->toBe(['shift+/'])
        ->and($plugin->getSearchKeyBindings())->toBe([])
        ->and($plugin->hasNavigationChords())->toBeFalse()
        ->and($plugin->getNavigationChordPrefix())->toBe('q')
        ->and($plugin->hasNavigationHints())->toBeFalse()
        ->and($plugin->hasTableNavigation())->toBeFalse()
        ->and($plugin->hasTopbarButton())->toBeFalse()
        ->and($plugin->getShortcuts())->toHaveCount(1);
});

it('appends shortcuts across calls and drops hidden ones', function (): void {
    $plugin = KeyboardShortcutsPlugin::make()
        ->shortcuts([Shortcut::make('mod+e')->label('Edit')->js('1')])
        ->shortcuts([Shortcut::make('mod+i')->label('Hidden')->js('1')->hidden()]);

    expect($plugin->getShortcuts())->toHaveCount(1);
});

it('refuses reserved bindings for the sheet and search', function (): void {
    KeyboardShortcutsPlugin::make()->sheetKeyBindings(['mod+k']);
})->throws(InvalidArgumentException::class);

it('refuses a chord prefix that is not a single key', function (): void {
    KeyboardShortcutsPlugin::make()->navigationChordPrefix('mod+g');
})->throws(InvalidArgumentException::class);

it('builds the client config as json', function (): void {
    $config = usePanel()->getClientConfig();

    expect($config)->toHaveKeys(['sheet', 'search', 'chords', 'table', 'spa', 'shortcuts', 'reserved'])
        ->and($config['sheet'])->toBe(['?', 'mod+/'])
        ->and($config['chords']['prefix'])->toBe('g')
        ->and($config['chords']['timeout'])->toBe(1200)
        ->and($config['chords']['hints'])->toBeTrue()
        ->and($config['i18n']['hint'])->toBe('Shortcut: :keys')
        ->and(array_column($config['chords']['items'], 'letter', 'label'))->toBe(['Dashboard' => 'd', 'Customers' => 'c', 'Orders' => 'o'])
        ->and($config['table'])->toBeTrue()
        ->and($config['spa'])->toBeFalse()
        ->and(array_column($config['shortcuts'], 'label'))->toBe(['Export invoices', 'Toggle sidebar'])
        ->and($config['reserved'])->toContain('mod+k', 'mod+w', 'mod+shift+f')
        ->and(json_encode($config, JSON_THROW_ON_ERROR))->toBeString();
});

it('omits chords when navigation chords are off', function (): void {
    usePanel()->navigationChords(false);

    expect(KeyboardShortcutsPlugin::get()->getClientConfig()['chords'])->toBeNull();
});

it('follows the panel spa mode', function (): void {
    Filament::getPanel('admin')->spa();

    expect(usePanel()->getClientConfig()['spa'])->toBeTrue();
});

it('groups sheet sections in a fixed order with custom groups last', function (): void {
    $sections = usePanel()->getSheetSections();

    expect(array_column($sections, 'label'))->toBe([
        ShortcutGroup::General->getLabel(),
        ShortcutGroup::Navigation->getLabel(),
        ShortcutGroup::PageActions->getLabel(),
        ShortcutGroup::Table->getLabel(),
        'Billing',
        ShortcutGroup::Custom->getLabel(),
    ]);
});

it('describes the general and table rows', function (): void {
    $sections = collect(usePanel()->getSheetSections())->keyBy('id');

    expect(array_column($sections['general']['rows'], 'keys'))->toBe([['?', 'mod+/'], ['/'], ['escape']])
        ->and($sections['table']['requires'])->toBe('table')
        ->and(array_column($sections['table']['rows'], 'keys'))->toBe([
            ['j'], ['k'], ['enter', 'o'], ['x'], ['shift+x'], ['['], [']'], ['f'],
        ])
        ->and($sections['navigation']['rows'][1])->toMatchArray(['label' => 'Customers', 'keys' => ['g c'], 'meta' => 'Sales']);
});

it('leaves out disabled sections', function (): void {
    usePanel()->navigationChords(false)->tableNavigation(false)->searchKeyBindings([]);

    $sections = collect(KeyboardShortcutsPlugin::get()->getSheetSections())->keyBy('id');

    expect($sections->keys()->all())->not->toContain('navigation', 'table')
        ->and($sections['general']['rows'])->toHaveCount(2);
});

it('turns navigation hints off in the client config', function (): void {
    usePanel()->navigationHints(false);

    expect(KeyboardShortcutsPlugin::get()->getClientConfig()['chords']['hints'])->toBeFalse();
});
