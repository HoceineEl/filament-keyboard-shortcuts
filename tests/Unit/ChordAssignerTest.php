<?php

declare(strict_types=1);

use HoceineEl\KeyboardShortcuts\Support\ChordAssigner;

function items(string ...$labels): array
{
    return collect($labels)->mapWithKeys(fn (string $label): array => [$label => ['label' => $label]])->all();
}

it('uses the first letter of each label', function (): void {
    expect(ChordAssigner::assign(items('Dashboard', 'Customers', 'Orders')))
        ->toBe(['Dashboard' => 'd', 'Customers' => 'c', 'Orders' => 'o']);
});

it('falls back to the initial of another word, then any unused letter', function (): void {
    expect(ChordAssigner::assign(items('Customers', 'Customer groups', 'Categories')))
        ->toBe(['Customers' => 'c', 'Customer groups' => 'g', 'Categories' => 'a']);
});

it('lets overrides claim their letter first', function (): void {
    $items = [
        'App\\Filament\\Resources\\OrderResource' => ['label' => 'Orders'],
        'App\\Filament\\Resources\\CustomerResource' => ['label' => 'Customers'],
    ];

    expect(ChordAssigner::assign($items, ['App\\Filament\\Resources\\OrderResource' => 'C']))
        ->toBe([
            'App\\Filament\\Resources\\OrderResource' => 'c',
            'App\\Filament\\Resources\\CustomerResource' => 'u',
        ]);
});

it('matches overrides by label or alias, ignoring case', function (): void {
    $items = [
        'App\\Filament\\Pages\\Dashboard' => ['label' => 'Home', 'aliases' => ['dashboard']],
        'reports' => ['label' => 'Reports'],
    ];

    expect(ChordAssigner::assign($items, ['dashboard' => 'h', 'REPORTS' => 'x']))
        ->toBe(['App\\Filament\\Pages\\Dashboard' => 'h', 'reports' => 'x']);
});

it('uses aliases when the label has no latin letters', function (): void {
    $items = ['App\\Filament\\Resources\\CustomerResource' => ['label' => 'العملاء', 'aliases' => ['customer']]];

    expect(ChordAssigner::assign($items))->toBe(['App\\Filament\\Resources\\CustomerResource' => 'c']);
});

it('falls back to digits, then to no chord', function (): void {
    $keys = array_map(fn (int $index): string => "A{$index}", range(1, 13));
    $items = array_fill_keys($keys, ['label' => 'A']);

    expect(array_values(ChordAssigner::assign($items)))
        ->toBe(['a', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', null, null]);
});

it('is stable for the same input', function (): void {
    $items = items('Invoices', 'Inventory', 'Imports', 'Integrations');

    expect(ChordAssigner::assign($items))->toBe(ChordAssigner::assign($items))
        ->and(ChordAssigner::assign($items))->toBe([
            'Invoices' => 'i',
            'Inventory' => 'n',
            'Imports' => 'm',
            'Integrations' => 't',
        ]);
});

it('ignores overrides that match nothing', function (): void {
    expect(ChordAssigner::assign(items('Orders'), ['Missing' => 'o']))->toBe(['Orders' => 'o']);
});

it('rejects overrides that are not one or two letters or digits', function (string $letters): void {
    ChordAssigner::assign(items('Orders'), ['Orders' => $letters]);
})->with(['ord', '#', ''])->throws(InvalidArgumentException::class);

it('accepts two-letter overrides', function (): void {
    expect(ChordAssigner::assign(items('Orders', 'Outbox'), ['Outbox' => 'OB']))
        ->toBe(['Orders' => 'o', 'Outbox' => 'ob']);
});

it('falls back to two-letter chords from word initials before digits', function (): void {
    $labels = array_map(fn (string $letter): string => ucfirst($letter).'x', range('a', 'z'));

    $assigned = ChordAssigner::assign(items(...[...$labels, 'Customer users', 'Cash', 'Credit notes']));

    expect(array_slice($assigned, 0, 3))->toBe(['Ax' => 'a', 'Bx' => 'b', 'Cx' => 'c'])
        ->and(array_slice($assigned, 26))->toBe(['Customer users' => 'cu', 'Cash' => 'ca', 'Credit notes' => 'cn']);
});

it('uses later letters of the label when initials pairs are taken', function (): void {
    $labels = array_map(fn (string $letter): string => ucfirst($letter).'x', range('a', 'z'));

    $assigned = ChordAssigner::assign(items(...[...$labels, 'Orders', 'Outbox', 'Odd']));

    expect(array_slice($assigned, 26))->toBe(['Orders' => 'or', 'Outbox' => 'ou', 'Odd' => 'od']);
});

it('keeps earlier assignments when items are added at the end', function (): void {
    $labels = ['Invoices', 'Inventory', 'Imports', 'Integrations', 'Insights'];

    $before = ChordAssigner::assign(items(...$labels));
    $after = ChordAssigner::assign(items(...[...$labels, 'Invites', 'Issues']));

    expect(array_slice($after, 0, 5))->toBe($before);
});

it('honours pinned letters after overrides and before automatic letters', function (): void {
    $items = [
        'Orders' => ['label' => 'Orders'],
        'Outbox' => ['label' => 'Outbox', 'pinned' => 'o'],
        'Customers' => ['label' => 'Customers', 'pinned' => 'C'],
        'Clients' => ['label' => 'Clients', 'pinned' => 'x'],
    ];

    expect(ChordAssigner::assign($items, ['Clients' => 'c']))
        ->toBe(['Orders' => 'r', 'Outbox' => 'o', 'Customers' => 'u', 'Clients' => 'c']);
});

it('rejects invalid pinned letters and names the source', function (): void {
    ChordAssigner::assign(['App\\Pages\\Reports' => ['label' => 'Reports', 'pinned' => 'rep']]);
})->throws(InvalidArgumentException::class, 'for [App\\Pages\\Reports]');
