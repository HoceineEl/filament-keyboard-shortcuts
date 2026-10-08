<?php

declare(strict_types=1);

use HoceineEl\KeyboardShortcuts\Support\KeyCombo;

it('normalises aliases, case and modifier order', function (string $input, string $expected): void {
    expect(KeyCombo::normalize($input))->toBe($expected);
})->with([
    ['Shift+CMD+N', 'mod+shift+n'],
    ['ctrl+/', 'mod+/'],
    ['command+alt+e', 'mod+alt+e'],
    ['option+shift+p', 'alt+shift+p'],
    ['esc', 'escape'],
    ['Return', 'enter'],
    ['?', '?'],
    ['  g  ', 'g'],
]);

it('splits a binding into tokens', function (): void {
    expect(KeyCombo::tokens('mod+shift+n'))->toBe(['mod', 'shift', 'n'])
        ->and(KeyCombo::tokens('mod++'))->toBe(['mod', '+']);
});

it('flags browser reserved combos and mod+k', function (string $binding, bool $reserved): void {
    expect(KeyCombo::isReserved($binding))->toBe($reserved);
})->with([
    ['mod+k', true],
    ['Ctrl+K', true],
    ['mod+w', true],
    ['mod+t', true],
    ['mod+shift+n', true],
    ['mod+shift+e', false],
    ['?', false],
    ['g', false],
]);

it('rejects empty bindings', function (): void {
    KeyCombo::normalize(' ');
})->throws(InvalidArgumentException::class);

it('labels keys for display', function (string $token, string $label): void {
    expect(KeyCombo::label($token))->toBe($label);
})->with([
    ['mod', 'Ctrl'],
    ['shift', 'Shift'],
    ['alt', 'Alt'],
    ['escape', 'Esc'],
    ['enter', 'Enter'],
    ['up', '↑'],
    ['left', '←'],
    ['g', 'G'],
    ['/', '/'],
    ['[', '['],
]);

it('labels keys in the current locale', function (): void {
    app()->setLocale('fr');

    expect(KeyCombo::label('shift'))->toBe('Maj')
        ->and(KeyCombo::label('enter'))->toBe('Entrée');
});
