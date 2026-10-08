<?php

declare(strict_types=1);

namespace HoceineEl\KeyboardShortcuts\Support;

use InvalidArgumentException;

final class KeyCombo
{
    public const array MODIFIERS = ['mod', 'alt', 'shift'];

    public const array RESERVED = [
        'mod+k',
        'mod+l',
        'mod+n',
        'mod+q',
        'mod+r',
        'mod+t',
        'mod+w',
        'mod+tab',
        'mod+shift+n',
        'mod+shift+q',
        'mod+shift+r',
        'mod+shift+t',
        'mod+shift+w',
        'mod+shift+tab',
    ];

    public const array ARROWS = ['up' => '↑', 'down' => '↓', 'left' => '←', 'right' => '→'];

    private const array ALIASES = [
        'cmd' => 'mod',
        'command' => 'mod',
        'meta' => 'mod',
        'ctrl' => 'mod',
        'control' => 'mod',
        'option' => 'alt',
        'opt' => 'alt',
        'esc' => 'escape',
        'return' => 'enter',
        'del' => 'delete',
        'spacebar' => 'space',
    ];

    public static function normalize(string $binding): string
    {
        $tokens = self::tokens($binding);

        if ($tokens === []) {
            throw new InvalidArgumentException('Keyboard Shortcuts: a key binding cannot be empty.');
        }

        $tokens = array_map(fn (string $token): string => self::ALIASES[$token] ?? $token, $tokens);

        $modifiers = array_values(array_intersect(self::MODIFIERS, $tokens));
        $keys = array_values(array_diff($tokens, self::MODIFIERS));

        return implode('+', [...$modifiers, ...$keys]);
    }

    /**
     * @return list<string>
     */
    public static function tokens(string $binding): array
    {
        $binding = mb_strtolower(trim($binding));

        if ($binding === '') {
            return [];
        }

        if ($binding === '+' || str_ends_with($binding, '++')) {
            return [...self::tokens(substr($binding, 0, -2)), '+'];
        }

        return array_values(array_filter(
            array_map(trim(...), explode('+', $binding)),
            fn (string $token): bool => $token !== '',
        ));
    }

    public static function assertAllowed(string $binding): string
    {
        if (self::isReserved($binding)) {
            throw new InvalidArgumentException("Keyboard Shortcuts: [{$binding}] is reserved by the browser or Filament's global search. Pick another combination.");
        }

        return self::normalize($binding);
    }

    public static function label(string $token): string
    {
        $key = "keyboard-shortcuts::shortcuts.keys.{$token}";

        return match (true) {
            isset(self::ARROWS[$token]) => self::ARROWS[$token],
            trans()->has($key) => __($key),
            default => mb_strtoupper($token),
        };
    }

    public static function isReserved(string $binding): bool
    {
        return in_array(self::normalize($binding), self::RESERVED, true);
    }
}
