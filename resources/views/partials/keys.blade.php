@php
    use HoceineEl\KeyboardShortcuts\Support\KeyCombo;
@endphp

<span class="ks-keys">
    @foreach ($keys as $binding)
        @if (! $loop->first)
            <span class="ks-or">{{ __('keyboard-shortcuts::shortcuts.or') }}</span>
        @endif

        <span class="ks-chord">
            @foreach (explode(' ', $binding) as $step)
                @if (! $loop->first)
                    <span class="ks-then">{{ __('keyboard-shortcuts::shortcuts.then') }}</span>
                @endif

                <span class="ks-combo">
                    @foreach (KeyCombo::tokens($step) as $token)
                        <kbd class="ks-kbd" data-ks-key="{{ $token }}">{{ KeyCombo::label($token) }}</kbd>
                    @endforeach
                </span>
            @endforeach
        </span>
    @endforeach
</span>
