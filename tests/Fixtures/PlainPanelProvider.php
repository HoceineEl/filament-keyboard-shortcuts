<?php

declare(strict_types=1);

namespace HoceineEl\KeyboardShortcuts\Tests\Fixtures;

use Filament\Panel;
use Filament\PanelProvider;

class PlainPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel->id('plain')->path('plain');
    }
}
