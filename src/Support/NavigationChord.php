<?php

declare(strict_types=1);

namespace HoceineEl\KeyboardShortcuts\Support;

final readonly class NavigationChord
{
    public function __construct(
        public string $key,
        public string $label,
        public ?string $group,
        public string $letter,
        public string $url,
        public bool $shouldOpenInNewTab,
    ) {}

    public function sequence(string $prefix): string
    {
        return implode(' ', [$prefix, ...str_split($this->letter)]);
    }

    /**
     * @return array{key: string, label: string, group: ?string, letter: string, url: string, newTab: bool}
     */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
            'group' => $this->group,
            'letter' => $this->letter,
            'url' => $this->url,
            'newTab' => $this->shouldOpenInNewTab,
        ];
    }
}
