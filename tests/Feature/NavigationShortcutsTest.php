<?php

declare(strict_types=1);

use Filament\Facades\Filament;
use Filament\Navigation\NavigationGroup;
use Filament\Navigation\NavigationItem;
use Filament\Panel;
use HoceineEl\KeyboardShortcuts\Support\NavigationChord;
use HoceineEl\KeyboardShortcuts\Support\NavigationShortcuts;
use HoceineEl\KeyboardShortcuts\Tests\Fixtures\Pins\MethodPinnedPage;
use HoceineEl\KeyboardShortcuts\Tests\Fixtures\Pins\PropertyPinnedResource;
use HoceineEl\KeyboardShortcuts\Tests\Fixtures\Pins\UnpinnedResource;

function navigationPanel(): Panel
{
    $panel = Panel::make()
        ->id('navigation-test')
        ->path('navigation-test')
        ->navigationGroups([NavigationGroup::make('Sales'), NavigationGroup::make('Settings')])
        ->navigationItems([
            NavigationItem::make('Dashboard')->url('/admin')->sort(-2),
            NavigationItem::make('Customers')->url('/admin/customers')->group('Sales')->sort(1),
            NavigationItem::make('Orders')->url('/admin/orders')->group('Sales')->sort(2),
            NavigationItem::make('Customer groups')->url('/admin/customer-groups')->group('Sales')->sort(3),
            NavigationItem::make('Users')->url('/admin/users')->group('Settings'),
            NavigationItem::make('Docs')->url('https://filamentphp.com', shouldOpenInNewTab: true)->group('Settings'),
            NavigationItem::make('Hidden')->url('/admin/hidden')->hidden(),
            NavigationItem::make('No url'),
        ]);

    Filament::registerPanel($panel);
    Filament::setCurrentPanel($panel);

    return $panel;
}

it('builds chords from the panel navigation in navigation order', function (): void {
    $chords = NavigationShortcuts::for(navigationPanel());

    expect(array_map(fn (NavigationChord $chord): array => [$chord->label, $chord->letter, $chord->group], $chords))
        ->toBe([
            ['Dashboard', 'd', null],
            ['Customers', 'c', 'Sales'],
            ['Orders', 'o', 'Sales'],
            ['Customer groups', 'g', 'Sales'],
            ['Users', 'u', 'Settings'],
            ['Docs', 's', 'Settings'],
        ]);
});

it('skips hidden items and items without a url', function (): void {
    $labels = array_map(fn (NavigationChord $chord): string => $chord->label, NavigationShortcuts::for(navigationPanel()));

    expect($labels)->not->toContain('Hidden')->not->toContain('No url');
});

it('keeps urls and the new tab flag', function (): void {
    $docs = collect(NavigationShortcuts::for(navigationPanel()))->firstWhere('label', 'Docs');

    expect($docs->url)->toBe('https://filamentphp.com')
        ->and($docs->shouldOpenInNewTab)->toBeTrue();
});

it('applies overrides by label', function (): void {
    $chords = collect(NavigationShortcuts::for(navigationPanel(), ['dashboard' => 'h', 'Users' => 'c']));

    expect($chords->firstWhere('label', 'Dashboard')->letter)->toBe('h')
        ->and($chords->firstWhere('label', 'Users')->letter)->toBe('c')
        ->and($chords->firstWhere('label', 'Customers')->letter)->toBe('u');
});

it('applies overrides by resource class through the item key', function (): void {
    $panel = navigationPanel()->navigationItems([
        NavigationItem::make('Clients')->url('/admin/clients')->key('App\\Filament\\Resources\\ClientResource'),
    ]);

    $chord = collect(NavigationShortcuts::for($panel, ['App\\Filament\\Resources\\ClientResource' => 'k']))
        ->firstWhere('label', 'Clients');

    expect($chord->letter)->toBe('k')
        ->and($chord->key)->toBe('App\\Filament\\Resources\\ClientResource');
});

it('serialises a chord for the client', function (): void {
    $chord = collect(NavigationShortcuts::for(navigationPanel()))->firstWhere('label', 'Orders');

    expect($chord->toArray())->toBe([
        'key' => 'Orders',
        'label' => 'Orders',
        'group' => 'Sales',
        'letter' => 'o',
        'url' => '/admin/orders',
        'newTab' => false,
    ]);
});

it('reads letters pinned on resource and page classes', function (): void {
    $panel = navigationPanel()->navigationItems([
        NavigationItem::make('Archive')->url('/admin/archive')->key(PropertyPinnedResource::class),
        NavigationItem::make('Reports')->url('/admin/reports')->key(MethodPinnedPage::class),
        NavigationItem::make('Notes')->url('/admin/notes')->key(UnpinnedResource::class),
    ]);

    $chords = collect(NavigationShortcuts::for($panel))->pluck('letter', 'label');

    expect($chords['Archive'])->toBe('z')
        ->and($chords['Reports'])->toBe('rp')
        ->and($chords['Notes'])->toBe('n');
});

it('lets plugin overrides beat pinned letters', function (): void {
    $panel = navigationPanel()->navigationItems([
        NavigationItem::make('Archive')->url('/admin/archive')->key(PropertyPinnedResource::class),
    ]);

    $chords = collect(NavigationShortcuts::for($panel, ['Dashboard' => 'z']))->pluck('letter', 'label');

    expect($chords['Dashboard'])->toBe('z')
        ->and($chords['Archive'])->toBe('a');
});

it('builds the key sequence of a two-letter chord', function (): void {
    $chord = new NavigationChord('k', 'Customer users', null, 'cu', '/admin/customer-users', false);

    expect($chord->sequence('g'))->toBe('g c u');
});
