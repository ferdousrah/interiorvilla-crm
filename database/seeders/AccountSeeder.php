<?php

namespace Database\Seeders;

use App\Models\AccountGroup;
use App\Models\AccountHead;
use Illuminate\Database\Seeder;

class AccountSeeder extends Seeder
{
    public function run(): void
    {
        $groups = [
            ['name' => 'Assets', 'type' => 'asset'],
            ['name' => 'Liabilities', 'type' => 'liability'],
            ['name' => 'Equity', 'type' => 'equity'],
            ['name' => 'Income', 'type' => 'income'],
            ['name' => 'Expenses', 'type' => 'expense'],
        ];

        foreach ($groups as $group) {
            AccountGroup::firstOrCreate(['name' => $group['name']], $group);
        }

        $assetGroup = AccountGroup::where('type', 'asset')->first();
        $liabilityGroup = AccountGroup::where('type', 'liability')->first();
        $incomeGroup = AccountGroup::where('type', 'income')->first();
        $expenseGroup = AccountGroup::where('type', 'expense')->first();

        $heads = [
            ['code' => '1001', 'name' => 'Cash in Hand', 'group_id' => $assetGroup->id, 'is_system' => true],
            ['code' => '1002', 'name' => 'Bank Account', 'group_id' => $assetGroup->id, 'is_system' => true],
            ['code' => '1100', 'name' => 'Accounts Receivable - Clients', 'group_id' => $assetGroup->id, 'is_system' => true],
            ['code' => '2100', 'name' => 'Accounts Payable - Vendors', 'group_id' => $liabilityGroup->id, 'is_system' => true],
            ['code' => '4001', 'name' => 'Project Revenue', 'group_id' => $incomeGroup->id, 'is_system' => true],
            ['code' => '5001', 'name' => 'Material Purchase', 'group_id' => $expenseGroup->id, 'is_system' => true],
            ['code' => '5002', 'name' => 'Labour Cost', 'group_id' => $expenseGroup->id, 'is_system' => true],
            ['code' => '5003', 'name' => 'Office Rent', 'group_id' => $expenseGroup->id, 'is_system' => true],
            ['code' => '5004', 'name' => 'Utility Bills', 'group_id' => $expenseGroup->id, 'is_system' => true],
            ['code' => '5005', 'name' => 'Salaries', 'group_id' => $expenseGroup->id, 'is_system' => true],
            ['code' => '5006', 'name' => 'Transport', 'group_id' => $expenseGroup->id, 'is_system' => true],
            ['code' => '5007', 'name' => 'Miscellaneous Expense', 'group_id' => $expenseGroup->id, 'is_system' => true],
        ];

        foreach ($heads as $head) {
            AccountHead::firstOrCreate(['code' => $head['code']], $head);
        }
    }
}
