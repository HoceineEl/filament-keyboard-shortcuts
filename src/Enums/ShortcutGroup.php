<?php

declare(strict_types=1);

namespace HoceineEl\KeyboardShortcuts\Enums;

use Filament\Support\Contracts\HasLabel;

enum ShortcutGroup: string implements HasLabel
{
    case General = 'general';
    case Navigation = 'navigation';
    case PageActions = 'page-actions';
    case Table = 'table';
    case Custom = 'custom';

    public function getLabel(): string
    {
        return __("keyboard-shortcuts::shortcuts.groups.{$this->value}");
    }
}
