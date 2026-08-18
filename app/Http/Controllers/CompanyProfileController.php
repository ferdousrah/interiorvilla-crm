<?php

namespace App\Http\Controllers;

use App\Models\PortfolioProject;
use App\Models\ProfileClient;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CompanyProfileController extends Controller
{
    /** Setting keys managed by this screen, with defaults used until edited. */
    private const CONTENT_DEFAULTS = [
        'profile_headline' => "Spaces designed\naround your life.",
        'profile_intro'    => 'Interior design & execution studio — Dhaka, Bangladesh. Residential and commercial interiors, delivered end to end.',
        'profile_about'    => "Interior Villa BD is a Dhaka-based interior design and execution company. From the first concept sketch to the final coat of paint, we design, manufacture and install complete interiors for homes, offices and commercial spaces — one team, one point of accountability.\n\nOur in-house designers, engineers and craftsmen work as a single unit, which is how we keep our promises on quality, budget and timeline. Every project begins with how you live and work — and ends with a space that feels unmistakably yours.",
        'profile_mission'  => 'To make thoughtfully designed, honestly built interiors accessible to every home and business in Bangladesh.',
        'profile_promise'  => 'Transparent estimates, materials we stand behind, and a handover date we keep — on every single project.',
        'profile_closing'  => "Tell us about your space — we'll bring the design, the craft and the schedule.",
        'profile_ceo_message' => "When we started Interior Villa, we made one promise to ourselves: every space we touch should feel like it was always meant to be that way.\n\nBehind every project in this profile is a client who trusted us with their home or their business. That trust is what we build with — more than wood, board or paint. Thank you for considering us; we would be honored to build your dream.",
    ];

    private const STATS_DEFAULT = [
        ['value' => '120+', 'label' => 'Projects Delivered'],
        ['value' => '10+',  'label' => 'Years of Craft'],
        ['value' => '4.5L', 'label' => 'Sqft Designed'],
        ['value' => '95%',  'label' => 'Repeat & Referral'],
    ];

    private const SERVICES_DEFAULT = [
        ['name' => 'Residential Interior',                 'description' => 'Complete apartment & duplex interiors — living, dining, bedrooms and everything between.'],
        ['name' => 'Commercial & Office Interior',         'description' => 'Workspaces, showrooms and retail environments that work as hard as you do.'],
        ['name' => 'Kitchen & Wardrobe Solutions',         'description' => 'Custom cabinets, kitchens and wardrobes manufactured in our own workshop.'],
        ['name' => 'False Ceiling, Lighting & Paneling',   'description' => 'Ceiling design, decorative wall paneling and lighting schemes that set the mood.'],
        ['name' => 'Furniture & Fixture Manufacturing',    'description' => 'Bespoke furniture built to drawing, finished to last.'],
        ['name' => 'Renovation & Turnkey Execution',       'description' => 'Supervision and implementation from demolition to handover — one contract, zero chaos.'],
    ];

    /** Setting key for a variant's cover photo ('full', 'residential', 'commercial'). */
    private function coverKey(string $variant): string
    {
        return $variant === 'full' ? 'profile_cover_photo' : 'profile_cover_photo_' . $variant;
    }

    public function index(): Response
    {
        $ceoPhoto = Setting::get('profile_ceo_photo');
        $coverPhotos = [];
        foreach (['full', 'residential', 'commercial'] as $variant) {
            $path = Setting::get($this->coverKey($variant));
            $coverPhotos[$variant] = $path ? asset('storage/' . $path) : null;
        }

        return Inertia::render('Settings/CompanyProfile', [
            'content'  => $this->content(),
            'stats'    => $this->jsonSetting('profile_stats', self::STATS_DEFAULT),
            'services' => $this->jsonSetting('profile_services', self::SERVICES_DEFAULT),
            'projects' => PortfolioProject::orderByDesc('is_featured')->orderBy('sort_order')->orderBy('created_at')->get(),
            'ceo'      => [
                'name'  => Setting::get('company_ceo_name', ''),
                'title' => Setting::get('company_ceo_title', 'CEO'),
                'photo' => $ceoPhoto ? asset('storage/' . $ceoPhoto) : null,
            ],
            'coverPhotos' => $coverPhotos,
            'clients'  => ProfileClient::orderBy('sort_order')->orderBy('created_at')->get()
                ->map(fn ($c) => [
                    'id'   => $c->id,
                    'name' => $c->name,
                    'logo' => $c->logo ? asset('storage/' . $c->logo) : null,
                ]),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'content'                => 'required|array',
            'content.profile_headline' => 'required|string|max:200',
            'content.profile_intro'    => 'nullable|string|max:500',
            'content.profile_about'    => 'nullable|string|max:5000',
            'content.profile_mission'  => 'nullable|string|max:1000',
            'content.profile_promise'  => 'nullable|string|max:1000',
            'content.profile_closing'  => 'nullable|string|max:500',
            'content.profile_ceo_message' => 'nullable|string|max:3000',
            'ceo_name'               => 'nullable|string|max:100',
            'ceo_title'              => 'nullable|string|max:50',
            'stats'                  => 'required|array|max:6',
            'stats.*.value'          => 'required|string|max:20',
            'stats.*.label'          => 'required|string|max:60',
            'services'               => 'required|array|max:12',
            'services.*.name'        => 'required|string|max:100',
            'services.*.description' => 'nullable|string|max:300',
        ]);

        foreach ($data['content'] as $key => $value) {
            Setting::set($key, $value ?? '');
        }
        Setting::set('company_ceo_name', $data['ceo_name'] ?? '');
        Setting::set('company_ceo_title', $data['ceo_title'] ?? 'CEO');
        Setting::set('profile_stats', json_encode(array_values($data['stats'])));
        Setting::set('profile_services', json_encode(array_values($data['services'])));

        return back()->with('success', 'Company profile content saved.');
    }

    public function storeProject(Request $request): RedirectResponse
    {
        $data = $this->validateProject($request);
        $data['photos'] = $this->storePhotos($request);

        PortfolioProject::create($data);

        return back()->with('success', 'Portfolio project added.');
    }

    public function updateProject(Request $request, PortfolioProject $portfolioProject): RedirectResponse
    {
        $data = $this->validateProject($request);

        // Photos the user chose to keep, in order, plus any new uploads appended.
        $kept = array_values(array_intersect($request->input('kept_photos', []), $portfolioProject->photos ?? []));
        foreach (array_diff($portfolioProject->photos ?? [], $kept) as $removed) {
            if (Storage::disk('public')->exists($removed)) {
                Storage::disk('public')->delete($removed);
            }
        }
        $data['photos'] = array_merge($kept, $this->storePhotos($request));

        $portfolioProject->update($data);

        return back()->with('success', 'Portfolio project updated.');
    }

    public function destroyProject(PortfolioProject $portfolioProject): RedirectResponse
    {
        foreach ($portfolioProject->photos ?? [] as $photo) {
            if (Storage::disk('public')->exists($photo)) {
                Storage::disk('public')->delete($photo);
            }
        }
        $portfolioProject->forceDelete();

        return back()->with('success', 'Portfolio project removed.');
    }

    /** Project types included in each tailored profile ('other' appears in both). */
    private const CATEGORY_TYPES = [
        'residential' => ['residential', 'other'],
        'commercial'  => ['commercial', 'office', 'showroom', 'restaurant', 'other'],
    ];

    /** Download the company profile as a branded PDF, optionally tailored per category. */
    public function pdf(Request $request)
    {
        $category = $request->query('category');
        if (!array_key_exists($category ?? '', self::CATEGORY_TYPES)) {
            $category = null;
        }

        // DomPDF caches custom font metrics (Marcellus) here; missing dir crashes the render.
        if (!is_dir(storage_path('fonts'))) {
            @mkdir(storage_path('fonts'), 0755, true);
        }

        $resolveImage = function (?string $path): ?string {
            if (!$path) return null;
            $abs = storage_path('app/public/' . $path);
            if (is_file($abs)) {
                return 'data:image/' . pathinfo($abs, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($abs));
            }
            return null;
        };

        $projects = PortfolioProject::orderByDesc('is_featured')->orderBy('sort_order')->orderBy('created_at')->get();
        if ($category) {
            $projects = $projects->filter(fn ($p) => in_array($p->type, self::CATEGORY_TYPES[$category], true))->values();
        }
        $featured = $projects->firstWhere('is_featured', true);
        $others   = $projects->reject(fn ($p) => $featured && $p->id === $featured->id);

        $website = Setting::get('company_website', 'www.interiorvillabd.com');
        $websiteUrl = preg_match('~^https?://~i', $website) ? $website : 'https://' . $website;

        $pdf = Pdf::loadView('pdf.company-profile', [
            'content'        => $this->content(),
            'stats'          => $this->jsonSetting('profile_stats', self::STATS_DEFAULT),
            'services'       => $this->jsonSetting('profile_services', self::SERVICES_DEFAULT),
            'featured'       => $featured,
            'gridProjects'   => $others,
            'resolveImage'   => $resolveImage,
            'companyName'    => Setting::get('company_name', 'Interior Villa'),
            'companyTagline' => Setting::get('company_tagline', 'Build Your Dream'),
            'companyEmail'   => Setting::get('company_email'),
            'companyPhone'   => Setting::get('company_phone'),
            'companyPhone2'  => Setting::get('company_phone2'),
            'companyAddress' => Setting::get('company_address'),
            'companyLogo'    => $resolveImage(Setting::get('company_logo')),
            'coverPhoto'     => $resolveImage(Setting::get($this->coverKey($category ?? 'full')))
                                ?: $resolveImage(Setting::get('profile_cover_photo')),
            'website'        => $website,
            'websiteQr'      => $this->qrDataUri($websiteUrl),
            'ceoName'        => Setting::get('company_ceo_name'),
            'ceoTitle'       => Setting::get('company_ceo_title', 'CEO'),
            'ceoMessage'     => $this->content()['profile_ceo_message'] ?? '',
            'ceoPhoto'       => $resolveImage(Setting::get('profile_ceo_photo')),
            'ceoSignature'   => $resolveImage(Setting::get('company_signature')),
            'profileLabel'   => $category ? ucfirst($category) . ' Profile' : 'Company Profile',
            'profileClients' => ProfileClient::orderBy('sort_order')->orderBy('created_at')->get()
                ->map(fn ($c) => ['name' => $c->name, 'logo' => $resolveImage($c->logo)]),
        ])->setPaper('a4');

        $suffix = $category ? '-' . ucfirst($category) : '';
        return $pdf->download('Company-Profile' . $suffix . '-' . now()->format('Y') . '.pdf');
    }

    public function storeClient(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'logo' => 'nullable|image|mimes:png,jpg,jpeg,webp,svg|max:2048',
        ]);

        ProfileClient::create([
            'name' => $data['name'],
            'logo' => $request->hasFile('logo') ? $request->file('logo')->store('profile-clients', 'public') : null,
        ]);

        return back()->with('success', 'Client added.');
    }

    public function destroyClient(ProfileClient $profileClient): RedirectResponse
    {
        if ($profileClient->logo && Storage::disk('public')->exists($profileClient->logo)) {
            Storage::disk('public')->delete($profileClient->logo);
        }
        $profileClient->delete();

        return back()->with('success', 'Client removed.');
    }

    public function uploadCoverPhoto(Request $request): RedirectResponse
    {
        $request->validate([
            'photo'   => 'required|image|mimes:png,jpg,jpeg,webp|max:6144',
            'variant' => 'required|in:full,residential,commercial',
        ]);
        $key = $this->coverKey($request->input('variant'));

        $old = Setting::get($key);
        if ($old && Storage::disk('public')->exists($old)) {
            Storage::disk('public')->delete($old);
        }

        $path = $request->file('photo')->store('profile', 'public');
        Setting::set($key, $path);

        return back()->with('success', 'Cover photo updated.');
    }

    public function removeCoverPhoto(Request $request): RedirectResponse
    {
        $request->validate([
            'variant' => 'required|in:full,residential,commercial',
        ]);
        $key = $this->coverKey($request->input('variant'));

        $old = Setting::get($key);
        if ($old && Storage::disk('public')->exists($old)) {
            Storage::disk('public')->delete($old);
        }
        Setting::set($key, '');

        return back()->with('success', 'Cover photo removed.');
    }

    public function uploadCeoPhoto(Request $request): RedirectResponse
    {
        $request->validate([
            'photo' => 'required|image|mimes:png,jpg,jpeg,webp|max:4096',
        ]);

        $old = Setting::get('profile_ceo_photo');
        if ($old && Storage::disk('public')->exists($old)) {
            Storage::disk('public')->delete($old);
        }

        $path = $request->file('photo')->store('ceo', 'public');
        Setting::set('profile_ceo_photo', $path);

        return back()->with('success', 'CEO photo updated.');
    }

    public function removeCeoPhoto(): RedirectResponse
    {
        $old = Setting::get('profile_ceo_photo');
        if ($old && Storage::disk('public')->exists($old)) {
            Storage::disk('public')->delete($old);
        }
        Setting::set('profile_ceo_photo', '');

        return back()->with('success', 'CEO photo removed.');
    }

    /** QR code PNG as a data URI (black on white, with quiet zone) for the PDF. */
    private function qrDataUri(string $url): ?string
    {
        try {
            $renderer = new \BaconQrCode\Renderer\GDLibRenderer(300);
            $writer = new \BaconQrCode\Writer($renderer);
            return 'data:image/png;base64,' . base64_encode($writer->writeString($url));
        } catch (\Throwable) {
            return null; // QR is decorative — never block the PDF on it
        }
    }

    private function content(): array
    {
        $content = [];
        foreach (self::CONTENT_DEFAULTS as $key => $default) {
            $value = Setting::get($key);
            $content[$key] = ($value === null || $value === '') ? $default : $value;
        }
        return $content;
    }

    private function jsonSetting(string $key, array $default): array
    {
        $raw = Setting::get($key);
        $decoded = $raw ? json_decode($raw, true) : null;
        return is_array($decoded) && $decoded !== [] ? $decoded : $default;
    }

    private function validateProject(Request $request): array
    {
        return $request->validate([
            'title'       => 'required|string|max:150',
            'type'        => 'required|string|max:50',
            'location'    => 'nullable|string|max:150',
            'area_sqft'   => 'nullable|numeric|min:0',
            'year'        => 'nullable|string|max:10',
            'description' => 'nullable|string|max:2000',
            'is_featured' => 'boolean',
            'sort_order'  => 'nullable|integer',
        ]);
    }

    /** @return string[] stored paths for newly uploaded photos */
    private function storePhotos(Request $request): array
    {
        $request->validate([
            'photos'   => 'nullable|array|max:6',
            'photos.*' => 'image|mimes:png,jpg,jpeg,webp|max:4096',
        ]);

        $paths = [];
        foreach ($request->file('photos', []) as $file) {
            $paths[] = $file->store('portfolio', 'public');
        }
        return $paths;
    }
}
