<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('in_app_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 50);             // lead_assigned, task_assigned, invoice_paid, etc.
            $table->string('title', 250);
            $table->text('message')->nullable();
            $table->string('link')->nullable();       // URL to navigate to
            $table->string('icon', 30)->nullable();   // emoji or icon name
            $table->timestamp('read_at')->nullable();
            $table->foreignUuid('caused_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_name', 150)->nullable();
            $table->string('action', 30);             // created, updated, deleted, restored, login, logout
            $table->string('model_type', 100)->nullable();
            $table->uuid('model_id')->nullable();
            $table->string('model_label', 250)->nullable(); // human-readable: "Lead: Ferdous Rahman"
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['model_type', 'model_id']);
            $table->index('user_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('in_app_notifications');
    }
};
