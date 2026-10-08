<?php

declare(strict_types=1);

namespace HoceineEl\KeyboardShortcuts\Tests\Fixtures\Pins;

class MethodPinnedPage
{
    protected static ?string $keyboardShortcut = 'q';

    public static function getKeyboardShortcut(): string
    {
        return 'rp';
    }
}
