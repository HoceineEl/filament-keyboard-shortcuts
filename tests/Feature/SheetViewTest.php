<?php

declare(strict_types=1);

use Filament\Facades\Filament;
use Filament\Support\Facades\FilamentView;
use Filament\View\PanelsRenderHook;
use HoceineEl\KeyboardShortcuts\KeyboardShortcutsPlugin;
use Illuminate\Foundation\Auth\User;
use Workbench\App\Filament\Resources\Customers\CustomerResource;

function renderSheet(): string
{
    return view('keyboard-shortcuts::sheet', ['plugin' => KeyboardShortcutsPlugin::get()])->render();
}

it('renders a labelled dialog with a search field', function (): void {
    usePanel();

    expect(renderSheet())
        ->toContain('role="dialog"')
        ->toContain('aria-labelledby="ks-title"')
        ->toContain('id="ks-title"')
        ->toContain('Keyboard shortcuts')
        ->toContain('type="search"')
        ->toContain('Search shortcuts…');
});

it('embeds the client config as json', function (): void {
    usePanel();

    preg_match('/<script type="application\/json" data-ks-config>(.*?)<\/script>/s', renderSheet(), $matches);

    $config = json_decode($matches[1], true, flags: JSON_THROW_ON_ERROR);

    expect($config['chords']['prefix'])->toBe('g')
        ->and($config['i18n']['then'])->toBe('then')
        ->and($config['i18n']['keys']['mod'])->toBe('Ctrl');
});

it('groups navigation rows under their navigation group', function (): void {
    usePanel();

    expect(preg_replace('/\s+/', ' ', renderSheet()))
        ->toContain('<h4 class="ks-group-title">Sales</h4>')
        ->toContain('class="ks-footer"');
});

it('renders every section with its rows', function (): void {
    usePanel();

    expect(renderSheet())
        ->toContain('data-ks-section="general"')
        ->toContain('data-ks-section="navigation"')
        ->toContain('data-ks-section="page-actions"')
        ->toContain('data-ks-section="table"')
        ->toContain('data-ks-requires="table"')
        ->toContain('data-ks-section="custom-billing"')
        ->toContain('Export invoices')
        ->toContain('Next row');
});

it('renders keys as kbd chips with platform data', function (): void {
    usePanel();

    expect(renderSheet())
        ->toContain('<kbd class="ks-kbd" data-ks-key="mod">Ctrl</kbd>')
        ->toContain('<kbd class="ks-kbd" data-ks-key="shift">Shift</kbd>')
        ->toContain('<kbd class="ks-kbd" data-ks-key="?">?</kbd>');
});

it('renders chords as two keys with a then separator', function (): void {
    usePanel();

    expect(preg_replace('/\s+/', ' ', renderSheet()))
        ->toContain('<kbd class="ks-kbd" data-ks-key="g">G</kbd> </span> <span class="ks-then">then</span> <span class="ks-combo"> <kbd class="ks-kbd" data-ks-key="c">C</kbd>');
});

it('makes rows searchable by label and keys', function (): void {
    usePanel();

    expect(renderSheet())->toContain('data-ks-search="customers sales" data-ks-keys="g c"')
        ->toContain('data-ks-keys="? mod /"');
});

it('renders the empty search state and the chord hint', function (): void {
    usePanel();

    expect(renderSheet())
        ->toContain('data-ks-empty')
        ->toContain('No shortcuts match “:query”')
        ->toContain('Clear search')
        ->toContain('data-ks-pill');
});

it('translates the sheet', function (string $locale, string $title, string $then): void {
    app()->setLocale($locale);
    usePanel();

    expect(renderSheet())->toContain($title)->toContain($then);
})->with([
    ['ar', 'اختصارات لوحة المفاتيح', 'ثم'],
    ['fr', 'Raccourcis clavier', 'puis'],
]);

it('renders the button inside the global search, wherever the panel places it, only when enabled', function (): void {
    $this->actingAs(new User);
    $plugin = usePanel();
    Filament::getPanel('admin')->resources([CustomerResource::class])->boot();

    expect(FilamentView::renderHook(PanelsRenderHook::GLOBAL_SEARCH_END)->toHtml())
        ->toContain('ks-topbar-btn')
        ->toContain('data-ks-open')
        ->toContain('Keyboard shortcuts (?)')
        ->and(FilamentView::renderHook(PanelsRenderHook::TOPBAR_END)->toHtml())->not->toContain('ks-topbar-btn')
        ->and(FilamentView::renderHook(PanelsRenderHook::SIDEBAR_FOOTER)->toHtml())->not->toContain('ks-topbar-btn');

    $plugin->topbarButton(false);

    expect(FilamentView::renderHook(PanelsRenderHook::GLOBAL_SEARCH_END)->toHtml())
        ->not->toContain('ks-topbar-btn');
});

it('falls back to the topbar when the panel has no global search', function (): void {
    usePanel();
    Filament::getPanel('admin')->globalSearch(false)->boot();

    expect(FilamentView::renderHook(PanelsRenderHook::TOPBAR_END)->toHtml())->toContain('ks-topbar-btn')
        ->and(FilamentView::renderHook(PanelsRenderHook::SIDEBAR_FOOTER)->toHtml())->not->toContain('ks-topbar-btn');
});

it('falls back to the sidebar footer when the panel has neither global search nor a topbar', function (): void {
    usePanel();
    Filament::getPanel('admin')->globalSearch(false)->topbar(false)->boot();

    expect(FilamentView::renderHook(PanelsRenderHook::SIDEBAR_FOOTER)->toHtml())->toContain('ks-topbar-btn');
});

it('renders the sheet at the end of the body of panels that use the plugin', function (): void {
    usePanel();
    Filament::getPanel('admin')->boot();

    expect(FilamentView::renderHook(PanelsRenderHook::BODY_END)->toHtml())->toContain('data-ks-root');
});

it('stays out of panels without the plugin', function (): void {
    $panel = Filament::getPanel('plain');
    Filament::setCurrentPanel($panel);
    $panel->boot();

    expect(FilamentView::renderHook(PanelsRenderHook::BODY_END)->toHtml())->not->toContain('data-ks-root')
        ->and(FilamentView::renderHook(PanelsRenderHook::GLOBAL_SEARCH_END)->toHtml())->not->toContain('ks-topbar-btn');
});

it('does not mark the closed sheet as a modal, so Filament key bindings keep working', function (): void {
    usePanel();

    expect(renderSheet())->not->toContain('aria-modal');
});
