<?php

declare(strict_types=1);

namespace HoceineEl\KeyboardShortcuts\Support;

use Illuminate\Support\Str;
use InvalidArgumentException;

final class ChordAssigner
{
    private const array DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

    /**
     * @param  array<string, array{label: string, aliases?: list<string>, pinned?: ?string}>  $items
     * @param  array<string, string>  $overrides
     * @return array<string, ?string>
     */
    public static function assign(array $items, array $overrides = []): array
    {
        $assigned = array_fill_keys(array_keys($items), null);

        foreach ($overrides as $target => $letters) {
            $key = self::resolveOverrideTarget($items, (string) $target);

            if ($key !== null) {
                $assigned[$key] = self::validate($letters);
            }
        }

        $used = array_values(array_filter($assigned));

        foreach ($items as $key => $item) {
            if (blank($item['pinned'] ?? null)) {
                continue;
            }

            $pinned = self::validate((string) $item['pinned'], $key);

            if ($assigned[$key] === null && ! in_array($pinned, $used, true)) {
                $assigned[$key] = $used[] = $pinned;
            }
        }

        foreach ($items as $key => $item) {
            if ($assigned[$key] !== null) {
                continue;
            }

            foreach ([...self::singles($item), ...self::pairs($item), ...self::DIGITS] as $candidate) {
                if (! in_array($candidate, $used, true)) {
                    $assigned[$key] = $used[] = $candidate;

                    break;
                }
            }
        }

        return $assigned;
    }

    public static function validate(string $letters, ?string $source = null): string
    {
        $letters = Str::lower(trim($letters));

        if (preg_match('/^[a-z0-9]{1,2}$/', $letters) !== 1) {
            $for = $source === null ? '' : " for [{$source}]";

            throw new InvalidArgumentException("Keyboard Shortcuts: a navigation chord must be one or two letters or digits, [{$letters}] given{$for}.");
        }

        return $letters;
    }

    /**
     * @param  array{label: string, aliases?: list<string>}  $item
     * @return list<string>
     */
    private static function singles(array $item): array
    {
        $words = self::words($item);

        return array_values(array_unique([
            ...array_map(fn (string $word): string => $word[0], $words),
            ...str_split(implode('', $words)),
        ]));
    }

    /**
     * @param  array{label: string, aliases?: list<string>}  $item
     * @return list<string>
     */
    private static function pairs(array $item): array
    {
        $words = self::words($item);
        $pairs = [];

        foreach ($words as $index => $word) {
            foreach (array_slice($words, $index + 1) as $next) {
                $pairs[] = $word[0].$next[0];
            }
        }

        foreach ($words as $index => $word) {
            foreach (str_split(substr(implode('', array_slice($words, $index)), 1)) as $letter) {
                $pairs[] = $word[0].$letter;
            }
        }

        return array_values(array_unique($pairs));
    }

    /**
     * @param  array{label: string, aliases?: list<string>}  $item
     * @return list<string>
     */
    private static function words(array $item): array
    {
        $words = [];

        foreach ([$item['label'], ...($item['aliases'] ?? [])] as $phrase) {
            $latin = (string) preg_replace('/[^\p{Latin}\p{N}]+/u', ' ', Str::snake($phrase, ' '));
            $ascii = Str::lower(Str::ascii($latin));

            preg_match_all('/[a-z0-9]+/', $ascii, $matches);

            array_push($words, ...$matches[0]);
        }

        return $words;
    }

    /**
     * @param  array<string, array{label: string, aliases?: list<string>}>  $items
     */
    private static function resolveOverrideTarget(array $items, string $target): ?string
    {
        if (array_key_exists($target, $items)) {
            return $target;
        }

        $needle = Str::lower($target);

        foreach ($items as $key => $item) {
            $names = array_map(Str::lower(...), [$item['label'], ...($item['aliases'] ?? [])]);

            if (in_array($needle, $names, true)) {
                return $key;
            }
        }

        return null;
    }
}
