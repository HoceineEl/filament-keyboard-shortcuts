<?php

declare(strict_types=1);

namespace HoceineEl\KeyboardShortcuts\Tests\Fixtures\Pins;

class UnpinnedResource
{
    protected static ?string $keyboardShortcut = null;

    protected static ?string $navigationLabel;

    public function getKeyboardShortcut(): string
    {
        return 'n';
    }
}
