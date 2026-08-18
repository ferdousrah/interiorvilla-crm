<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Company Profile — {{ $companyName }}</title>
<style>
    @font-face {
        font-family: 'Marcellus';
        font-style: normal;
        font-weight: normal;
        src: url('{{ public_path('fonts/Marcellus-Regular.ttf') }}') format('truetype');
    }
    @page { margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DejaVu Sans', sans-serif; font-size: 13px; color: #1f2937; }

    .page { width: 100%; height: 1121px; position: relative; overflow: hidden; page-break-after: always; background: #ffffff; }
    .page.last { page-break-after: avoid; }
    .pad { padding: 44px 64px 0 64px; }

    .display { font-family: 'Marcellus', 'DejaVu Serif', serif; font-weight: normal; }

    .overline { font-size: 11px; letter-spacing: 4px; color: #059669; font-weight: bold; text-transform: uppercase; }
    .muted { color: #6b7280; }

    table { border-collapse: collapse; }
    .w-full { width: 100%; }

    /* Inner page header */
    .hdr-table { width: 100%; border-bottom: 1px solid #e5e7eb; }
    .hdr-table td { padding-bottom: 14px; vertical-align: middle; }
    .hdr-brand { font-size: 11px; letter-spacing: 3px; color: #111827; font-weight: bold; }
    .hdr-label { font-size: 11px; letter-spacing: 2px; color: #9ca3af; text-align: right; }

    /* Inner page footer */
    .page-foot { position: absolute; bottom: 36px; left: 64px; right: 64px; }
    .page-foot td { font-size: 11px; letter-spacing: 2px; color: #9ca3af; }
    .page-foot .num { font-family: 'Marcellus', 'DejaVu Serif', serif; font-size: 13px; color: #111827; text-align: right; }

    .section-title { font-family: 'Marcellus', 'DejaVu Serif', serif; font-size: 34px; color: #111827; margin-top: 12px; }

    .photo-ph { background: #e8efe9; text-align: center; vertical-align: middle; }
    .photo-ph span { font-size: 10px; letter-spacing: 3px; color: #8aa193; font-weight: bold; }
</style>
</head>
<body>

@php
    $pageNo = 1;
    $featuredPhotos = $featured ? array_values($featured->photos ?? []) : [];
    $coverPhoto = $coverPhoto ?: ($featuredPhotos ? $resolveImage($featuredPhotos[0]) : null);
    $aboutParas = preg_split('/\n\s*\n/', trim($content['profile_about'] ?? ''));
    $ceoParas = preg_split('/\n\s*\n/', trim($ceoMessage ?? ''));
    $gridPages = $gridProjects->chunk(4);
@endphp

{{-- ================= PAGE 1 · COVER ================= --}}
<div class="page">
    <div style="padding: 56px 64px 0 64px;">
        <table>
            <tr>
                @if($companyLogo)
                    <td style="padding-right: 14px;"><img src="{{ $companyLogo }}" style="width: 54px;"></td>
                @endif
                <td>
                    <div class="display" style="font-size: 20px; letter-spacing: 1px; color: #111827;">{{ strtoupper($companyName) }}</div>
                    <div style="font-size: 9px; letter-spacing: 4px; color: #059669; font-weight: bold; margin-top: 2px;">{{ strtoupper($companyTagline) }}</div>
                </td>
            </tr>
        </table>

        <div style="margin-top: 110px;">
            <table>
                <tr>
                    <td style="width: 34px; padding-right: 12px;"><div style="width: 34px; height: 2px; background: #059669;"></div></td>
                    <td><span class="overline" style="letter-spacing: 5px; font-size: 12px;">{{ $profileLabel ?? 'Company Profile' }} &middot; {{ now()->format('Y') }}</span></td>
                </tr>
            </table>
            <div class="display" style="font-size: 54px; line-height: 1.15; color: #111827; margin-top: 16px;">{!! nl2br(e($content['profile_headline'])) !!}</div>
            <div style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-top: 16px; width: 460px; text-align: justify;">{{ $content['profile_intro'] }}</div>
        </div>
    </div>

    <div style="position: absolute; top: 545px; left: 0; right: 0; bottom: 76px;">
        @if($coverPhoto)
            <img src="{{ $coverPhoto }}" style="width: 100%; height: 500px;">
        @else
            <table class="w-full" style="height: 500px;"><tr><td class="photo-ph"><span>SIGNATURE PROJECT PHOTO</span></td></tr></table>
        @endif
    </div>

    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: #111827; border-top: 3px solid #059669; padding: 20px 64px;">
        <table class="w-full">
            <tr>
                <td class="display" style="font-size: 18px; color: #ffffff; letter-spacing: 1px;">{{ $companyTagline }}</td>
                <td style="font-size: 12px; letter-spacing: 2px; color: #9ca3af; text-align: right;">{{ $website }}</td>
            </tr>
        </table>
    </div>
</div>

{{-- ================= PAGE 2 · MESSAGE FROM THE CEO ================= --}}
@php $pageNo++; @endphp
<div class="page">
    <div class="pad">
        <table class="hdr-table">
            <tr>
                <td style="width: 40px;">@if($companyLogo)<img src="{{ $companyLogo }}" style="width: 30px;">@endif</td>
                <td class="hdr-brand">{{ strtoupper($companyName) }}</td>
                <td class="hdr-label">COMPANY PROFILE</td>
            </tr>
        </table>

        <div style="margin-top: 40px;">
            <div class="overline">Leadership</div>
            <div class="section-title">Message from the CEO</div>
        </div>

        <table class="w-full" style="margin-top: 30px;">
            <tr>
                <td style="width: 270px; vertical-align: top; padding-right: 24px;">
                    {{-- Framed portrait: offset tinted backdrop, thin border, emerald corner + orange accent --}}
                    <div style="position: relative; width: 249px; height: 304px; margin-left: 10px;">
                        <div style="position: absolute; top: 14px; left: 4px; width: 235px; height: 290px; background: #e8efe9; border: 1px solid #d9e5dc;"></div>
                        @if($ceoPhoto)
                            <img src="{{ $ceoPhoto }}" style="position: absolute; top: 0; left: 14px; width: 235px; height: 290px; border: 1px solid #d1d5db;">
                        @else
                            <table style="position: absolute; top: 0; left: 14px; width: 235px; height: 290px; border: 1px solid #d1d5db;"><tr><td class="photo-ph"><span>CEO PHOTO</span></td></tr></table>
                        @endif
                        <div style="position: absolute; bottom: 4px; left: -6px; width: 58px; height: 58px; border-left: 3px solid #059669; border-bottom: 3px solid #059669;"></div>
                        <div style="position: absolute; top: -7px; right: -7px; width: 14px; height: 14px; background: #e2571b;"></div>
                    </div>
                </td>
                <td style="vertical-align: top;">
                    <div class="display" style="font-size: 40px; line-height: 1; color: #059669;">&ldquo;</div>
                    @foreach($ceoParas as $para)
                        <div style="font-size: 14px; line-height: 1.8; color: #374151; margin-bottom: 14px; text-align: justify;">{{ $para }}</div>
                    @endforeach
                </td>
            </tr>
        </table>

        <div style="margin-top: 34px; padding-left: 294px;">
            <div style="width: 34px; height: 2px; background: #059669;"></div>
            @if($ceoSignature)
                <img src="{{ $ceoSignature }}" style="max-height: 56px; margin-top: 14px;">
            @endif
            <div style="font-size: 16px; font-weight: bold; color: #111827; margin-top: {{ $ceoSignature ? 6 : 16 }}px;">{{ $ceoName }}</div>
            <div style="font-size: 12px; letter-spacing: 2px; color: #6b7280; margin-top: 3px;">{{ strtoupper($ceoTitle) }}, {{ strtoupper($companyName) }}</div>
        </div>
    </div>
    <div class="page-foot"><table class="w-full"><tr><td>{{ $website }}</td><td class="num">{{ sprintf('%02d', $pageNo) }}</td></tr></table></div>
</div>

{{-- ================= ABOUT + STATS ================= --}}
@php $pageNo++; @endphp
<div class="page">
    <div class="pad">
        <table class="hdr-table">
            <tr>
                <td style="width: 40px;">@if($companyLogo)<img src="{{ $companyLogo }}" style="width: 30px;">@endif</td>
                <td class="hdr-brand">{{ strtoupper($companyName) }}</td>
                <td class="hdr-label">COMPANY PROFILE</td>
            </tr>
        </table>

        <div style="margin-top: 40px;">
            <div class="overline">About Us</div>
            <div class="section-title">Who we are</div>
        </div>

        <div style="margin-top: 22px;">
            @foreach($aboutParas as $para)
                <div style="font-size: 14.5px; line-height: 1.75; color: #374151; margin-bottom: 14px; text-align: justify;">{{ $para }}</div>
            @endforeach
        </div>

        <table class="w-full" style="margin-top: 30px; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
            <tr>
                @foreach($stats as $i => $stat)
                    <td style="width: {{ round(100 / max(count($stats), 1)) }}%; padding: 24px 14px; {{ $i > 0 ? 'border-left: 1px solid #e5e7eb;' : '' }}">
                        <div class="display" style="font-size: 34px; color: #059669;">{{ $stat['value'] }}</div>
                        <div style="font-size: 10.5px; letter-spacing: 2px; color: #6b7280; margin-top: 4px;">{{ strtoupper($stat['label']) }}</div>
                    </td>
                @endforeach
            </tr>
        </table>

        <table class="w-full" style="margin-top: 36px;">
            <tr>
                <td style="width: 50%; padding-right: 20px; vertical-align: top;">
                    <table><tr>
                        <td style="width: 22px; padding-right: 10px;"><div style="width: 22px; height: 2px; background: #e2571b;"></div></td>
                        <td style="font-size: 11px; letter-spacing: 3px; color: #111827; font-weight: bold;">OUR MISSION</td>
                    </tr></table>
                    <div style="font-size: 13.5px; line-height: 1.7; color: #4b5563; margin-top: 8px; text-align: justify;">{{ $content['profile_mission'] }}</div>
                </td>
                <td style="width: 50%; padding-left: 20px; vertical-align: top;">
                    <table><tr>
                        <td style="width: 22px; padding-right: 10px;"><div style="width: 22px; height: 2px; background: #e2571b;"></div></td>
                        <td style="font-size: 11px; letter-spacing: 3px; color: #111827; font-weight: bold;">OUR PROMISE</td>
                    </tr></table>
                    <div style="font-size: 13.5px; line-height: 1.7; color: #4b5563; margin-top: 8px; text-align: justify;">{{ $content['profile_promise'] }}</div>
                </td>
            </tr>
        </table>
    </div>
    <div class="page-foot"><table class="w-full"><tr><td>{{ $website }}</td><td class="num">{{ sprintf('%02d', $pageNo) }}</td></tr></table></div>
</div>

{{-- ================= PAGE 3 · SERVICES ================= --}}
@php $pageNo++; @endphp
<div class="page">
    <div class="pad">
        <table class="hdr-table">
            <tr>
                <td style="width: 40px;">@if($companyLogo)<img src="{{ $companyLogo }}" style="width: 30px;">@endif</td>
                <td class="hdr-brand">{{ strtoupper($companyName) }}</td>
                <td class="hdr-label">COMPANY PROFILE</td>
            </tr>
        </table>

        <div style="margin-top: 40px;">
            <div class="overline">Services</div>
            <div class="section-title">What we do</div>
        </div>

        <table class="w-full" style="margin-top: 20px;">
            @foreach($services as $i => $service)
                <tr>
                    <td class="display" style="width: 56px; font-size: 19px; color: #059669; padding: 20px 0; vertical-align: top; {{ $i > 0 ? 'border-top: 1px solid #e5e7eb;' : '' }}">{{ sprintf('%02d', $i + 1) }}</td>
                    <td style="padding: 20px 0; vertical-align: top; {{ $i > 0 ? 'border-top: 1px solid #e5e7eb;' : '' }}">
                        <div style="font-size: 16px; font-weight: bold; color: #111827;">{{ $service['name'] }}</div>
                        @if(!empty($service['description']))
                            <div style="font-size: 13.5px; line-height: 1.6; color: #6b7280; margin-top: 4px; text-align: justify;">{{ $service['description'] }}</div>
                        @endif
                    </td>
                </tr>
            @endforeach
        </table>
    </div>
    <div class="page-foot"><table class="w-full"><tr><td>{{ $website }}</td><td class="num">{{ sprintf('%02d', $pageNo) }}</td></tr></table></div>
</div>

{{-- ================= FEATURED PROJECT PAGE ================= --}}
@if($featured)
@php $pageNo++; @endphp
<div class="page">
    <div class="pad">
        <table class="hdr-table">
            <tr>
                <td style="width: 40px;">@if($companyLogo)<img src="{{ $companyLogo }}" style="width: 30px;">@endif</td>
                <td class="hdr-brand">{{ strtoupper($companyName) }}</td>
                <td class="hdr-label">PORTFOLIO</td>
            </tr>
        </table>

        <table class="w-full" style="margin-top: 40px;">
            <tr>
                <td>
                    <div class="overline">Featured Project</div>
                    <div class="display" style="font-size: 29px; margin-top: 10px;">
                        @if($featured->website_url)
                            <a href="{{ $featured->website_url }}" style="color: #111827; text-decoration: none;">{{ $featured->title }}</a>
                        @else
                            <span style="color: #111827;">{{ $featured->title }}</span>
                        @endif
                    </div>
                </td>
                <td class="display" style="font-size: 19px; color: #d1d5db; text-align: right; vertical-align: bottom;">{{ $featured->year }}</td>
            </tr>
        </table>

        @php
            $meta = array_filter([
                strtoupper($featured->type),
                $featured->location ? strtoupper($featured->location) : null,
                $featured->area_sqft ? number_format((float) $featured->area_sqft) . ' SFT' : null,
            ]);
        @endphp
        <div style="margin-top: 10px;">
            @foreach($meta as $m)
                <span style="display: inline-block; margin-right: 22px; font-size: 11.5px; letter-spacing: 1px; color: #4b5563; font-weight: bold;"><span style="color: #e2571b;">&#9632;</span>&nbsp; {{ $m }}</span>
            @endforeach
        </div>

        <div style="margin-top: 20px;">
            @if($featuredPhotos && $resolveImage($featuredPhotos[0]))
                <img src="{{ $resolveImage($featuredPhotos[0]) }}" style="width: 100%; height: 360px;">
            @else
                <table class="w-full" style="height: 360px;"><tr><td class="photo-ph"><span>MAIN PROJECT PHOTO</span></td></tr></table>
            @endif
        </div>

        @if($featured->description)
            <div style="font-size: 13.5px; line-height: 1.7; color: #4b5563; margin-top: 20px; text-align: justify;">{{ $featured->description }}</div>
        @endif
        @if($featured->website_url)
            <div style="font-size: 12.5px; margin-top: 10px;">
                <a href="{{ $featured->website_url }}" style="color: #059669; text-decoration: none; font-weight: bold; letter-spacing: 0.5px;">View this project with full gallery &rarr;</a>
            </div>
        @endif

        @php $thumbs = array_slice($featuredPhotos, 1, 3); @endphp
        @if($thumbs)
            <table class="w-full" style="margin-top: 20px;">
                <tr>
                    @foreach($thumbs as $t)
                        <td style="width: {{ round(100 / count($thumbs)) }}%; padding-right: {{ $loop->last ? 0 : 12 }}px;">
                            @if($resolveImage($t))<img src="{{ $resolveImage($t) }}" style="width: 100%; height: 130px;">@endif
                        </td>
                    @endforeach
                </tr>
            </table>
        @endif
    </div>
    <div class="page-foot"><table class="w-full"><tr><td>{{ $website }}</td><td class="num">{{ sprintf('%02d', $pageNo) }}</td></tr></table></div>
</div>
@endif

{{-- ================= PROJECT GRID PAGES ================= --}}
@foreach($gridPages as $pageProjects)
@php $pageNo++; @endphp
<div class="page">
    <div class="pad">
        <table class="hdr-table">
            <tr>
                <td style="width: 40px;">@if($companyLogo)<img src="{{ $companyLogo }}" style="width: 30px;">@endif</td>
                <td class="hdr-brand">{{ strtoupper($companyName) }}</td>
                <td class="hdr-label">PORTFOLIO</td>
            </tr>
        </table>

        <div style="margin-top: 40px;">
            <div class="overline">Selected Work</div>
            <div class="section-title">Recent projects</div>
        </div>

        <table class="w-full" style="margin-top: 24px;">
            @foreach($pageProjects->values()->chunk(2) as $row)
                <tr>
                    @foreach($row as $project)
                        @php $photo = ($project->photos[0] ?? null) ? $resolveImage($project->photos[0]) : null; @endphp
                        <td style="width: 50%; padding: 0 {{ $loop->first ? '16px 28px 0' : '0 28px 16px' }};">
                            @if($photo)
                                <img src="{{ $photo }}" style="width: 100%; height: 220px;">
                            @else
                                <table class="w-full" style="height: 220px;"><tr><td class="photo-ph"><span>PROJECT PHOTO</span></td></tr></table>
                            @endif
                            <div style="font-size: 15.5px; font-weight: bold; margin-top: 10px;">
                                @if($project->website_url)
                                    <a href="{{ $project->website_url }}" style="color: #111827; text-decoration: none;">{{ $project->title }}</a>
                                @else
                                    <span style="color: #111827;">{{ $project->title }}</span>
                                @endif
                            </div>
                            <div style="font-size: 11.5px; letter-spacing: 1px; color: #6b7280; margin-top: 3px;">
                                {{ strtoupper($project->type) }}@if($project->area_sqft) &middot; {{ number_format((float) $project->area_sqft) }} SFT @endif @if($project->year) &middot; {{ $project->year }} @endif
                            </div>
                        </td>
                    @endforeach
                    @if(count($row) === 1)<td style="width: 50%;"></td>@endif
                </tr>
            @endforeach
        </table>

        @if($portfolioUrl)
            <div style="font-size: 13px; text-align: center; margin-top: 24px;">
                <span style="color: #6b7280;">See all projects with full galleries &mdash;</span>
                <a href="{{ $portfolioUrl }}" style="color: #059669; text-decoration: none; font-weight: bold;">{{ preg_replace('~^https?://~i', '', $portfolioUrl) }}</a>
            </div>
        @endif
    </div>
    <div class="page-foot"><table class="w-full"><tr><td>{{ $website }}</td><td class="num">{{ sprintf('%02d', $pageNo) }}</td></tr></table></div>
</div>
@endforeach

{{-- ================= OUR CLIENTS ================= --}}
@if(count($profileClients))
@php $pageNo++; @endphp
<div class="page">
    <div class="pad">
        <table class="hdr-table">
            <tr>
                <td style="width: 40px;">@if($companyLogo)<img src="{{ $companyLogo }}" style="width: 30px;">@endif</td>
                <td class="hdr-brand">{{ strtoupper($companyName) }}</td>
                <td class="hdr-label">COMPANY PROFILE</td>
            </tr>
        </table>

        <div style="margin-top: 40px;">
            <div class="overline">Our Clients</div>
            <div class="section-title">Who we've worked with</div>
        </div>

        <table class="w-full" style="margin-top: 26px;">
            @foreach(collect($profileClients)->chunk(4) as $row)
                <tr>
                    @foreach($row as $client)
                        <td style="width: 25%; padding: 7px;">
                            <table style="width: 100%; height: 104px; border: 1px solid #e5e7eb;">
                                <tr>
                                    <td style="text-align: center; vertical-align: middle; padding: 10px 8px;">
                                        @if($client['logo'])
                                            <img src="{{ $client['logo'] }}" style="height: 36px;">
                                            <div style="font-size: 10px; letter-spacing: 1px; color: #6b7280; margin-top: 8px;">{{ strtoupper($client['name']) }}</div>
                                        @else
                                            <div style="font-size: 13px; font-weight: bold; color: #374151; line-height: 1.4;">{{ $client['name'] }}</div>
                                        @endif
                                    </td>
                                </tr>
                            </table>
                        </td>
                    @endforeach
                    @for($i = count($row); $i < 4; $i++)<td style="width: 25%;"></td>@endfor
                </tr>
            @endforeach
        </table>

        <div style="font-size: 13px; color: #6b7280; margin-top: 26px; text-align: center;">&hellip;and many more homes and businesses across Bangladesh.</div>
    </div>
    <div class="page-foot"><table class="w-full"><tr><td>{{ $website }}</td><td class="num">{{ sprintf('%02d', $pageNo) }}</td></tr></table></div>
</div>
@endif

{{-- ================= BACK COVER · CONTACT ================= --}}
<div class="page last" style="background: #111827;">
    <div style="padding: 90px 64px 0 64px; text-align: center;">
        @if($companyLogo)<img src="{{ $companyLogo }}" style="width: 84px;">@endif
        <div class="display" style="font-size: 28px; letter-spacing: 2px; color: #ffffff; margin-top: 24px;">{{ strtoupper($companyName) }}</div>
        <div style="font-size: 10px; letter-spacing: 6px; color: #34d399; font-weight: bold; margin-top: 8px;">{{ strtoupper($companyTagline) }}</div>

        <div class="display" style="font-size: 34px; line-height: 1.35; color: #ffffff; margin-top: 56px;">Let's build your dream together.</div>
        @if(!empty($content['profile_closing']))
            <div style="font-size: 15px; line-height: 1.6; color: #9ca3af; margin-top: 14px;">{{ $content['profile_closing'] }}</div>
        @endif

        <div style="width: 44px; height: 2px; background: #059669; margin: 36px auto 0;"></div>

        <div style="margin-top: 32px;">
            @if($companyPhone)
                <div style="font-size: 15px; color: #f3f4f6; margin-bottom: 16px;"><span style="color: #34d399;">&#9742;</span>&nbsp; {{ $companyPhone }}@if($companyPhone2), {{ $companyPhone2 }}@endif</div>
            @endif
            @if($companyEmail)
                <div style="font-size: 15px; color: #f3f4f6; margin-bottom: 16px;"><span style="color: #34d399;">&#9993;</span>&nbsp; {{ $companyEmail }}</div>
            @endif
            @if($companyAddress)
                <div style="font-size: 15px; color: #f3f4f6; margin-bottom: 16px;">{{ $companyAddress }}</div>
            @endif
            <div style="font-size: 15px; color: #f3f4f6;">{{ $website }}</div>
        </div>

        @if($websiteQr)
            <div style="margin-top: 34px;">
                <div style="display: inline-block; background: #ffffff; padding: 8px;">
                    <img src="{{ $websiteQr }}" style="width: 96px; height: 96px;">
                </div>
                <div style="font-size: 10px; letter-spacing: 3px; color: #6b7280; margin-top: 10px;">SCAN TO VISIT OUR WEBSITE</div>
            </div>
        @endif
    </div>
    <div style="position: absolute; bottom: 40px; left: 64px; right: 64px; border-top: 1px solid #374151; padding-top: 14px; text-align: center; font-size: 11px; letter-spacing: 2px; color: #6b7280;">
        &copy; {{ now()->format('Y') }} {{ strtoupper($companyName) }} &middot; DHAKA, BANGLADESH
    </div>
</div>

</body>
</html>
