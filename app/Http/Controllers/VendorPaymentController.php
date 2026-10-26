<?php

namespace App\Http\Controllers;

use App\Models\AccountHead;
use App\Models\JournalEntry;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Vendor;
use App\Models\VendorPayment;
use App\Services\AccountingService;
use App\Services\CodeGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class VendorPaymentController extends Controller
{
    public function __construct(
        private CodeGeneratorService $codeGenerator,
        private AccountingService $accounting
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', \App\Models\Invoice::class);

        $query = VendorPayment::query()
            ->when($request->search, fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('code', 'like', "%{$s}%")
                ->orWhere('reference', 'like', "%{$s}%")
                ->orWhereHas('vendor', fn ($v) => $v->where('name', 'like', "%{$s}%"))
                ->orWhereHas('purchaseOrder', fn ($po) => $po->where('code', 'like', "%{$s}%"))))
            ->when($request->vendor_id, fn ($q, $v) => $q->where('vendor_id', $v))
            ->when($request->project_id, fn ($q, $p) => $p === 'none' ? $q->whereNull('project_id') : $q->where('project_id', $p))
            ->when($request->payment_method, fn ($q, $m) => $q->where('payment_method', $m))
            ->when($request->from, fn ($q, $d) => $q->whereDate('payment_date', '>=', $d))
            ->when($request->to, fn ($q, $d) => $q->whereDate('payment_date', '<=', $d));

        $totalAmount = (float) (clone $query)->sum('amount');

        $payments = $query->with(['vendor', 'purchaseOrder', 'project:id,name', 'costHead:id,name', 'accountHead'])
            ->orderByDesc('payment_date')->orderByDesc('created_at')
            ->paginate(25)->withQueryString();

        return Inertia::render('Accounts/VendorPayments/Index', [
            'payments'    => $payments,
            'totalAmount' => $totalAmount,
            'filters'     => $request->only(['search', 'vendor_id', 'project_id', 'payment_method', 'from', 'to']),
            'projects'    => Project::orderBy('name')->get(['id', 'name']),
            'vendors'     => Vendor::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', \App\Models\Invoice::class);

        return Inertia::render('Accounts/VendorPayments/Create', $this->formProps() + [
            'prefill' => $request->po_id ? ['po_id' => $request->po_id] : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', \App\Models\Invoice::class);

        $data = $this->resolvePayload($request);
        if ($data instanceof RedirectResponse) {
            return $data;
        }

        $payment = VendorPayment::create($data + [
            'code'       => $this->codeGenerator->generate('PMT', 'vendor_payments'),
            'created_by' => auth()->id(),
        ]);

        $this->accounting->postVendorPaymentMade($payment->fresh(['vendor', 'project']));

        if ($payment->po_id) {
            return redirect()->route('procurement.purchase-orders.show', $payment->po_id)->with('success', 'Payment recorded.');
        }
        return redirect()->route('accounts.vendor-payments.index')->with('success', 'Payment recorded.');
    }

    public function edit(VendorPayment $vendorPayment): Response
    {
        $this->authorize('create', \App\Models\Invoice::class);

        return Inertia::render('Accounts/VendorPayments/Create', $this->formProps($vendorPayment) + [
            'payment' => [
                'id'              => $vendorPayment->id,
                'code'            => $vendorPayment->code,
                'vendor_id'       => $vendorPayment->vendor_id,
                'po_id'           => $vendorPayment->po_id,
                'project_id'      => $vendorPayment->project_id,
                'cost_head_id'    => $vendorPayment->cost_head_id,
                'amount'          => (float) $vendorPayment->amount,
                // Plain date string — a serialized date cast shifts a day in the browser.
                'payment_date'    => $vendorPayment->payment_date?->toDateString(),
                'payment_method'  => $vendorPayment->payment_method,
                'reference'       => $vendorPayment->reference,
                'account_head_id' => $vendorPayment->account_head_id,
                'notes'           => $vendorPayment->notes,
            ],
        ]);
    }

    /** Correct a payment — commonly to give an older one its project and work type. Re-posts the ledger entry. */
    public function update(Request $request, VendorPayment $vendorPayment): RedirectResponse
    {
        $this->authorize('create', \App\Models\Invoice::class);

        $data = $this->resolvePayload($request, $vendorPayment);
        if ($data instanceof RedirectResponse) {
            return $data;
        }

        DB::transaction(function () use ($vendorPayment, $data) {
            $vendorPayment->update($data);
            $this->ledgerEntries($vendorPayment)->delete(); // cascades to journal_lines
        });

        $this->accounting->postVendorPaymentMade($vendorPayment->fresh(['vendor', 'project']));

        return redirect()->route('accounts.vendor-payments.index')->with('success', "Payment {$vendorPayment->code} updated.");
    }

    /** Delete a payment with its ledger entry; a linked purchase shows that amount as due again. */
    public function destroy(VendorPayment $vendorPayment): RedirectResponse
    {
        abort_unless(auth()->user()->hasRole('admin'), 403, 'Only an admin can delete vendor payments.');

        DB::transaction(function () use ($vendorPayment) {
            $this->ledgerEntries($vendorPayment)->delete();
            $vendorPayment->delete();
        });

        return back()->with('success', "Payment {$vendorPayment->code} deleted.");
    }

    private function ledgerEntries(VendorPayment $payment)
    {
        return JournalEntry::where('reference_type', 'vendor_payment')->where('reference_id', $payment->id);
    }

    /** Dropdown data shared by the create and edit form. */
    private function formProps(?VendorPayment $editing = null): array
    {
        // Purchases with money still due. When editing, the payment's own amount
        // counts as available again, and its purchase stays listed even if settled.
        $openPurchases = PurchaseOrder::with('project:id,name')
            ->withSum('payments', 'amount')
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->orderByDesc('order_date')
            ->get()
            ->map(function ($po) use ($editing) {
                $own = $editing && $editing->po_id === $po->id ? (float) $editing->amount : 0;
                return [
                    'id'        => $po->id,
                    'code'      => $po->code,
                    'vendor_id' => $po->vendor_id,
                    'project'   => $po->project?->name,
                    'date'      => $po->order_date?->toDateString(),
                    'due'       => max(round((float) $po->grand_total - (float) $po->payments_sum_amount + $own, 2), 0),
                ];
            })
            ->filter(fn ($po) => $po['due'] > 0 || ($editing && $editing->po_id === $po['id']))
            ->values();

        $keepId = fn (string $key) => $editing?->{$key};

        return [
            'vendors'       => Vendor::where(fn ($q) => $q->where('is_active', true)->orWhere('id', $keepId('vendor_id')))
                ->select('id', 'name', 'code', 'type')->orderBy('name')->get(),
            'openPurchases' => $openPurchases,
            'projects'      => Project::where(fn ($q) => $q->whereNotIn('status', ['completed', 'cancelled'])->orWhere('id', $keepId('project_id')))
                ->select('id', 'name', 'code')->orderBy('name')->get(),
            'costHeads'     => AccountHead::whereHas('group', fn ($q) => $q->where('type', 'expense'))
                ->where(fn ($q) => $q->where('is_active', true)->orWhere('id', $keepId('cost_head_id')))
                ->select('id', 'name', 'code')->orderBy('code')->get(),
            'defaultCostHeadId' => AccountHead::where('code', '5002')->value('id'),
            'accountHeads'  => AccountHead::whereHas('group', fn ($q) => $q->where('type', 'asset'))
                ->where(fn ($q) => $q->where('is_active', true)->orWhere('id', $keepId('account_head_id')))
                ->select('id', 'name', 'code')->get(),
        ];
    }

    /**
     * Validate the form and normalise it for the chosen mode: a purchase
     * payment takes its project from the purchase; a work payment has no purchase.
     *
     * @return array|RedirectResponse attributes to save, or a redirect back with errors
     */
    private function resolvePayload(Request $request, ?VendorPayment $editing = null)
    {
        $validated = $request->validate([
            'payment_for'     => 'required|in:purchase,direct',
            'vendor_id'       => 'required|uuid|exists:vendors,id',
            'po_id'           => 'nullable|uuid|exists:purchase_orders,id|required_if:payment_for,purchase',
            'project_id'      => 'nullable|uuid|exists:projects,id',
            'cost_head_id'    => 'nullable|uuid|exists:account_heads,id|required_if:payment_for,direct',
            'amount'          => 'required|numeric|min:0.01',
            'payment_date'    => 'required|date',
            'payment_method'  => 'required|in:cash,bank_transfer,cheque,bkash,nagad,rocket,other',
            'reference'       => 'nullable|string|max:150',
            'account_head_id' => 'required|uuid|exists:account_heads,id',
            'notes'           => 'nullable|string',
        ], [
            'po_id.required_if'        => 'Select the purchase this payment is for.',
            'cost_head_id.required_if' => 'Select what the work was (the cost head).',
        ]);

        if ($validated['payment_for'] === 'purchase') {
            $po = PurchaseOrder::withSum('payments', 'amount')->find($validated['po_id']);
            if ($po->vendor_id !== $validated['vendor_id']) {
                return back()->withErrors(['po_id' => 'That purchase belongs to a different vendor.'])->withInput();
            }
            $own = $editing && $editing->po_id === $po->id ? (float) $editing->amount : 0;
            $due = max(round((float) $po->grand_total - (float) $po->payments_sum_amount + $own, 2), 0);
            if (round((float) $validated['amount'], 2) > $due) {
                return back()->withErrors(['amount' => 'Amount is more than the ' . number_format($due, 2) . " still due on {$po->code}."])->withInput();
            }
            $validated['project_id']   = $po->project_id;
            $validated['cost_head_id'] = null;
        } else {
            $isExpenseHead = AccountHead::where('id', $validated['cost_head_id'])
                ->whereHas('group', fn ($q) => $q->where('type', 'expense'))->exists();
            if (!$isExpenseHead) {
                return back()->withErrors(['cost_head_id' => 'Pick an expense account for the work.'])->withInput();
            }
            $validated['po_id'] = null;
        }

        unset($validated['payment_for']);
        return $validated;
    }

    public function show(VendorPayment $vendorPayment): Response
    {
        $this->authorize('viewAny', \App\Models\Invoice::class);
        $vendorPayment->load(['vendor', 'purchaseOrder', 'project', 'costHead', 'accountHead', 'createdBy']);
        return Inertia::render('Accounts/VendorPayments/Show', ['payment' => $vendorPayment]);
    }

}
