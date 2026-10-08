<?php

declare(strict_types=1);

namespace HoceineEl\KeyboardShortcuts;

use Filament\Support\Facades\FilamentAsset;
use HoceineEl\KeyboardShortcuts\Assets\KeyboardShortcutsCss;
use HoceineEl\KeyboardShortcuts\Assets\KeyboardShortcutsJs;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

class KeyboardShortcutsServiceProvider extends PackageServiceProvider
{
    public static string $name = 'keyboard-shortcuts';

    public function configurePackage(Package $package): void
    {
        $package
            ->name(static::$name)
            ->hasViews(static::$name)
            ->hasTranslations();
    }

    public function packageBooted(): void
    {
        FilamentAsset::register([
            KeyboardShortcutsJs::make('keyboard-shortcuts', __DIR__.'/../dist/keyboard-shortcuts.js'),
            KeyboardShortcutsCss::make('keyboard-shortcuts', __DIR__.'/../dist/keyboard-shortcuts.css'),
        ], 'hoceineel/filament-keyboard-shortcuts');
    }
}
