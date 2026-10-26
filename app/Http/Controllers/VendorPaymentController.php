<?php

namespace App\Http\Controllers;

use App\Models\AccountHead;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Vendor;
use App\Models\VendorPayment;
use App\Services\AccountingService;
use App\Services\CodeGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            ->when($request->project_id, fn ($q, $p) => $q->where('project_id', $p))
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

        // Purchases that still have money due, for the "against a purchase" picker.
        $openPurchases = PurchaseOrder::with('project:id,name')
            ->withSum('payments', 'amount')
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->orderByDesc('order_date')
            ->get()
            ->map(fn ($po) => [
                'id'        => $po->id,
                'code'      => $po->code,
                'vendor_id' => $po->vendor_id,
                'project'   => $po->project?->name,
                'date'      => $po->order_date?->toDateString(),
                'due'       => max(round((float) $po->grand_total - (float) $po->payments_sum_amount, 2), 0),
            ])
            ->filter(fn ($po) => $po['due'] > 0)
            ->values();

        return Inertia::render('Accounts/VendorPayments/Create', [
            'prefill'       => $request->po_id ? ['po_id' => $request->po_id] : null,
            'vendors'       => Vendor::where('is_active', true)->select('id', 'name', 'code', 'type')->orderBy('name')->get(),
            'openPurchases' => $openPurchases,
            'projects'      => Project::whereNotIn('status', ['completed', 'cancelled'])->select('id', 'name', 'code')->orderBy('name')->get(),
            'costHeads'     => AccountHead::whereHas('group', fn ($q) => $q->where('type', 'expense'))
                ->where('is_active', true)->select('id', 'name', 'code')->orderBy('code')->get(),
            'defaultCostHeadId' => AccountHead::where('code', '5002')->value('id'),
            'accountHeads'  => AccountHead::whereHas('group', fn ($q) => $q->where('type', 'asset'))
                ->where('is_active', true)->select('id', 'name', 'code')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', \App\Models\Invoice::class);

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
            $due = max(round((float) $po->grand_total - (float) $po->payments_sum_amount, 2), 0);
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

        $payment = VendorPayment::create(array_merge(
            \Illuminate\Support\Arr::except($validated, ['payment_for']),
            [
                'code'       => $this->codeGenerator->generate('PMT', 'vendor_payments'),
                'created_by' => auth()->id(),
            ]
        ));

        $this->accounting->postVendorPaymentMade($payment->fresh(['vendor', 'project']));

        if ($payment->po_id) {
            return redirect()->route('procurement.purchase-orders.show', $payment->po_id)->with('success', 'Payment recorded.');
        }
        return redirect()->route('accounts.vendor-payments.index')->with('success', 'Payment recorded.');
    }

    public function show(VendorPayment $vendorPayment): Response
    {
        $this->authorize('viewAny', \App\Models\Invoice::class);
        $vendorPayment->load(['vendor', 'purchaseOrder', 'project', 'costHead', 'accountHead', 'createdBy']);
        return Inertia::render('Accounts/VendorPayments/Show', ['payment' => $vendorPayment]);
    }

    public function edit(VendorPayment $vendorPayment): Response { abort(403); }
    public function update(Request $request, VendorPayment $vendorPayment): RedirectResponse { abort(403); }
    public function destroy(VendorPayment $vendorPayment): RedirectResponse { abort(403); }
}
