<?php

declare(strict_types=1);

namespace Workbench\App\Filament\Resources\Products;

use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Workbench\App\Filament\Resources\Products\Pages\ListProducts;
use Workbench\App\Models\Product;

class ProductResource extends Resource
{
    protected static ?string $model = Product::class;

    protected static string|\BackedEnum|null $navigationIcon = Heroicon::OutlinedCube;

    protected static string|\UnitEnum|null $navigationGroup = 'Catalog';

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('name')->searchable(),
            TextColumn::make('sku'),
            TextColumn::make('price')->money('EUR', divideBy: 100),
        ]);
    }

    public static function getPages(): array
    {
        return ['index' => ListProducts::route('/')];
    }
}
