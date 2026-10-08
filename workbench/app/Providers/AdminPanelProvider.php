<?php

declare(strict_types=1);

namespace Workbench\App\Providers;

use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Navigation\NavigationGroup;
use Filament\Navigation\NavigationItem;
use Filament\Pages\Dashboard;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Support\Icons\Heroicon;
use Filament\View\PanelsRenderHook;
use HoceineEl\KeyboardShortcuts\KeyboardShortcutsPlugin;
use HoceineEl\KeyboardShortcuts\Shortcut;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;
use Workbench\App\Filament\Resources\Customers\CustomerResource;
use Workbench\App\Filament\Resources\Customers\Pages\ListCustomers;
use Workbench\App\Filament\Resources\Orders\OrderResource;
use Workbench\App\Filament\Resources\Products\ProductResource;
use Workbench\App\Http\Middleware\ApplyWorkbenchPreferences;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->id('admin')
            ->path('admin')
            ->default()
            ->spa()
            ->brandName('Acme Admin')
            ->colors(['primary' => Color::Indigo])
            ->sidebarCollapsibleOnDesktop()
            ->topbar(fn (): bool => session('workbench.topbar') !== '0')
            ->resources([CustomerResource::class, OrderResource::class, ProductResource::class])
            ->pages([Dashboard::class])
            ->navigationGroups([
                NavigationGroup::make('Sales'),
                NavigationGroup::make('Catalog'),
                NavigationGroup::make('Queues'),
            ])
            ->navigationItems([
                NavigationItem::make('Filament docs')
                    ->url('https://filamentphp.com/docs', shouldOpenInNewTab: true)
                    ->icon(Heroicon::OutlinedBookOpen)
                    ->group('Catalog'),
                ...array_map(
                    fn (string $letter): NavigationItem => NavigationItem::make(strtoupper($letter).' list')
                        ->url("/admin/products?queue={$letter}")
                        ->group('Queues')
                        ->visible(fn (): bool => (bool) session('workbench.big')),
                    range('a', 'z'),
                ),
            ])
            ->renderHook(
                PanelsRenderHook::PAGE_END,
                fn (): string => '<span hidden data-keyboard-shortcut="mod+z" data-keyboard-shortcut-label="Undo last action"></span>',
                scopes: ListCustomers::class,
            )
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                ApplyWorkbenchPreferences::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->plugin(
                KeyboardShortcutsPlugin::make()
                    ->navigationHints(fn (): bool => session('workbench.hints') !== '0')
                    ->shortcuts([
                        Shortcut::make('mod+alt+p')
                            ->label('New product list')
                            ->group('Catalog')
                            ->url(fn (): string => ProductResource::getUrl()),
                    ]),
            );
    }
}
