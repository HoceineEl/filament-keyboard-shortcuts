<?php

declare(strict_types=1);

namespace Workbench\App\Filament\Resources\Customers\Pages;

use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;
use Filament\Support\Icons\Heroicon;
use Workbench\App\Filament\Resources\Customers\CustomerResource;

class ListCustomers extends ListRecords
{
    protected static string $resource = CustomerResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('export')
                ->label('Export customers')
                ->icon(Heroicon::OutlinedArrowDownTray)
                ->color('gray')
                ->keyBindings(['mod+shift+e'])
                ->action(fn () => Notification::make()->title('Export started')->success()->send()),
        ];
    }
}
