<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view.accounts');
    }

    public function view(User $user, Invoice $invoice): bool
    {
        return $user->hasPermissionTo('view.accounts');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create.invoices');
    }

    public function update(User $user, Invoice $invoice): bool
    {
        return $user->hasPermissionTo('create.invoices');
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        return $user->hasRole('admin');
    }
}
