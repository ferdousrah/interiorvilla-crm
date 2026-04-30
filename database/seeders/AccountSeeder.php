<?php

namespace Database\Seeders;

use App\Models\AccountGroup;
use App\Models\AccountHead;
use Illuminate\Database\Seeder;

/**
 * Seeds a common chart of accounts for an interior design / construction
 * business. All operations are idempotent (firstOrCreate) so it's safe to
 * re-run on every deploy without duplicating data.
 *
 * Numbering convention (loose — original system heads preserved as-is):
 *   1xxx = Assets         (10xx cash & bank, 11xx receivables, 12xx inventory, 15xx fixed assets)
 *   2xxx = Liabilities    (21xx payables,    23xx loans,        25xx customer advances)
 *   3xxx = Equity
 *   4xxx = Income         (40xx service revenue,                49xx other income)
 *   5xxx-7xxx = Expenses  (kept flat — the existing system heads use 50xx)
 *
 * `is_system => true` means the AccountingService references this head by
 * code; do not rename or delete those.
 */
class AccountSeeder extends Seeder
{
    public function run(): void
    {
        // 1) Top-level groups (one per type)
        $groups = [
            ['name' => 'Assets',      'type' => 'asset'],
            ['name' => 'Liabilities', 'type' => 'liability'],
            ['name' => 'Equity',      'type' => 'equity'],
            ['name' => 'Income',      'type' => 'income'],
            ['name' => 'Expenses',    'type' => 'expense'],
        ];

        foreach ($groups as $group) {
            AccountGroup::firstOrCreate(['name' => $group['name']], $group);
        }

        $assetGroup     = AccountGroup::where('type', 'asset')->first();
        $liabilityGroup = AccountGroup::where('type', 'liability')->first();
        $equityGroup    = AccountGroup::where('type', 'equity')->first();
        $incomeGroup    = AccountGroup::where('type', 'income')->first();
        $expenseGroup   = AccountGroup::where('type', 'expense')->first();

        // 2) Account heads — comprehensive defaults
        $heads = [
            // ── ASSETS ────────────────────────────────────────────────────
            // Cash & Bank (10xx)
            ['code' => '1001', 'name' => 'Cash in Hand',                 'group_id' => $assetGroup->id, 'is_system' => true],
            ['code' => '1002', 'name' => 'Bank Account',                 'group_id' => $assetGroup->id, 'is_system' => true],
            ['code' => '1003', 'name' => 'Petty Cash',                   'group_id' => $assetGroup->id],
            ['code' => '1010', 'name' => 'bKash Wallet',                 'group_id' => $assetGroup->id],
            ['code' => '1011', 'name' => 'Nagad Wallet',                 'group_id' => $assetGroup->id],
            ['code' => '1012', 'name' => 'Rocket Wallet',                'group_id' => $assetGroup->id],

            // Receivables (11xx)
            ['code' => '1100', 'name' => 'Accounts Receivable - Clients','group_id' => $assetGroup->id, 'is_system' => true],
            ['code' => '1110', 'name' => 'Advance to Vendors',           'group_id' => $assetGroup->id],
            ['code' => '1120', 'name' => 'Advance to Employees',         'group_id' => $assetGroup->id],
            ['code' => '1130', 'name' => 'Security Deposits Paid',       'group_id' => $assetGroup->id],
            ['code' => '1190', 'name' => 'Other Receivables',            'group_id' => $assetGroup->id],

            // Inventory (12xx)
            ['code' => '1201', 'name' => 'Raw Materials Inventory',      'group_id' => $assetGroup->id],
            ['code' => '1202', 'name' => 'Work in Progress',             'group_id' => $assetGroup->id],
            ['code' => '1203', 'name' => 'Finished Goods',               'group_id' => $assetGroup->id],

            // Fixed Assets (15xx)
            ['code' => '1501', 'name' => 'Office Equipment',             'group_id' => $assetGroup->id],
            ['code' => '1502', 'name' => 'Furniture & Fixtures',         'group_id' => $assetGroup->id],
            ['code' => '1503', 'name' => 'Vehicles',                     'group_id' => $assetGroup->id],
            ['code' => '1504', 'name' => 'Tools & Machinery',            'group_id' => $assetGroup->id],
            ['code' => '1505', 'name' => 'Computer & Software',          'group_id' => $assetGroup->id],
            ['code' => '1599', 'name' => 'Accumulated Depreciation',     'group_id' => $assetGroup->id],

            // ── LIABILITIES ───────────────────────────────────────────────
            // Payables (21xx)
            ['code' => '2100', 'name' => 'Accounts Payable - Vendors',   'group_id' => $liabilityGroup->id, 'is_system' => true],
            ['code' => '2110', 'name' => 'Salary Payable',               'group_id' => $liabilityGroup->id],
            ['code' => '2120', 'name' => 'VAT Payable',                  'group_id' => $liabilityGroup->id],
            ['code' => '2121', 'name' => 'Income Tax Payable',           'group_id' => $liabilityGroup->id],
            ['code' => '2130', 'name' => 'Utility Bills Payable',        'group_id' => $liabilityGroup->id],
            ['code' => '2190', 'name' => 'Other Payables',               'group_id' => $liabilityGroup->id],

            // Loans (23xx)
            ['code' => '2301', 'name' => 'Bank Loan',                    'group_id' => $liabilityGroup->id],
            ['code' => '2302', 'name' => 'Director Loan',                'group_id' => $liabilityGroup->id],
            ['code' => '2303', 'name' => 'Vehicle Loan',                 'group_id' => $liabilityGroup->id],

            // Customer Advances (25xx)
            ['code' => '2501', 'name' => 'Client Advance Payments',      'group_id' => $liabilityGroup->id],

            // ── EQUITY ────────────────────────────────────────────────────
            ['code' => '3001', 'name' => "Owner's Capital",              'group_id' => $equityGroup->id],
            ['code' => '3002', 'name' => 'Retained Earnings',            'group_id' => $equityGroup->id],
            ['code' => '3003', 'name' => 'Drawings',                     'group_id' => $equityGroup->id],

            // ── INCOME ────────────────────────────────────────────────────
            // Service Revenue (40xx)
            ['code' => '4001', 'name' => 'Project Revenue',              'group_id' => $incomeGroup->id, 'is_system' => true],
            ['code' => '4002', 'name' => 'Design Consultation Income',   'group_id' => $incomeGroup->id],
            ['code' => '4003', 'name' => 'Site Visit Charge Income',     'group_id' => $incomeGroup->id],
            ['code' => '4004', 'name' => 'Supervision Fee Income',       'group_id' => $incomeGroup->id],
            ['code' => '4005', 'name' => '3D Design Income',             'group_id' => $incomeGroup->id],

            // Other Income (49xx)
            ['code' => '4901', 'name' => 'Interest Income',              'group_id' => $incomeGroup->id],
            ['code' => '4902', 'name' => 'Discount Received',            'group_id' => $incomeGroup->id],
            ['code' => '4903', 'name' => 'Foreign Exchange Gain',        'group_id' => $incomeGroup->id],
            ['code' => '4999', 'name' => 'Miscellaneous Income',         'group_id' => $incomeGroup->id],

            // ── EXPENSES ──────────────────────────────────────────────────
            // System heads (legacy 50xx codes — preserved as-is)
            ['code' => '5001', 'name' => 'Material Purchase',            'group_id' => $expenseGroup->id, 'is_system' => true],
            ['code' => '5002', 'name' => 'Labour Cost',                  'group_id' => $expenseGroup->id, 'is_system' => true],
            ['code' => '5003', 'name' => 'Office Rent',                  'group_id' => $expenseGroup->id, 'is_system' => true],
            ['code' => '5004', 'name' => 'Utility Bills',                'group_id' => $expenseGroup->id, 'is_system' => true],
            ['code' => '5005', 'name' => 'Salaries',                     'group_id' => $expenseGroup->id, 'is_system' => true],
            ['code' => '5006', 'name' => 'Transport',                    'group_id' => $expenseGroup->id, 'is_system' => true],
            ['code' => '5007', 'name' => 'Miscellaneous Expense',        'group_id' => $expenseGroup->id, 'is_system' => true],

            // Direct / project expenses (5010+)
            ['code' => '5010', 'name' => 'Subcontractor Expenses',       'group_id' => $expenseGroup->id],
            ['code' => '5011', 'name' => 'Site Transport',               'group_id' => $expenseGroup->id],
            ['code' => '5012', 'name' => 'Site Utilities',               'group_id' => $expenseGroup->id],
            ['code' => '5013', 'name' => 'Site Equipment Rental',        'group_id' => $expenseGroup->id],

            // Operating expenses (60xx)
            ['code' => '6001', 'name' => 'Office Supplies',              'group_id' => $expenseGroup->id],
            ['code' => '6002', 'name' => 'Internet & Phone',             'group_id' => $expenseGroup->id],
            ['code' => '6003', 'name' => 'Marketing & Advertising',      'group_id' => $expenseGroup->id],
            ['code' => '6004', 'name' => 'Vehicle Fuel',                 'group_id' => $expenseGroup->id],
            ['code' => '6005', 'name' => 'Repairs & Maintenance',        'group_id' => $expenseGroup->id],
            ['code' => '6006', 'name' => 'Professional Fees',            'group_id' => $expenseGroup->id],
            ['code' => '6007', 'name' => 'Insurance',                    'group_id' => $expenseGroup->id],
            ['code' => '6008', 'name' => 'Travel & Conveyance',          'group_id' => $expenseGroup->id],
            ['code' => '6009', 'name' => 'Staff Welfare',                'group_id' => $expenseGroup->id],
            ['code' => '6010', 'name' => 'Printing & Stationery',        'group_id' => $expenseGroup->id],
            ['code' => '6011', 'name' => 'Software Subscriptions',       'group_id' => $expenseGroup->id],

            // Financial expenses (70xx)
            ['code' => '7001', 'name' => 'Bank Charges',                 'group_id' => $expenseGroup->id],
            ['code' => '7002', 'name' => 'Interest Expense',             'group_id' => $expenseGroup->id],
            ['code' => '7003', 'name' => 'Loan Interest',                'group_id' => $expenseGroup->id],

            // Other expenses (79xx)
            ['code' => '7901', 'name' => 'Depreciation Expense',         'group_id' => $expenseGroup->id],
            ['code' => '7902', 'name' => 'Bad Debt Expense',             'group_id' => $expenseGroup->id],
            ['code' => '7903', 'name' => 'Foreign Exchange Loss',        'group_id' => $expenseGroup->id],
        ];

        foreach ($heads as $head) {
            AccountHead::firstOrCreate(['code' => $head['code']], $head);
        }
    }
}
