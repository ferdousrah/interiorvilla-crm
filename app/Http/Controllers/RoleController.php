<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    private function ensureAdmin(): void
    {
        abort_unless(auth()->user()->hasRole('admin'), 403);
    }

    public function index(): Response
    {
        $this->ensureAdmin();

        $roles = Role::withCount('users')->with('permissions:id,name')->orderBy('name')->get();
        $permissions = Permission::orderBy('name')->get();

        // Menu → Submenu mapping for nice hierarchical UI
        $menuMap = [
            'CRM' => [
                'icon' => '🎯',
                'submenus' => [
                    'Leads' => ['view.leads', 'create.leads', 'edit.leads', 'delete.leads', 'assign.leads'],
                ],
            ],
            'Clients' => [
                'icon' => '👥',
                'submenus' => [
                    'Clients' => ['view.clients', 'create.clients', 'edit.clients', 'delete.clients'],
                ],
            ],
            'Sales' => [
                'icon' => '💼',
                'submenus' => [
                    'Cost Estimations' => ['create.cost_estimations'],
                    'Quotations'       => ['create.quotations'],
                    'Materials'        => ['manage.materials'],
                ],
            ],
            'Projects' => [
                'icon' => '📁',
                'submenus' => [
                    'Projects' => ['view.projects', 'create.projects', 'edit.projects', 'delete.projects'],
                    'Tasks'    => ['manage.tasks'],
                ],
            ],
            'Procurement' => [
                'icon' => '🛒',
                'submenus' => [
                    'Procurement'     => ['view.procurement'],
                    'Purchase Orders' => ['create.purchase_orders', 'approve.purchase_orders'],
                ],
            ],
            'Inventory' => [
                'icon' => '📦',
                'submenus' => [
                    'Inventory' => ['view.inventory', 'manage.inventory'],
                ],
            ],
            'Accounts' => [
                'icon' => '💰',
                'submenus' => [
                    'Accounts' => ['view.accounts'],
                    'Invoices' => ['create.invoices'],
                    'Payments' => ['record.payments'],
                    'Expenses' => ['submit.expenses', 'approve.expenses'],
                    'Reports'  => ['view.reports'],
                ],
            ],
            'HR' => [
                'icon' => '👷',
                'submenus' => [
                    'Employees'  => ['manage.employees'],
                    'Leave'      => ['manage.leaves'],
                    'Attendance' => ['manage.attendance'],
                ],
            ],
            'Settings' => [
                'icon' => '⚙️',
                'submenus' => [
                    'Users' => ['manage.users'],
                    'Roles' => ['manage.roles'],
                ],
            ],
        ];

        // Build grouped structure with actual permission objects
        $permByName = $permissions->keyBy('name');
        $menus = [];
        $mapped = [];

        foreach ($menuMap as $menuName => $cfg) {
            $submenus = [];
            foreach ($cfg['submenus'] as $subName => $permNames) {
                $perms = [];
                foreach ($permNames as $pname) {
                    if ($p = $permByName->get($pname)) {
                        $action = explode('.', $pname)[0];
                        $perms[] = ['id' => $p->id, 'name' => $p->name, 'action' => $action];
                        $mapped[] = $p->name;
                    }
                }
                if (!empty($perms)) $submenus[] = ['name' => $subName, 'permissions' => $perms];
            }
            if (!empty($submenus)) {
                $menus[] = ['name' => $menuName, 'icon' => $cfg['icon'], 'submenus' => $submenus];
            }
        }

        // Catch any unmapped permissions
        $unmapped = $permissions->whereNotIn('name', $mapped);
        if ($unmapped->count() > 0) {
            $menus[] = [
                'name' => 'Other',
                'icon' => '🔧',
                'submenus' => [[
                    'name' => 'Miscellaneous',
                    'permissions' => $unmapped->map(fn($p) => [
                        'id' => $p->id, 'name' => $p->name,
                        'action' => explode('.', $p->name)[0],
                    ])->values(),
                ]],
            ];
        }

        return Inertia::render('Settings/Roles/Index', [
            'roles'          => $roles,
            'menus'          => $menus,
            'allPermissions' => $permissions->pluck('name'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->ensureAdmin();

        $validated = $request->validate([
            'name'        => 'required|string|max:100|unique:roles,name|regex:/^[a-z0-9_]+$/',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,name',
        ], [
            'name.regex' => 'Role name must be lowercase, alphanumeric, with underscores only (e.g. sales_manager).',
        ]);

        $role = Role::create(['name' => $validated['name'], 'guard_name' => 'web']);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return back()->with('success', "Role '{$role->name}' created.");
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $this->ensureAdmin();

        if ($role->name === 'admin') {
            return back()->with('error', 'The admin role cannot be renamed.');
        }

        $validated = $request->validate([
            'name'        => 'required|string|max:100|regex:/^[a-z0-9_]+$/|unique:roles,name,' . $role->id,
        ]);

        $role->update(['name' => $validated['name']]);

        return back()->with('success', 'Role renamed.');
    }

    public function updatePermissions(Request $request, Role $role): RedirectResponse
    {
        $this->ensureAdmin();

        if ($role->name === 'admin') {
            return back()->with('error', 'admin has all permissions — cannot modify.');
        }

        $validated = $request->validate([
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role->syncPermissions($validated['permissions'] ?? []);

        return back()->with('success', "Permissions for '{$role->name}' updated.");
    }

    public function destroy(Role $role): RedirectResponse
    {
        $this->ensureAdmin();

        if ($role->name === 'admin') {
            return back()->with('error', "The 'admin' role is a system role and cannot be deleted.");
        }

        if ($role->users()->count() > 0) {
            return back()->with('error', "Cannot delete role — it's assigned to {$role->users()->count()} user(s). Reassign them first.");
        }

        $role->delete();

        return back()->with('success', 'Role deleted.');
    }
}
