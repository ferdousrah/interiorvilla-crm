<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;

class LeadPolicy
{
    /**
     * Admin bypasses all checks.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('admin')) return true;
        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view.leads');
    }

    /**
     * Sales executive can only view leads assigned to them (or created by them).
     * Sales admin + others with view.leads see everything.
     */
    public function view(User $user, Lead $lead): bool
    {
        if (!$user->hasPermissionTo('view.leads')) return false;

        if ($this->isSalesExecutiveOnly($user)) {
            return $lead->assigned_to === $user->id || $lead->created_by === $user->id;
        }
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create.leads');
    }

    /**
     * Sales executive can only edit their own assigned leads.
     * They CANNOT change the assigned_to field (enforced in controller).
     */
    public function update(User $user, Lead $lead): bool
    {
        if (!$user->hasPermissionTo('edit.leads')) return false;

        if ($this->isSalesExecutiveOnly($user)) {
            return $lead->assigned_to === $user->id;
        }
        return true;
    }

    public function delete(User $user, Lead $lead): bool
    {
        if (!$user->hasPermissionTo('delete.leads')) return false;

        // Sales executives cannot delete leads
        if ($this->isSalesExecutiveOnly($user)) return false;

        return true;
    }

    /**
     * Only users with assign.leads (sales_manager / admin) can reassign leads.
     */
    public function assign(User $user, Lead $lead = null): bool
    {
        return $user->hasPermissionTo('assign.leads');
    }

    /**
     * Is this user *only* a sales_executive (not also admin or sales_manager)?
     */
    private function isSalesExecutiveOnly(User $user): bool
    {
        return $user->hasRole('sales_executive')
            && !$user->hasAnyRole(['admin', 'sales_manager']);
    }
}
