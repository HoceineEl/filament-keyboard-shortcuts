<?php

declare(strict_types=1);

namespace HoceineEl\KeyboardShortcuts;

use Closure;
use Filament\Support\Concerns\EvaluatesClosures;
use HoceineEl\KeyboardShortcuts\Enums\ShortcutBehavior;
use HoceineEl\KeyboardShortcuts\Enums\ShortcutGroup;
use HoceineEl\KeyboardShortcuts\Support\KeyCombo;
use LogicException;

class Shortcut
{
    use EvaluatesClosures;

    /**
     * @var list<string>
     */
    protected array $keys;

    protected string|Closure|null $label = null;

    protected string|ShortcutGroup|Closure|null $group = null;

    protected ?ShortcutBehavior $behavior = null;

    protected string|Closure|null $url = null;

    protected bool|Closure $shouldOpenUrlInNewTab = false;

    protected ?string $event = null;

    /**
     * @var array<string, mixed> | Closure
     */
    protected array|Closure $payload = [];

    protected ?string $js = null;

    protected bool|Closure $isVisible = true;

    /**
     * @param  string | list<string>  $keys
     */
    final public function __construct(string|array $keys)
    {
        $this->keys = array_map(KeyCombo::assertAllowed(...), array_values((array) $keys));
    }

    /**
     * @param  string | list<string>  $keys
     */
    public static function make(string|array $keys): static
    {
        return app(static::class, ['keys' => $keys]);
    }

    public function label(string|Closure|null $label): static
    {
        $this->label = $label;

        return $this;
    }

    public function group(string|ShortcutGroup|Closure|null $group): static
    {
        $this->group = $group;

        return $this;
    }

    public function url(string|Closure|null $url, bool|Closure $shouldOpenInNewTab = false): static
    {
        $this->behavior = ShortcutBehavior::Url;
        $this->url = $url;
        $this->shouldOpenUrlInNewTab = $shouldOpenInNewTab;

        return $this;
    }

    /**
     * @param  array<string, mixed> | Closure  $payload
     */
    public function dispatch(string $event, array|Closure $payload = []): static
    {
        $this->behavior = ShortcutBehavior::Dispatch;
        $this->event = $event;
        $this->payload = $payload;

        return $this;
    }

    public function js(string $expression): static
    {
        $this->behavior = ShortcutBehavior::Js;
        $this->js = $expression;

        return $this;
    }

    public function visible(bool|Closure $condition = true): static
    {
        $this->isVisible = $condition;

        return $this;
    }

    public function hidden(bool|Closure $condition = true): static
    {
        $this->isVisible = fn (): bool => ! $this->evaluate($condition);

        return $this;
    }

    /**
     * @return list<string>
     */
    public function getKeys(): array
    {
        return $this->keys;
    }

    public function getLabel(): string
    {
        return $this->evaluate($this->label) ?? implode(', ', $this->keys);
    }

    public function getGroup(): string
    {
        $group = $this->evaluate($this->group) ?? ShortcutGroup::Custom;

        return $group instanceof ShortcutGroup ? $group->getLabel() : $group;
    }

    public function getBehavior(): ?ShortcutBehavior
    {
        return $this->behavior;
    }

    public function getUrl(): ?string
    {
        return $this->evaluate($this->url);
    }

    public function shouldOpenUrlInNewTab(): bool
    {
        return (bool) $this->evaluate($this->shouldOpenUrlInNewTab);
    }

    public function isVisible(): bool
    {
        return (bool) $this->evaluate($this->isVisible);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $base = [
            'keys' => $this->getKeys(),
            'label' => $this->getLabel(),
            'group' => $this->getGroup(),
            'behavior' => $this->behavior?->value,
        ];

        return match ($this->behavior) {
            ShortcutBehavior::Url => [...$base, 'url' => $this->getUrl(), 'newTab' => $this->shouldOpenUrlInNewTab()],
            ShortcutBehavior::Dispatch => [...$base, 'event' => $this->event, 'payload' => $this->evaluate($this->payload)],
            ShortcutBehavior::Js => [...$base, 'js' => $this->js],
            null => throw new LogicException('Keyboard Shortcuts: the ['.implode(', ', $this->keys).'] shortcut needs ->url(), ->dispatch() or ->js().'),
        };
    }
}
