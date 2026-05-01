<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\PasswordChangeController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\LeadActivityController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\ProjectPhaseController;
use App\Http\Controllers\ProjectMemberController;
use App\Http\Controllers\ProjectNoteController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\RequisitionController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\GRNController;
use App\Http\Controllers\InventoryCategoryController;
use App\Http\Controllers\InventoryItemController;
use App\Http\Controllers\StockTransactionController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ClientReceiptController;
use App\Http\Controllers\VendorPaymentController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\AccountHeadController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\QuotationTemplateController;
use App\Http\Controllers\CostEstimationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\GlobalSearchController;
use App\Http\Controllers\MyExpensesController;
use App\Http\Controllers\MyTasksController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

// Auth routes (guest)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
    Route::get('/forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
    Route::get('/reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('/reset-password', [NewPasswordController::class, 'store'])->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // --- Public quotation view (signed URL, no login required) is OUTSIDE auth below ---

    Route::get('/change-password', [PasswordChangeController::class, 'create'])->name('password.change');
    Route::post('/change-password', [PasswordChangeController::class, 'update'])->name('password.change.update');

    // Global search
    Route::get('/api/search', [GlobalSearchController::class, 'search'])->name('global.search');

    // User Guide (static content page)
    Route::get('/user-guide', fn() => \Inertia\Inertia::render('UserGuide'))->name('user-guide');

    // Materials API (for Cost Estimation picker)
    Route::get('/api/materials', [MaterialController::class, 'search'])->name('api.materials');

    // Quick-add lookups used by the Materials modal
    Route::post('/api/material-units', [MaterialController::class, 'storeUnit'])->name('api.material-units.store');
    Route::post('/api/material-categories', [MaterialController::class, 'storeCategory'])->name('api.material-categories.store');

    // Quotation templates API (for Quotation Create "Use Template" picker)
    Route::get('/api/quotation-templates', [QuotationTemplateController::class, 'searchApi'])->name('api.quotation-templates');

    // My Expenses (site engineer expense submission)
    Route::get('/my-expenses', [MyExpensesController::class, 'index'])->name('my-expenses.index');
    Route::post('/my-expenses', [MyExpensesController::class, 'store'])->name('my-expenses.store');

    // My Tasks (standalone task management)
    Route::get('/tasks', [MyTasksController::class, 'index'])->name('tasks.index');
    Route::post('/tasks', [MyTasksController::class, 'store'])->name('tasks.store');
    Route::put('/tasks/{task}', [MyTasksController::class, 'update'])->name('tasks.update');
    Route::patch('/tasks/{task}/status', [MyTasksController::class, 'updateStatus'])->name('tasks.status');
    Route::delete('/tasks/{task}', [MyTasksController::class, 'destroy'])->name('tasks.destroy');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar'])->name('profile.avatar');
    Route::delete('/profile/avatar', [ProfileController::class, 'removeAvatar'])->name('profile.avatar.remove');

    Route::middleware('force.password')->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        // Clients
        Route::resource('clients', ClientController::class);

        // CRM
        Route::prefix('crm')->name('crm.')->group(function () {
            Route::get('/', [LeadController::class, 'index'])->name('index');
            Route::get('/dashboard', [LeadController::class, 'dashboard'])->name('dashboard');
            Route::get('/reports', [LeadController::class, 'reports'])->name('reports');
            Route::get('/follow-ups', [LeadController::class, 'followUps'])->name('follow-ups');
            Route::get('/leads', [LeadController::class, 'list'])->name('leads.list');
            Route::resource('leads', LeadController::class)->except(['index']);
            Route::patch('leads/{lead}/status', [LeadController::class, 'updateStatus'])->name('leads.status');
            Route::patch('leads/{lead}/follow-up-done', [LeadController::class, 'followUpDone'])->name('leads.follow-up-done');
            Route::post('leads/{lead}/paid-services', [LeadController::class, 'storePaidService'])->name('leads.paid-services.store');
            Route::post('leads/{lead}/activities', [LeadActivityController::class, 'store'])->name('leads.activities.store');
            Route::delete('activities/{activity}', [LeadActivityController::class, 'destroy'])->name('activities.destroy');
            Route::post('leads/{lead}/convert', [LeadController::class, 'convertToClient'])->name('leads.convert');
        });

        // Cost Estimations
        Route::resource('cost-estimations', CostEstimationController::class);
        Route::patch('cost-estimations/{cost_estimation}/finalize', [CostEstimationController::class, 'markFinal'])->name('cost-estimations.finalize');
        Route::post('cost-estimations/{cost_estimation}/generate-quotation', [CostEstimationController::class, 'generateQuotation'])->name('cost-estimations.generate-quotation');

        // Quotations
        Route::resource('quotations', QuotationController::class);
        Route::patch('quotations/{quotation}/send', [QuotationController::class, 'markSent'])->name('quotations.send');
        Route::patch('quotations/{quotation}/approve', [QuotationController::class, 'approve'])->name('quotations.approve');
        Route::patch('quotations/{quotation}/reject', [QuotationController::class, 'reject'])->name('quotations.reject');
        Route::post('quotations/{quotation}/revise', [QuotationController::class, 'revise'])->name('quotations.revise');
        Route::post('quotations/{quotation}/convert-to-project', [QuotationController::class, 'convertToProject'])->name('quotations.convert');
        Route::post('quotations/{quotation}/send-email', [QuotationController::class, 'sendEmail'])->name('quotations.send-email');
        Route::get('quotations/{quotation}/share-link', [QuotationController::class, 'shareLink'])->name('quotations.share-link');
        Route::get('quotations/{quotation}/pdf', [QuotationController::class, 'downloadPdf'])->name('quotations.pdf');

        // Projects
        Route::resource('projects', ProjectController::class);
        Route::prefix('projects/{project}')->name('projects.')->group(function () {
            Route::resource('tasks', TaskController::class)->except(['index', 'show']);
            Route::patch('tasks/{task}/status', [TaskController::class, 'updateStatus'])->name('tasks.status');
            Route::resource('phases', ProjectPhaseController::class)->except(['index', 'show']);
            Route::patch('phases/{phase}/status', [ProjectPhaseController::class, 'updateStatus'])->name('phases.status');
            Route::post('phases/reorder', [ProjectPhaseController::class, 'reorder'])->name('phases.reorder');
            Route::resource('members', ProjectMemberController::class)->only(['store', 'destroy']);
            Route::resource('notes', ProjectNoteController::class)->except(['index', 'show']);
            Route::patch('notes/{note}/pin', [ProjectNoteController::class, 'togglePin'])->name('notes.pin');
        });

        // Procurement
        Route::prefix('procurement')->name('procurement.')->group(function () {
            Route::resource('vendors', VendorController::class);
            Route::resource('requisitions', RequisitionController::class);
            Route::patch('requisitions/{requisition}/approve', [RequisitionController::class, 'approve'])->name('requisitions.approve');
            Route::patch('requisitions/{requisition}/reject', [RequisitionController::class, 'reject'])->name('requisitions.reject');
            Route::resource('purchase-orders', PurchaseOrderController::class);
            Route::get('purchase-orders/{purchaseOrder}/pdf', [PurchaseOrderController::class, 'pdf'])->name('purchase-orders.pdf');
            Route::resource('grn', GRNController::class);
        });

        // Inventory
        Route::prefix('inventory')->name('inventory.')->group(function () {
            Route::resource('items', InventoryItemController::class);
            Route::resource('transactions', StockTransactionController::class)->only(['store']);
            Route::get('issue', [StockTransactionController::class, 'issueForm'])->name('issue');
            Route::post('issue', [StockTransactionController::class, 'issue'])->name('issue.store');
            Route::get('adjustments', [StockTransactionController::class, 'adjustmentForm'])->name('adjustments');
            Route::post('adjustments', [StockTransactionController::class, 'adjustment'])->name('adjustments.store');
            Route::get('report', [StockTransactionController::class, 'report'])->name('report');
            Route::get('stock-report', [StockTransactionController::class, 'currentStockReport'])->name('stock-report');
            Route::resource('warehouses', WarehouseController::class);
            Route::get('categories', [InventoryCategoryController::class, 'index'])->name('categories.index');
            Route::post('categories', [InventoryCategoryController::class, 'store'])->name('categories.store');
            Route::put('categories/{category}', [InventoryCategoryController::class, 'update'])->name('categories.update');
            Route::delete('categories/{category}', [InventoryCategoryController::class, 'destroy'])->name('categories.destroy');
        });

        // Accounts
        Route::prefix('accounts')->name('accounts.')->group(function () {
            Route::get('/', [InvoiceController::class, 'dashboard'])->name('dashboard');
            Route::resource('invoices', InvoiceController::class);
            Route::get('invoices/{invoice}/pdf', [InvoiceController::class, 'pdf'])->name('invoices.pdf');
            Route::get('invoices/{invoice}/share-link', [InvoiceController::class, 'shareLink'])->name('invoices.share-link');
            Route::post('invoices/{invoice}/send-email', [InvoiceController::class, 'sendEmail'])->name('invoices.send-email');
            Route::resource('receipts', ClientReceiptController::class);
            Route::resource('vendor-payments', VendorPaymentController::class);
            Route::resource('expenses', ExpenseController::class);
            Route::patch('expenses/{expense}/approve', [ExpenseController::class, 'approve'])->name('expenses.approve');
            Route::patch('expenses/{expense}/reject', [ExpenseController::class, 'reject'])->name('expenses.reject');

            // Paid Service approvals (submitted from CRM lead pages)
            Route::get('paid-service-approvals', [\App\Http\Controllers\PaidServiceSubmissionController::class, 'index'])->name('paid-service-approvals.index');
            Route::patch('paid-service-approvals/{submission}/approve', [\App\Http\Controllers\PaidServiceSubmissionController::class, 'approve'])->name('paid-service-approvals.approve');
            Route::patch('paid-service-approvals/{submission}/reject', [\App\Http\Controllers\PaidServiceSubmissionController::class, 'reject'])->name('paid-service-approvals.reject');
            Route::get('chart', [AccountHeadController::class, 'index'])->name('chart');
            Route::post('account-groups', [AccountHeadController::class, 'storeGroup'])->name('account-groups.store');
            Route::resource('account-heads', AccountHeadController::class)->except(['index']);

            Route::prefix('reports')->name('reports.')->group(function () {
                Route::get('/', [ReportController::class, 'index'])->name('index');
                Route::get('trial-balance', [ReportController::class, 'trialBalance'])->name('trial-balance');
                Route::get('client-ledger', [ReportController::class, 'clientLedger'])->name('client-ledger');
                Route::get('vendor-ledger', [ReportController::class, 'vendorLedger'])->name('vendor-ledger');
                Route::get('cash-bank-statement', [ReportController::class, 'cashBankStatement'])->name('cash-bank');
                Route::get('project-pl', [ReportController::class, 'projectPL'])->name('project-pl');
                Route::get('receivables', [ReportController::class, 'receivables'])->name('receivables');
                Route::get('payables', [ReportController::class, 'payables'])->name('payables');
                Route::get('export/{type}', [ReportController::class, 'export'])->name('export');
            });
        });

        // HR
        Route::prefix('hr')->name('hr.')->group(function () {
            Route::resource('employees', EmployeeController::class);
            Route::resource('leaves', LeaveController::class);
            Route::patch('leaves/{leave}/approve', [LeaveController::class, 'approve'])->name('leaves.approve');
            Route::patch('leaves/{leave}/reject', [LeaveController::class, 'reject'])->name('leaves.reject');
            Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
            Route::post('attendance', [AttendanceController::class, 'store'])->name('attendance.store');
            Route::post('attendance/bulk', [AttendanceController::class, 'bulk'])->name('attendance.bulk');
            Route::get('attendance/export', [AttendanceController::class, 'export'])->name('attendance.export');
        });

        // Settings
        Route::prefix('settings')->name('settings.')->group(function () {
            Route::get('general', [SettingController::class, 'index'])->name('general');
            Route::put('general', [SettingController::class, 'update'])->name('general.update');
            Route::post('general/logo', [SettingController::class, 'uploadLogo'])->name('general.logo');
            Route::delete('general/logo', [SettingController::class, 'removeLogo'])->name('general.logo.remove');
            Route::post('general/signature', [SettingController::class, 'uploadSignature'])->name('general.signature');
            Route::delete('general/signature', [SettingController::class, 'removeSignature'])->name('general.signature.remove');
            Route::post('general/quotation-logo', [SettingController::class, 'uploadQuotationLogo'])->name('general.quotation-logo');
            Route::delete('general/quotation-logo', [SettingController::class, 'removeQuotationLogo'])->name('general.quotation-logo.remove');
            Route::post('general/clear-sample-data', [SettingController::class, 'clearSampleData'])->name('general.clear-sample-data');
            Route::resource('users', UserController::class);
            Route::patch('users/{user}/activate', [UserController::class, 'toggleActive'])->name('users.activate');
            Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
            Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
            Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
            Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
            Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
            Route::patch('roles/{role}/permissions', [RoleController::class, 'updatePermissions'])->name('roles.permissions');
            Route::get('audit-log', [AuditLogController::class, 'index'])->name('audit-log');
            Route::get('materials', [MaterialController::class, 'index'])->name('materials.index');
            Route::post('materials', [MaterialController::class, 'store'])->name('materials.store');
            Route::put('materials/{material}', [MaterialController::class, 'update'])->name('materials.update');
            Route::delete('materials/{material}', [MaterialController::class, 'destroy'])->name('materials.destroy');
            Route::get('expense-categories', [ExpenseCategoryController::class, 'index'])->name('expense-categories.index');
            Route::post('expense-categories', [ExpenseCategoryController::class, 'store'])->name('expense-categories.store');
            Route::put('expense-categories/{expense_category}', [ExpenseCategoryController::class, 'update'])->name('expense-categories.update');
            Route::delete('expense-categories/{expense_category}', [ExpenseCategoryController::class, 'destroy'])->name('expense-categories.destroy');
            Route::resource('quotation-templates', QuotationTemplateController::class)
                ->except(['show'])
                ->parameters(['quotation-templates' => 'quotation_template']);
        });
    });
});

// Public signed-URL routes (no auth needed — clients open these from email/WhatsApp)
Route::get('/q/{quotation}', [QuotationController::class, 'showPublic'])
    ->name('quotations.public.show')
    ->middleware('signed');

Route::get('/q/{quotation}/pdf', [QuotationController::class, 'downloadPdf'])
    ->name('quotations.public.pdf')
    ->middleware('signed');

Route::get('/i/{invoice}', [InvoiceController::class, 'showPublic'])
    ->name('invoices.public.show')
    ->middleware('signed');

Route::get('/i/{invoice}/pdf', [InvoiceController::class, 'pdf'])
    ->name('invoices.public.pdf')
    ->middleware('signed');
