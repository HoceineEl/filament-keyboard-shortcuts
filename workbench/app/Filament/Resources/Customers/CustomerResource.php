<?php

declare(strict_types=1);

namespace Workbench\App\Filament\Resources\Customers;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;
use Workbench\App\Filament\Resources\Customers\Pages\EditCustomer;
use Workbench\App\Filament\Resources\Customers\Pages\ListCustomers;
use Workbench\App\Models\Customer;

class CustomerResource extends Resource
{
    protected static ?string $model = Customer::class;

    protected static ?string $keyboardShortcut = 'c';

    protected static ?string $recordTitleAttribute = 'name';

    protected static string|\BackedEnum|null $navigationIcon = Heroicon::OutlinedUsers;

    protected static string|\UnitEnum|null $navigationGroup = 'Sales';

    protected static ?int $navigationSort = 1;

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('name')->required(),
            TextInput::make('email')->email()->required(),
            TextInput::make('city')->required(),
            Toggle::make('is_vip')->label('VIP'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')->searchable(),
                TextColumn::make('email')->searchable(),
                TextColumn::make('city'),
                IconColumn::make('is_vip')->label('VIP')->boolean(),
            ])
            ->filters([TernaryFilter::make('is_vip')->label('VIP')])
            ->toolbarActions([BulkActionGroup::make([DeleteBulkAction::make()])])
            ->defaultPaginationPageOption(10);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListCustomers::route('/'),
            'edit' => EditCustomer::route('/{record}/edit'),
        ];
    }
}
