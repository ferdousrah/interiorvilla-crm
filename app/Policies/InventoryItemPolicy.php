<?php

namespace App\Policies;

use App\Models\InventoryItem;
use App\Models\User;

class InventoryItemPolicy
{
    public function viewAny(User $user): bool { return $user->hasPermissionTo('view.inventory'); }
    public function view(User $user, InventoryItem $item): bool { return $user->hasPermissionTo('view.inventory'); }
    public function create(User $user): bool { return $user->hasPermissionTo('manage.inventory'); }
    public function update(User $user, InventoryItem $item): bool { return $user->hasPermissionTo('manage.inventory'); }
    public function delete(User $user, InventoryItem $item): bool { return $user->hasRole('admin'); }
}
