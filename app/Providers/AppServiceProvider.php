<?php

namespace App\Providers;

use App\Models\Client;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Project;
use App\Models\User;
use App\Models\Vendor;
use App\Policies\ClientPolicy;
use App\Policies\EmployeePolicy;
use App\Policies\InvoicePolicy;
use App\Policies\LeadPolicy;
use App\Policies\ProjectPolicy;
use App\Policies\UserPolicy;
use App\Models\InventoryItem;
use App\Policies\InventoryItemPolicy;
use App\Policies\VendorPolicy;
use App\Services\CodeGeneratorService;
use App\Services\AccountingService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CodeGeneratorService::class);
        $this->app->singleton(AccountingService::class);
    }

    public function boot(): void
    {
        Gate::policy(Client::class, ClientPolicy::class);
        Gate::policy(Lead::class, LeadPolicy::class);
        Gate::policy(Project::class, ProjectPolicy::class);
        Gate::policy(Vendor::class, VendorPolicy::class);
        Gate::policy(Invoice::class, InvoicePolicy::class);
        Gate::policy(InventoryItem::class, InventoryItemPolicy::class);
        Gate::policy(Employee::class, EmployeePolicy::class);
        Gate::policy(User::class, UserPolicy::class);
    }
}
