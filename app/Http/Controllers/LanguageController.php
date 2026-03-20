<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class LanguageController extends Controller
{
    private const SUPPORTED = ['en', 'es'];

    public function switch(Request $request, string $locale): RedirectResponse
    {
        if (! in_array($locale, self::SUPPORTED)) {
            abort(404);
        }

        Session::put('locale', $locale);

        return redirect()->back();
    }
}
