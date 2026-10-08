<?php

declare(strict_types=1);

use Filament\Facades\Filament;
use HoceineEl\KeyboardShortcuts\KeyboardShortcutsPlugin;
use HoceineEl\KeyboardShortcuts\Tests\TestCase;

uses(TestCase::class)->in(__DIR__);

function usePanel(string $id = 'admin'): KeyboardShortcutsPlugin
{
    $panel = Filament::getPanel($id);

    Filament::setCurrentPanel($panel);

    /** @var KeyboardShortcutsPlugin */
    return $panel->getPlugin('keyboard-shortcuts');
}
