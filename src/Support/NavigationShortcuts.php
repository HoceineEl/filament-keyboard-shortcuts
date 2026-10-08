<?php

declare(strict_types=1);

namespace HoceineEl\KeyboardShortcuts\Support;

use Filament\Navigation\NavigationGroup;
use Filament\Navigation\NavigationItem;
use Filament\Panel;
use Illuminate\Support\Str;
use ReflectionClass;

final class NavigationShortcuts
{
    /**
     * @param  array<string, string>  $overrides
     * @return list<NavigationChord>
     */
    public static function for(Panel $panel, array $overrides = []): array
    {
        $entries = [];

        foreach ($panel->getNavigation() as $group) {
            foreach (self::flatten($group) as $item) {
                $url = $item->getUrl();

                if (blank($url) || $item->isHidden()) {
                    continue;
                }

                $key = $item->getKey();

                $entries[$key] ??= [
                    'label' => $item->getLabel(),
                    'aliases' => self::aliases($key, $url),
                    'pinned' => self::pinned($key),
                    'group' => $group->getLabel(),
                    'url' => $url,
                    'newTab' => $item->shouldOpenUrlInNewTab(),
                ];
            }
        }

        $letters = ChordAssigner::assign($entries, $overrides);

        $chords = [];

        foreach ($entries as $key => $entry) {
            if ($letters[$key] === null) {
                continue;
            }

            $chords[] = new NavigationChord(
                key: $key,
                label: $entry['label'],
                group: $entry['group'],
                letter: $letters[$key],
                url: $entry['url'],
                shouldOpenInNewTab: $entry['newTab'],
            );
        }

        return $chords;
    }

    /**
     * @return list<NavigationItem>
     */
    private static function flatten(NavigationGroup $group): array
    {
        $items = [];

        foreach ($group->getItems() as $item) {
            $items[] = $item;

            foreach ($item->getChildItems() as $child) {
                $items[] = $child;
            }
        }

        return $items;
    }

    private static function pinned(string $key): ?string
    {
        if (! class_exists($key)) {
            return null;
        }

        $class = new ReflectionClass($key);
        $value = null;

        if ($class->hasMethod('getKeyboardShortcut')) {
            $method = $class->getMethod('getKeyboardShortcut');

            if ($method->isStatic() && $method->isPublic() && $method->getNumberOfRequiredParameters() === 0) {
                $value = $method->invoke(null);
            }
        } elseif ($class->hasProperty('keyboardShortcut')) {
            $property = $class->getProperty('keyboardShortcut');

            if ($property->isStatic() && $property->isInitialized()) {
                $value = $property->getValue();
            }
        }

        return is_string($value) && $value !== '' ? $value : null;
    }

    /**
     * @return list<string>
     */
    private static function aliases(string $key, string $url): array
    {
        $aliases = [];

        if (class_exists($key)) {
            $aliases[] = Str::of(class_basename($key))->beforeLast('Resource')->beforeLast('Page')->snake(' ')->toString();
        }

        $path = trim((string) parse_url($url, PHP_URL_PATH), '/');

        if ($path !== '') {
            $aliases[] = str_replace('-', ' ', Str::afterLast($path, '/'));
        }

        return $aliases;
    }
}
