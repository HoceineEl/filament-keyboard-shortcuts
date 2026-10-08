<?php

declare(strict_types=1);

namespace Workbench\App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApplyWorkbenchPreferences
{
    public function handle(Request $request, Closure $next): Response
    {
        foreach (['locale', 'big', 'hints', 'topbar'] as $key) {
            if ($request->has($key)) {
                $request->session()->put("workbench.{$key}", $request->query($key));
            }
        }

        $locales = array_map(basename(...), glob(dirname(__DIR__, 4).'/resources/lang/*', GLOB_ONLYDIR) ?: []);

        if (in_array($locale = $request->session()->get('workbench.locale'), $locales, true)) {
            app()->setLocale($locale);
        }

        return $next($request);
    }
}
