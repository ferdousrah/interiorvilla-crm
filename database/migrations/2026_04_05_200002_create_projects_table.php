<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->string('name', 200);
            $table->foreignUuid('client_id')->constrained('clients');
            $table->foreignUuid('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->enum('type', ['residential', 'commercial', 'office', 'retail', 'restaurant', 'hospital', 'other']);
            $table->enum('status', ['survey', 'planning', 'design', 'execution', 'finishing', 'handover', 'completed', 'on_hold', 'cancelled'])->default('survey');
            $table->text('site_address');
            $table->decimal('area_sqft', 10, 2)->nullable();
            $table->date('start_date')->nullable();
            $table->date('expected_end_date')->nullable();
            $table->date('actual_end_date')->nullable();
            $table->decimal('contract_value', 15, 2)->nullable();
            $table->decimal('budget_limit', 15, 2)->nullable();
            $table->foreignUuid('project_manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('project_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 100);
            $table->date('assigned_at');
            $table->timestamps();
            $table->unique(['project_id', 'user_id']);
        });

        Schema::create('project_phases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('name', 150);
            $table->integer('sequence');
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignUuid('phase_id')->nullable()->constrained('project_phases')->nullOnDelete();
            $table->foreignUuid('parent_task_id')->nullable()->constrained('tasks')->nullOnDelete();
            $table->string('title', 250);
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'in_progress', 'review', 'done', 'cancelled'])->default('pending');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->foreignUuid('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('delay_reason')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('task_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('file_name');
            $table->foreignUuid('uploaded_by')->constrained('users');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('project_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained('projects')->cascadeOnDelete();
            $table->text('note');
            $table->boolean('is_pinned')->default(false);
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_notes');
        Schema::dropIfExists('task_attachments');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('project_phases');
        Schema::dropIfExists('project_members');
        Schema::dropIfExists('projects');
    }
};
