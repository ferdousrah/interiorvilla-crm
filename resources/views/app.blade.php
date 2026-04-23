<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">

        {{-- PWA --}}
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="#6366f1">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="IVMS">

        {{-- Icons / Favicon --}}
        @php $logo = \App\Models\Setting::get('company_logo'); @endphp
        @if($logo)
            <link rel="icon" href="/storage/{{ $logo }}">
            <link rel="apple-touch-icon" href="/storage/{{ $logo }}">
        @else
            <link rel="icon" type="image/svg+xml" href="/icons/icon.svg">
            <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png">
            <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png">
        @endif

        {{-- Fonts --}}
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:300,400,500,600,700" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
