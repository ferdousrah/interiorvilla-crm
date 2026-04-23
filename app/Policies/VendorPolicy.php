<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Vendor;

class VendorPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view.procurement');
    }

    public function view(User $user, Vendor $vendor): bool
    {
        return $user->hasPermissionTo('view.procurement');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('view.procurement');
    }

    public function update(User $user, Vendor $vendor): bool
    {
        return $user->hasPermissionTo('view.procurement');
    }

    public function delete(User $user, Vendor $vendor): bool
    {
        return $user->hasRole('admin');
    }
}
