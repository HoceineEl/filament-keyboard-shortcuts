<?php

declare(strict_types=1);

namespace HoceineEl\KeyboardShortcuts\Tests\Fixtures;

use Filament\Navigation\NavigationItem;
use Filament\Panel;
use Filament\PanelProvider;
use HoceineEl\KeyboardShortcuts\KeyboardShortcutsPlugin;
use HoceineEl\KeyboardShortcuts\Shortcut;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->id('admin')
            ->path('admin')
            ->default()
            ->globalSearchKeyBindings(['command+k', 'ctrl+shift+f'])
            ->navigationItems([
                NavigationItem::make('Dashboard')->url('/admin')->sort(-2),
                NavigationItem::make('Customers')->url('/admin/customers')->group('Sales'),
                NavigationItem::make('Orders')->url('/admin/orders')->group('Sales'),
            ])
            ->plugin(
                KeyboardShortcutsPlugin::make()
                    ->shortcuts([
                        Shortcut::make('mod+shift+e')->label('Export invoices')->group('Billing')->dispatch('export-requested'),
                        Shortcut::make('mod+b')->label('Toggle sidebar')->js('$store.sidebar.close()'),
                        Shortcut::make('mod+shift+h')->label('Hidden one')->url('/x')->hidden(),
                    ]),
            );
    }
}
