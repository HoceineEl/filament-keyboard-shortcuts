@php
    use Filament\Support\Icons\Heroicon;
@endphp

<div class="ks-root" data-ks-root x-data>
    <script type="application/json" data-ks-config>@json($plugin->getClientConfig())</script>

    <div class="ks-sheet" data-ks-sheet hidden>
        <div class="ks-scrim" data-ks-close aria-hidden="true"></div>

        <div class="ks-dialog" role="dialog" aria-labelledby="ks-title" tabindex="-1" data-ks-dialog>
            <header class="ks-header">
                <div class="ks-heading">
                    <h2 id="ks-title" class="ks-title">{{ __('keyboard-shortcuts::shortcuts.title') }}</h2>
                    <p class="ks-platform" data-ks-platform data-ks-mac="{{ __('keyboard-shortcuts::shortcuts.platform.mac') }}">{{ __('keyboard-shortcuts::shortcuts.platform.other') }}</p>
                </div>

                <button type="button" class="ks-close" data-ks-close aria-label="{{ __('keyboard-shortcuts::shortcuts.close') }}" title="{{ __('keyboard-shortcuts::shortcuts.close') }}">
                    <x-filament::icon :icon="Heroicon::XMark" class="ks-icon" />
                </button>

                <div class="ks-search">
                    <label for="ks-search" class="ks-sr-only">{{ __('keyboard-shortcuts::shortcuts.search') }}</label>
                    <x-filament::icon :icon="Heroicon::MagnifyingGlass" class="ks-icon ks-search-icon" />
                    <input id="ks-search" type="search" class="ks-search-input" data-ks-search autocomplete="off" spellcheck="false" placeholder="{{ __('keyboard-shortcuts::shortcuts.search_placeholder') }}" />
                </div>
            </header>

            <div class="ks-body" data-ks-body>
                @foreach ($plugin->getSheetSections() as $section)
                    <section
                        class="ks-section"
                        data-ks-section="{{ $section['id'] }}"
                        @if ($section['requires']) data-ks-requires="{{ $section['requires'] }}" @endif
                        @if ($section['dynamic']) data-ks-dynamic hidden @endif
                        aria-labelledby="ks-section-{{ $section['id'] }}"
                    >
                        <h3 id="ks-section-{{ $section['id'] }}" class="ks-section-title">{{ $section['label'] }}</h3>

                        @foreach (collect($section['rows'])->groupBy(fn (array $row): string => (string) $row['meta']) as $group => $rows)
                            <div class="ks-group" data-ks-group>
                                @if (filled($group))
                                    <h4 class="ks-group-title">{{ $group }}</h4>
                                @endif

                                <dl class="ks-list" data-ks-list>
                                    @foreach ($rows as $row)
                                        @include('keyboard-shortcuts::partials.row', ['row' => $row])
                                    @endforeach
                                </dl>
                            </div>
                        @endforeach

                        @if ($section['rows'] === [])
                            <div class="ks-group" data-ks-group>
                                <dl class="ks-list" data-ks-list></dl>
                            </div>
                        @endif
                    </section>
                @endforeach

                <div class="ks-empty" data-ks-empty hidden>
                    <x-filament::icon :icon="Heroicon::OutlinedCommandLine" class="ks-empty-icon" />
                    <p class="ks-empty-text" data-ks-empty-text data-ks-template="{{ __('keyboard-shortcuts::shortcuts.empty', ['query' => ':query']) }}"></p>
                    <p class="ks-empty-hint">{{ __('keyboard-shortcuts::shortcuts.empty_hint') }}</p>
                    <button type="button" class="ks-clear" data-ks-clear>{{ __('keyboard-shortcuts::shortcuts.clear') }}</button>
                </div>
            </div>

            @if (filled($plugin->getSheetKeyBindings()))
                <footer class="ks-footer" aria-hidden="true">
                    <span class="ks-footer-item">
                        @include('keyboard-shortcuts::partials.keys', ['keys' => [$plugin->getSheetKeyBindings()[0]]])
                        {{ __('keyboard-shortcuts::shortcuts.footer.open') }}
                    </span>
                    <span class="ks-footer-item">
                        @include('keyboard-shortcuts::partials.keys', ['keys' => ['escape']])
                        {{ __('keyboard-shortcuts::shortcuts.footer.close') }}
                    </span>
                </footer>
            @endif
        </div>
    </div>

    <div class="ks-pill" data-ks-pill role="status" aria-live="polite" hidden>
        <span class="ks-pill-keys" data-ks-pill-keys aria-hidden="true"></span>
        <span class="ks-pill-text" aria-hidden="true">{{ __('keyboard-shortcuts::shortcuts.chord_next') }}</span>
        <span class="ks-sr-only">{{ __('keyboard-shortcuts::shortcuts.chord_waiting') }}</span>
    </div>

    <div class="ks-hints" data-ks-hints aria-hidden="true" hidden></div>
</div>
