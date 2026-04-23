<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('inventory_item_id')->constrained('inventory_items');
            $table->foreignUuid('warehouse_id')->constrained('warehouses');
            $table->foreignUuid('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->enum('type', ['opening', 'purchase', 'project_issue', 'return_from_project', 'transfer_in', 'transfer_out', 'adjustment', 'damage', 'waste']);
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_rate', 10, 2)->nullable();
            $table->decimal('total_value', 15, 2)->nullable();
            $table->string('reference_type', 50)->nullable();
            $table->uuid('reference_id')->nullable();
            $table->string('batch_number', 100)->nullable();
            $table->text('notes')->nullable();
            $table->date('transaction_date');
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamp('created_at')->nullable();

            $table->index(['inventory_item_id', 'warehouse_id']);
        });

        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('inventory_item_id')->constrained('inventory_items');
            $table->foreignUuid('warehouse_id')->constrained('warehouses');
            $table->decimal('physical_count', 10, 2);
            $table->decimal('system_count', 10, 2);
            $table->decimal('variance', 10, 2);
            $table->date('adjustment_date');
            $table->text('reason')->nullable();
            $table->foreignUuid('adjusted_by')->constrained('users');
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_adjustments');
        Schema::dropIfExists('stock_transactions');
    }
};
