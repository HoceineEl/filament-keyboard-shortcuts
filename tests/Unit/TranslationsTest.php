<?php

declare(strict_types=1);

use Illuminate\Support\Arr;

const SAME_AS_ENGLISH = [
    'de' => ['groups.navigation'],
    'es' => ['groups.general'],
    'fr' => ['groups.navigation'],
];

/**
 * @return array<string, string>
 */
function shortcutTranslations(string $locale): array
{
    return Arr::dot(require __DIR__."/../../resources/lang/{$locale}/shortcuts.php");
}

/**
 * @return list<string>
 */
function translationPlaceholders(string $value): array
{
    preg_match_all('/:[a-z_]+/', $value, $matches);

    return $matches[0];
}

dataset('locales', fn (): array => array_values(array_diff(
    array_map(basename(...), glob(__DIR__.'/../../resources/lang/*', GLOB_ONLYDIR) ?: []),
    ['en'],
)));

it('ships every locale Filament users reach for', function (): void {
    $locales = array_map(basename(...), glob(__DIR__.'/../../resources/lang/*', GLOB_ONLYDIR) ?: []);

    expect($locales)->toEqualCanonicalizing([
        'ar', 'cs', 'de', 'en', 'es', 'fa', 'fr', 'he', 'hi', 'id', 'it', 'ja',
        'ko', 'nl', 'pl', 'pt', 'pt_BR', 'ru', 'tr', 'uk', 'vi', 'zh_CN', 'zh_TW',
    ]);
});

it('has the same keys as English', function (string $locale): void {
    expect(array_keys(shortcutTranslations($locale)))->toBe(array_keys(shortcutTranslations('en')));
})->with('locales');

it('keeps the English placeholders', function (string $locale): void {
    $translated = shortcutTranslations($locale);

    foreach (shortcutTranslations('en') as $key => $value) {
        expect(translationPlaceholders($translated[$key]))->toEqualCanonicalizing(translationPlaceholders($value), "{$locale}: {$key}");
    }
})->with('locales');

it('has no empty values', function (string $locale): void {
    foreach (shortcutTranslations($locale) as $key => $value) {
        expect($value)->toBeString()
            ->and(trim($value))->not->toBe('', "{$locale}: {$key}");
    }
})->with('locales');

it('translates every value that is not a key label', function (string $locale): void {
    $translated = shortcutTranslations($locale);
    $allowed = SAME_AS_ENGLISH[$locale] ?? [];

    $untranslated = array_keys(array_filter(
        shortcutTranslations('en'),
        fn (string $value, string $key): bool => $translated[$key] === $value && ! str_starts_with($key, 'keys.') && ! in_array($key, $allowed, true),
        ARRAY_FILTER_USE_BOTH,
    ));

    expect($untranslated)->toBe([]);
})->with('locales');
