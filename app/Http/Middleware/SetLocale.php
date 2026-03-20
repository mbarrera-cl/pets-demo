<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    private const SUPPORTED = ['en', 'es'];
    private const DEFAULT   = 'en';

    public function handle(Request $request, Closure $next): Response
    {
        $locale = Session::get('locale', config('app.locale', self::DEFAULT));

        if (! in_array($locale, self::SUPPORTED)) {
            $locale = self::DEFAULT;
        }

        App::setLocale($locale);

        return $next($request);
    }
}
