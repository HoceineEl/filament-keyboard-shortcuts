<x-filament::icon-button
    color="gray"
    :icon="new \Illuminate\Support\HtmlString(view('keyboard-shortcuts::partials.keyboard-icon')->render())"
    icon-alias="keyboard-shortcuts::topbar-button"
    :label="__('keyboard-shortcuts::shortcuts.open')"
    :tooltip="$plugin->getTopbarTooltip()"
    class="ks-topbar-btn"
    data-ks-open
/>
