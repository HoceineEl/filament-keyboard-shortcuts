<?php

declare(strict_types=1);

namespace HoceineEl\KeyboardShortcuts\Enums;

enum ShortcutBehavior: string
{
    case Url = 'url';
    case Dispatch = 'dispatch';
    case Js = 'js';
}
