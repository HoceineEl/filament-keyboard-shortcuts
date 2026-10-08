@php
    use HoceineEl\KeyboardShortcuts\Support\KeyCombo;
    use Illuminate\Support\Str;

    $tokens = collect($row['keys'])->flatMap(fn (string $binding): array => collect(explode(' ', $binding))->flatMap(KeyCombo::tokens(...))->all());
@endphp

<div class="ks-row" data-ks-row data-ks-search="{{ Str::lower(trim($row['label'].' '.$row['meta'])) }}" data-ks-keys="{{ $tokens->unique()->implode(' ') }}">
    <dt class="ks-label">{{ $row['label'] }}</dt>
    <dd class="ks-row-keys">
        @include('keyboard-shortcuts::partials.keys', ['keys' => $row['keys']])
    </dd>
</div>
