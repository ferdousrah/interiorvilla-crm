<?php

namespace App\Http\Controllers;

use App\Models\AccountHead;
use App\Models\FundTransfer;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Services\AccountingService;
use App\Services\CodeGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FundTransferController extends Controller
{
    public function __construct(
        private CodeGeneratorService $codeGenerator,
        private AccountingService $accounting
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', Invoice::class);

        $transfers = FundTransfer::with(['fromAccount:id,code,name', 'toAccount:id,code,name', 'createdBy:id,name'])
            ->orderByDesc('transfer_date')->orderByDesc('created_at')
            ->paginate(25)->withQueryString();

        // Cash, bank and wallet accounts (10xx), each with its current ledger balance.
        $movement = DB::table('journal_lines')
            ->selectRaw("account_head_id, SUM(CASE WHEN type = 'debit' THEN amount ELSE -amount END) as net")
            ->groupBy('account_head_id')
            ->pluck('net', 'account_head_id');

        $accounts = AccountHead::whereHas('group', fn ($q) => $q->where('type', 'asset'))
            ->where('is_active', true)
            ->where('code', 'like', '10%')
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'opening_balance'])
            ->map(fn ($a) => [
                'id'      => $a->id,
                'code'    => $a->code,
                'name'    => $a->name,
                'balance' => round((float) $a->opening_balance + (float) ($movement[$a->id] ?? 0), 2),
            ]);

        return Inertia::render('Accounts/Transfers/Index', [
            'transfers' => $transfers,
            'accounts'  => $accounts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Invoice::class);

        $validated = $this->validateTransfer($request);

        $transfer = FundTransfer::create(array_merge($validated, [
            'code'       => $this->codeGenerator->generate('TRF', 'fund_transfers'),
            'created_by' => auth()->id(),
        ]));

        $this->accounting->postFundTransfer($transfer->fresh(['fromAccount', 'toAccount']));

        return back()->with('success', "Transfer {$transfer->code} recorded.");
    }

    public function update(Request $request, FundTransfer $transfer): RedirectResponse
    {
        $this->authorize('create', Invoice::class);

        $validated = $this->validateTransfer($request);

        DB::transaction(function () use ($transfer, $validated) {
            $transfer->update($validated);
            $this->ledgerEntries($transfer)->delete(); // cascades to journal_lines
        });

        $this->accounting->postFundTransfer($transfer->fresh(['fromAccount', 'toAccount']));

        return back()->with('success', "Transfer {$transfer->code} updated.");
    }

    public function destroy(FundTransfer $transfer): RedirectResponse
    {
        abort_unless(auth()->user()->hasRole('admin'), 403, 'Only an admin can delete transfers.');

        DB::transaction(function () use ($transfer) {
            $this->ledgerEntries($transfer)->delete();
            $transfer->delete();
        });

        return back()->with('success', "Transfer {$transfer->code} deleted and reversed.");
    }

    private function validateTransfer(Request $request): array
    {
        return $request->validate([
            'from_account_id' => 'required|uuid|exists:account_heads,id',
            'to_account_id'   => 'required|uuid|exists:account_heads,id|different:from_account_id',
            'amount'          => 'required|numeric|min:0.01',
            'transfer_date'   => 'required|date',
            'reference'       => 'nullable|string|max:150',
            'notes'           => 'nullable|string',
        ], [
            'to_account_id.different' => 'Choose a different account to transfer to.',
        ]);
    }

    private function ledgerEntries(FundTransfer $transfer)
    {
        return JournalEntry::where('reference_type', 'fund_transfer')->where('reference_id', $transfer->id);
    }
}
