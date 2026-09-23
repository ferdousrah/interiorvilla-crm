<?php

namespace App\Http\Controllers;

use App\Models\AccountHead;
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

        $payments = VendorPayment::with(['vendor', 'purchaseOrder', 'accountHead'])
            ->orderByDesc('payment_date')
            ->paginate(25)->withQueryString();

        return Inertia::render('Accounts/VendorPayments/Index', ['payments' => $payments]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', \App\Models\Invoice::class);

        // "Pay Due" from a purchase: prefill vendor, link and outstanding amount
        $prefill = null;
        if ($request->po_id && ($po = PurchaseOrder::withSum('payments', 'amount')->find($request->po_id))) {
            $prefill = [
                'vendor_id' => $po->vendor_id,
                'po_id'     => $po->id,
                'po_code'   => $po->code,
                'amount'    => max(round((float) $po->grand_total - (float) $po->payments_sum_amount, 2), 0),
            ];
        }

        return Inertia::render('Accounts/VendorPayments/Create', [
            'prefill' => $prefill,
            'vendors' => Vendor::where('is_active', true)->select('id', 'name', 'code')->get(),
            'accountHeads' => AccountHead::whereHas('group', fn($q) => $q->where('type', 'asset'))
                ->where('is_active', true)->select('id', 'name', 'code')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', \App\Models\Invoice::class);

        $validated = $request->validate([
            'vendor_id' => 'required|uuid|exists:vendors,id',
            'po_id' => 'nullable|uuid|exists:purchase_orders,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'payment_method' => 'required|in:cash,bank_transfer,cheque,bkash,nagad,rocket,other',
            'reference' => 'nullable|string|max:150',
            'account_head_id' => 'required|uuid|exists:account_heads,id',
            'notes' => 'nullable|string',
        ]);

        $code = $this->codeGenerator->generate('PMT', 'vendor_payments');
        $payment = VendorPayment::create(array_merge($validated, [
            'code' => $code,
            'created_by' => auth()->id(),
        ]));

        $this->accounting->postVendorPaymentMade($payment->fresh(['vendor']));

        if ($payment->po_id) {
            return redirect()->route('procurement.purchase-orders.show', $payment->po_id)->with('success', 'Payment recorded.');
        }
        return redirect()->route('accounts.vendor-payments.index')->with('success', 'Payment recorded.');
    }

    public function show(VendorPayment $vendorPayment): Response
    {
        $this->authorize('viewAny', \App\Models\Invoice::class);
        $vendorPayment->load(['vendor', 'purchaseOrder', 'accountHead', 'createdBy']);
        return Inertia::render('Accounts/VendorPayments/Show', ['payment' => $vendorPayment]);
    }

    public function edit(VendorPayment $vendorPayment): Response { abort(403); }
    public function update(Request $request, VendorPayment $vendorPayment): RedirectResponse { abort(403); }
    public function destroy(VendorPayment $vendorPayment): RedirectResponse { abort(403); }
}
