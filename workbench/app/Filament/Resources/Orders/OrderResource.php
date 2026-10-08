<?php

declare(strict_types=1);

namespace Workbench\App\Filament\Resources\Orders;

use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Workbench\App\Filament\Resources\Orders\Pages\ListOrders;
use Workbench\App\Models\Order;

class OrderResource extends Resource
{
    protected static ?string $model = Order::class;

    protected static string|\BackedEnum|null $navigationIcon = Heroicon::OutlinedShoppingBag;

    protected static string|\UnitEnum|null $navigationGroup = 'Sales';

    protected static ?int $navigationSort = 2;

    public static function getNavigationBadge(): ?string
    {
        return (string) Order::query()->count();
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('number')->searchable(),
                TextColumn::make('total')->money('EUR', divideBy: 100),
                TextColumn::make('created_at')->date(),
            ])
            ->defaultPaginationPageOption(10);
    }

    public static function getPages(): array
    {
        return ['index' => ListOrders::route('/')];
    }
}
