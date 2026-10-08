<?php

declare(strict_types=1);

use HoceineEl\KeyboardShortcuts\Enums\ShortcutBehavior;
use HoceineEl\KeyboardShortcuts\Enums\ShortcutGroup;
use HoceineEl\KeyboardShortcuts\Shortcut;

it('serialises a url shortcut', function (): void {
    $shortcut = Shortcut::make('Shift+Cmd+E')
        ->label('Export')
        ->group('Billing')
        ->url('/export', shouldOpenInNewTab: true);

    expect($shortcut->toArray())->toBe([
        'keys' => ['mod+shift+e'],
        'label' => 'Export',
        'group' => 'Billing',
        'behavior' => 'url',
        'url' => '/export',
        'newTab' => true,
    ]);
});

it('serialises a dispatch shortcut with its payload', function (): void {
    $shortcut = Shortcut::make(['mod+alt+e', 'mod+alt+x'])
        ->label('Export')
        ->dispatch('export-requested', ['format' => 'csv']);

    expect($shortcut->toArray())->toMatchArray([
        'keys' => ['mod+alt+e', 'mod+alt+x'],
        'behavior' => 'dispatch',
        'event' => 'export-requested',
        'payload' => ['format' => 'csv'],
    ]);
});

it('serialises a js shortcut', function (): void {
    expect(Shortcut::make('mod+b')->label('Toggle sidebar')->js('$store.sidebar.open()')->toArray())
        ->toMatchArray(['behavior' => 'js', 'js' => '$store.sidebar.open()']);
});

it('falls in the custom group by default', function (): void {
    expect(Shortcut::make('mod+e')->label('Edit')->js('1')->getGroup())
        ->toBe(ShortcutGroup::Custom->getLabel());
});

it('accepts a built-in group enum', function (): void {
    expect(Shortcut::make('mod+e')->group(ShortcutGroup::PageActions)->getGroup())
        ->toBe('Page actions');
});

it('evaluates closures for label, url and visibility', function (): void {
    $shortcut = Shortcut::make('mod+e')
        ->label(fn (): string => 'Edit profile')
        ->url(fn (): string => '/profile')
        ->visible(fn (): bool => false);

    expect($shortcut->getLabel())->toBe('Edit profile')
        ->and($shortcut->getUrl())->toBe('/profile')
        ->and($shortcut->getBehavior())->toBe(ShortcutBehavior::Url)
        ->and($shortcut->isVisible())->toBeFalse()
        ->and(Shortcut::make('mod+e')->hidden()->isVisible())->toBeFalse();
});

it('uses the binding as label when none is given', function (): void {
    expect(Shortcut::make('mod+e')->js('1')->getLabel())->toBe('mod+e');
});

it('refuses browser reserved and global search combos', function (string $binding): void {
    Shortcut::make($binding);
})->with(['mod+w', 'ctrl+k', 'mod+shift+n'])->throws(InvalidArgumentException::class);

it('needs something to do', function (): void {
    Shortcut::make('mod+e')->label('Nothing')->toArray();
})->throws(LogicException::class, 'Keyboard Shortcuts: the [mod+e] shortcut needs ->url(), ->dispatch() or ->js().');
