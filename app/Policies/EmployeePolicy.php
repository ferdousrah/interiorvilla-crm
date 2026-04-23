<?php

namespace App\Policies;

use App\Models\Employee;
use App\Models\User;

class EmployeePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('manage.employees');
    }

    public function view(User $user, Employee $employee): bool
    {
        return $user->hasPermissionTo('manage.employees')
            || $employee->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage.employees');
    }

    public function update(User $user, Employee $employee): bool
    {
        return $user->hasPermissionTo('manage.employees');
    }

    public function delete(User $user, Employee $employee): bool
    {
        return $user->hasRole('admin');
    }
}
