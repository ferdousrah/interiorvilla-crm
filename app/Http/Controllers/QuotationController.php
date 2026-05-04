<?php

namespace App\Http\Controllers;

use App\Mail\QuotationMail;
use App\Models\Client;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Lead;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Setting;
use App\Services\CodeGeneratorService;
use App\Support\NumberToWords;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class QuotationController extends Controller
{
    public function __construct(private CodeGeneratorService $codeGenerator) {}

    private function authorizeAccess(Quotation $quotation): void
    {
        $user = auth()->user();
        abort_unless($user->hasRole('admin') || $quotation->created_by === $user->id, 403);
    }

    public function index(Request $request): Response
    {
        $query = Quotation::with(['client', 'lead', 'project', 'createdBy'])
            ->whereNull('deleted_at');

        if (!auth()->user()->hasRole('admin')) {
            $query->where('created_by', auth()->id());
        }

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhereHas('client', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $quotations = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        return Inertia::render('Quotations/Index', [
            'quotations' => $quotations,
            'filters'    => $request->only('search', 'status'),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Quotations/Create', [
            'clients'           => Client::orderBy('name')->get(['id', 'name', 'code', 'phone']),
            'leads'             => Lead::whereNotIn('status', ['won', 'lost'])->orderBy('name')->get(['id', 'name', 'phone', 'estimated_value', 'address']),
            'projects'          => Project::whereNotIn('status', ['completed', 'cancelled'])->orderBy('name')->get(['id', 'name', 'code']),
            'serviceCategories' => config('services_catalog.service_categories'),
            'defaultTerms'      => Setting::get('quotation_terms') ?: null,
            'prefill'           => [
                'lead_id'    => $request->get('lead_id'),
                'client_id'  => $request->get('client_id'),
                'project_id' => $request->get('project_id'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateQuotation($request);

        if (empty($validated['client_id']) && empty($validated['lead_id'])) {
            return back()->withErrors(['client_id' => 'Select a client or at least a lead.'])->withInput();
        }

        DB::transaction(function () use ($validated) {
            $code = $this->codeGenerator->generate('QT', 'quotations');
            $totals = $this->calculateTotals($validated);

            $quotation = Quotation::create([
                'code'                   => $code,
                'client_id'              => $validated['client_id'] ?? null,
                'lead_id'                => $validated['lead_id'] ?? null,
                'project_id'             => $validated['project_id'] ?? null,
                'subject'                => $validated['subject'],
                'bill_to'                => $validated['bill_to'] ?? null,
                'service_group'          => $validated['service_group'] ?? null,
                'service_type'           => $validated['service_type'] ?? null,
                'document_date'          => $validated['document_date'] ?? now()->toDateString(),
                'valid_until'            => $validated['valid_until'] ?? null,
                'discount_type'          => $validated['discount_type'],
                'discount_value'         => $validated['discount_value'] ?? 0,
                'discount_amount'        => $totals['discount_amount'],
                'vat_pct'                => $validated['vat_pct'] ?? 0,
                'subtotal'               => $totals['subtotal'],
                'vat_amount'             => $totals['vat_amount'],
                'transportation_amount'  => $totals['transportation_amount'],
                'supervision_pct'        => $validated['supervision_pct'] ?? 0,
                'supervision_amount'     => $totals['supervision_amount'],
                'grand_total'            => $totals['grand_total'],
                'terms'                  => $validated['terms'] ?? null,
                'notes'                  => $validated['notes'] ?? null,
                'created_by'             => auth()->id(),
            ]);

            $this->syncItems($quotation, $validated['items']);
        });

        return redirect()->route('quotations.index')->with('success', 'Quotation created successfully.');
    }

    public function show(Quotation $quotation): Response
    {
        $this->authorizeAccess($quotation);
        $quotation->load(['client', 'lead', 'project', 'items', 'createdBy']);

        $logoPath = Setting::get('quotation_logo') ?: Setting::get('company_logo');
        $sigPath  = Setting::get('company_signature');

        // Sibling revisions (only when this quotation has been revised)
        $lineage = $quotation->lineage()
            ->map(fn($q) => [
                'id'           => $q->id,
                'revision_no'  => $q->revision_no,
                'display_code' => $q->display_code,
                'status'       => $q->status,
                'grand_total'  => (float) $q->grand_total,
                'created_at'   => $q->created_at?->toIso8601String(),
                'is_current'   => $q->id === $quotation->id,
            ])
            ->values();

        return Inertia::render('Quotations/Show', [
            'quotation' => $quotation,
            'company'   => [
                'name'      => Setting::get('company_name', 'Interior Villa'),
                'email'     => Setting::get('company_email'),
                'phone'     => Setting::get('company_phone'),
                'phone2'    => Setting::get('company_phone2'),
                'address'   => Setting::get('company_address'),
                'ceo_name'  => Setting::get('company_ceo_name'),
                'ceo_title' => Setting::get('company_ceo_title', 'CEO'),
                'logo'      => $logoPath ? asset('storage/' . $logoPath) : null,
                'signature' => $sigPath  ? asset('storage/' . $sigPath)  : null,
            ],
            'grandTotalInWords' => NumberToWords::toBdt((float) $quotation->grand_total),
            'lineage'           => $lineage,
        ]);
    }

    public function edit(Quotation $quotation): Response
    {
        $this->authorizeAccess($quotation);
        if ($quotation->status === 'superseded') {
            return redirect()->route('quotations.show', $quotation)
                ->with('error', 'This is an old revision and cannot be edited. Open the latest revision instead.');
        }
        if (!in_array($quotation->status, ['draft', 'sent', 'under_review'])) {
            return redirect()->route('quotations.show', $quotation)
                ->with('error', 'Only draft or sent quotations can be edited.');
        }

        $quotation->load(['items']);

        return Inertia::render('Quotations/Edit', [
            'quotation'         => $quotation,
            'clients'           => Client::orderBy('name')->get(['id', 'name', 'code', 'phone']),
            'leads'             => Lead::whereNotIn('status', ['won', 'lost'])->orderBy('name')->get(['id', 'name', 'phone', 'address']),
            'projects'          => Project::whereNotIn('status', ['completed', 'cancelled'])->orderBy('name')->get(['id', 'name', 'code']),
            'serviceCategories' => config('services_catalog.service_categories'),
        ]);
    }

    public function update(Request $request, Quotation $quotation): RedirectResponse
    {
        $this->authorizeAccess($quotation);
        $validated = $this->validateQuotation($request);

        DB::transaction(function () use ($validated, $quotation) {
            $totals = $this->calculateTotals($validated);

            $quotation->update([
                'client_id'              => $validated['client_id'] ?? null,
                'lead_id'                => $validated['lead_id'] ?? null,
                'project_id'             => $validated['project_id'] ?? null,
                'subject'                => $validated['subject'],
                'bill_to'                => $validated['bill_to'] ?? null,
                'service_group'          => $validated['service_group'] ?? null,
                'service_type'           => $validated['service_type'] ?? null,
                'document_date'          => $validated['document_date'] ?? $quotation->document_date,
                'valid_until'            => $validated['valid_until'] ?? null,
                'discount_type'          => $validated['discount_type'],
                'discount_value'         => $validated['discount_value'] ?? 0,
                'discount_amount'        => $totals['discount_amount'],
                'vat_pct'                => $validated['vat_pct'] ?? 0,
                'subtotal'               => $totals['subtotal'],
                'vat_amount'             => $totals['vat_amount'],
                'transportation_amount'  => $totals['transportation_amount'],
                'supervision_pct'        => $validated['supervision_pct'] ?? 0,
                'supervision_amount'     => $totals['supervision_amount'],
                'grand_total'            => $totals['grand_total'],
                'terms'                  => $validated['terms'] ?? null,
                'notes'                  => $validated['notes'] ?? null,
            ]);

            $this->syncItems($quotation, $validated['items']);
        });

        return redirect()->route('quotations.show', $quotation)->with('success', 'Quotation updated.');
    }

    private function validateQuotation(Request $request): array
    {
        return $request->validate([
            'client_id'             => 'nullable|uuid|exists:clients,id',
            'lead_id'               => 'nullable|uuid|exists:leads,id',
            'project_id'            => 'nullable|uuid|exists:projects,id',
            'subject'               => 'required|string|max:250',
            'bill_to'               => 'nullable|string|max:1000',
            'service_group'         => 'nullable|string|max:50',
            'service_type'          => 'nullable|string|max:100',
            'document_date'         => 'nullable|date',
            'valid_until'           => 'nullable|date',
            'discount_type'         => 'required|in:percentage,fixed',
            'discount_value'        => 'nullable|numeric|min:0',
            'vat_pct'               => 'nullable|numeric|min:0|max:100',
            'transportation_amount' => 'nullable|numeric|min:0',
            'supervision_pct'       => 'nullable|numeric|min:0|max:100',
            'terms'                 => 'nullable|string',
            'notes'                 => 'nullable|string',
            'items'                 => 'required|array|min:1',
            'items.*.category'      => 'required|string|max:100',
            'items.*.item_name'     => 'nullable|string|max:200',
            'items.*.description'   => 'required|string',
            'items.*.unit'          => 'required|string|max:30',
            'items.*.quantity'      => 'required|numeric|min:0.01',
            'items.*.unit_rate'     => 'required|numeric|min:0',
        ]);
    }

    private function syncItems(Quotation $quotation, array $items): void
    {
        $quotation->items()->delete();
        foreach ($items as $seq => $item) {
            QuotationItem::create([
                'quotation_id' => $quotation->id,
                'category'     => $item['category'],
                'item_name'    => $item['item_name'] ?? null,
                'description'  => $item['description'],
                'unit'         => $item['unit'],
                'quantity'     => $item['quantity'],
                'unit_rate'    => $item['unit_rate'],
                'total'        => round($item['quantity'] * $item['unit_rate'], 2),
                'sequence'     => $seq,
            ]);
        }
    }

    public function destroy(Quotation $quotation): RedirectResponse
    {
        $this->authorizeAccess($quotation);
        $quotation->delete();
        return redirect()->route('quotations.index')->with('success', 'Quotation deleted.');
    }

    /**
     * Create a new revision of a sent/reviewed/rejected quotation.
     * Marks the source as superseded, clones it (and items) with revision_no + 1,
     * and redirects to the edit page of the new draft revision.
     */
    public function revise(Quotation $quotation): RedirectResponse
    {
        $this->authorizeAccess($quotation);
        if (!in_array($quotation->status, ['sent', 'under_review', 'rejected'])) {
            return back()->with('error', 'Only sent, under-review, or rejected quotations can be revised.');
        }

        $newQuotation = DB::transaction(function () use ($quotation) {
            $quotation->load('items');
            $root = $quotation->rootQuotation();

            $latestRev = (int) Quotation::where('id', $root->id)
                ->orWhere('parent_quotation_id', $root->id)
                ->max('revision_no');

            // Mark the current quotation as superseded
            $quotation->update(['status' => 'superseded']);

            // Clone the quotation row
            $new = $quotation->replicate(['status', 'revision_no', 'parent_quotation_id', 'created_by']);
            $new->code                = $root->code;
            $new->revision_no         = $latestRev + 1;
            $new->parent_quotation_id = $root->id;
            $new->status              = 'draft';
            $new->created_by          = auth()->id();
            $new->save();

            // Clone every line item
            foreach ($quotation->items as $item) {
                $clone = $item->replicate();
                $clone->quotation_id = $new->id;
                $clone->save();
            }

            return $new;
        });

        return redirect()->route('quotations.edit', $newQuotation)
            ->with('success', "Revision created (Rev " . sprintf('%02d', $newQuotation->revision_no) . "). Edit and re-send when ready.");
    }

    /** Mark as Sent */
    public function markSent(Quotation $quotation): RedirectResponse
    {
        $this->authorizeAccess($quotation);
        $quotation->update(['status' => 'sent']);
        return back()->with('success', 'Quotation marked as sent.');
    }

    /** Approve */
    public function approve(Quotation $quotation): RedirectResponse
    {
        $this->authorizeAccess($quotation);
        $quotation->update(['status' => 'approved']);
        // Update linked lead estimated_value
        if ($quotation->lead_id) {
            $quotation->lead->update(['estimated_value' => $quotation->grand_total]);
        }
        return back()->with('success', 'Quotation approved.');
    }

    /** Reject */
    public function reject(Request $request, Quotation $quotation): RedirectResponse
    {
        $this->authorizeAccess($quotation);
        $quotation->update(['status' => 'rejected']);
        if ($quotation->lead_id) {
            $quotation->lead->update(['status' => 'lost', 'lost_reason' => 'Quotation rejected']);
        }
        return back()->with('success', 'Quotation rejected.');
    }

    /** Convert approved quotation to a Project */
    public function convertToProject(Request $request, Quotation $quotation): RedirectResponse
    {
        $this->authorizeAccess($quotation);
        if ($quotation->status !== 'approved') {
            return back()->with('error', 'Only approved quotations can be converted to a project.');
        }

        $request->validate(['project_name' => 'required|string|max:200']);

        DB::transaction(function () use ($request, $quotation) {
            $codeService = app(CodeGeneratorService::class);

            // Auto-create client from lead if quotation has no client yet
            $clientId = $quotation->client_id;
            if (!$clientId && $quotation->lead_id) {
                $lead = $quotation->lead;
                if ($lead->client_id) {
                    $clientId = $lead->client_id;
                } else {
                    $client = Client::create([
                        'code'         => $codeService->generate('CL', 'clients'),
                        'type'         => $lead->type ?? 'individual',
                        'name'         => $lead->name,
                        'company_name' => $lead->company_name,
                        'phone'        => $lead->phone,
                        'email'        => $lead->email,
                        'address'      => $lead->address,
                        'created_by'   => auth()->id(),
                    ]);
                    $clientId = $client->id;
                    $lead->update(['client_id' => $clientId]);
                }
                $quotation->update(['client_id' => $clientId]);
            }

            $project = Project::create([
                'code'           => $codeService->generate('PRJ', 'projects'),
                'name'           => $request->project_name,
                'client_id'      => $clientId,
                'lead_id'        => $quotation->lead_id,
                'type'           => 'residential',
                'status'         => 'planning',
                'site_address'   => '',
                'contract_value' => $quotation->grand_total,
                'created_by'     => auth()->id(),
            ]);

            $quotation->update(['status' => 'converted', 'project_id' => $project->id]);

            if ($quotation->lead_id) {
                $quotation->lead->update([
                    'status'       => 'won',
                    'converted_at' => now(),
                    'client_id'    => $clientId,
                ]);
            }
        });

        return redirect()->route('projects.show', $quotation->fresh()->project_id)
            ->with('success', 'Project created from quotation!');
    }

    /** Build a 30-day signed URL that clients can open without logging in */
    private function buildPublicUrl(Quotation $quotation): string
    {
        return URL::temporarySignedRoute(
            'quotations.public.show',
            now()->addDays(30),
            ['quotation' => $quotation->id]
        );
    }

    /** Return a fresh signed share link (for WhatsApp / copy-link) */
    public function shareLink(Quotation $quotation)
    {
        $this->authorizeAccess($quotation);
        return response()->json(['url' => $this->buildPublicUrl($quotation)]);
    }

    /** Centralized company/view payload used by PDF + public view + mail */
    private function buildViewPayload(Quotation $quotation, bool $isPdf): array
    {
        $resolveImage = function (?string $path) use ($isPdf): ?string {
            if (!$path) return null;
            if ($isPdf) {
                $abs = storage_path('app/public/' . $path);
                if (is_file($abs)) {
                    return 'data:image/' . pathinfo($abs, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($abs));
                }
                return null;
            }
            return asset('storage/' . $path);
        };

        return [
            'quotation'          => $quotation,
            'companyName'        => Setting::get('company_name', 'Interior Villa'),
            'companyTagline'     => Setting::get('company_tagline', 'Build Your Dream'),
            'companyEmail'       => Setting::get('company_email'),
            'companyPhone'       => Setting::get('company_phone'),
            'companyPhone2'      => Setting::get('company_phone2'),
            'companyAddress'     => Setting::get('company_address'),
            'companyCeoName'     => Setting::get('company_ceo_name'),
            'companyCeoTitle'    => Setting::get('company_ceo_title', 'CEO'),
            'companyLogo'        => $resolveImage(Setting::get('quotation_logo') ?: Setting::get('company_logo')),
            'companySignature'   => $resolveImage(Setting::get('company_signature')),
            'grandTotalInWords'  => NumberToWords::toBdt((float) $quotation->grand_total),
            'isPdf'              => $isPdf,
        ];
    }

    /** Download the quotation as PDF (reuses the public blade) */
    public function downloadPdf(Quotation $quotation)
    {
        $this->authorizeAccess($quotation);
        $quotation->load(['client', 'lead', 'items', 'createdBy']);

        $pdf = Pdf::loadView('quotations.public.show', $this->buildViewPayload($quotation, true))
            ->setPaper('a4');

        return $pdf->download("Quotation-{$quotation->code}.pdf");
    }

    /** Public read-only view — opened via signed URL from email/WhatsApp */
    public function showPublic(Quotation $quotation)
    {
        $quotation->load(['client', 'lead', 'items', 'createdBy']);

        return view('quotations.public.show', array_merge(
            $this->buildViewPayload($quotation, false),
            ['pdfUrl' => URL::temporarySignedRoute('quotations.public.pdf', now()->addDays(30), ['quotation' => $quotation->id])]
        ));
    }

    /** Send quotation by email to the client */
    public function sendEmail(Request $request, Quotation $quotation): RedirectResponse
    {
        $this->authorizeAccess($quotation);
        $validated = $request->validate([
            'to'             => 'required|string',
            'cc'             => 'nullable|string',
            'custom_message' => 'nullable|string|max:2000',
        ]);

        $parseEmails = function (?string $raw): array {
            if (!$raw) return [];
            return collect(preg_split('/[\s,;]+/', $raw))
                ->map(fn($e) => trim($e))
                ->filter(fn($e) => $e !== '' && filter_var($e, FILTER_VALIDATE_EMAIL))
                ->values()
                ->all();
        };

        $toList = $parseEmails($validated['to']);
        $ccList = $parseEmails($validated['cc'] ?? null);

        if (empty($toList)) {
            return back()->withErrors(['to' => 'Please provide at least one valid email address.'])->withInput();
        }

        $publicUrl = $this->buildPublicUrl($quotation);
        $mail = new QuotationMail($quotation, $publicUrl, $validated['custom_message'] ?? '');

        $mailer = Mail::to($toList);
        if (!empty($ccList)) {
            $mailer->cc($ccList);
        }
        $mailer->send($mail);

        // Auto-mark as sent if still draft
        if ($quotation->status === 'draft') {
            $quotation->update(['status' => 'sent']);
        }

        return back()->with('success', 'Quotation emailed to ' . implode(', ', $toList) . '.');
    }

    private function calculateTotals(array $data): array
    {
        $subtotal = (float) collect($data['items'])->sum(fn ($i) => $i['quantity'] * $i['unit_rate']);

        $discountValue  = (float) ($data['discount_value'] ?? 0);
        $discountAmount = ($data['discount_type'] ?? 'percentage') === 'percentage'
            ? round($subtotal * $discountValue / 100, 2)
            : min($discountValue, $subtotal);

        $afterDiscount = $subtotal - $discountAmount;

        $vatPct    = (float) ($data['vat_pct'] ?? 0);
        $vatAmount = round($afterDiscount * $vatPct / 100, 2);

        $transportation = (float) ($data['transportation_amount'] ?? 0);

        // Supervision % applies on items subtotal + transportation (labour overhead
        // on work-in-scope). Excludes VAT to keep it predictable.
        $supervisionPct    = (float) ($data['supervision_pct'] ?? 0);
        $supervisionBase   = $afterDiscount + $transportation;
        $supervisionAmount = round($supervisionBase * $supervisionPct / 100, 2);

        $grandTotal = $afterDiscount + $transportation + $supervisionAmount + $vatAmount;

        return [
            'subtotal'              => round($subtotal, 2),
            'discount_amount'       => $discountAmount,
            'vat_amount'            => $vatAmount,
            'transportation_amount' => round($transportation, 2),
            'supervision_amount'    => $supervisionAmount,
            'grand_total'           => round($grandTotal, 2),
        ];
    }
}
