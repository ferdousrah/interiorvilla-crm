<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            $table->string('code', 20)->unique();
            $table->string('name', 150);
            $table->string('email', 150)->nullable();
            $table->string('phone', 20);
            $table->string('department', 100)->nullable();
            $table->string('designation', 100)->nullable();
            $table->enum('employment_type', ['permanent', 'contract', 'part_time', 'intern', 'daily_labour']);
            $table->date('join_date');
            $table->date('contract_end_date')->nullable();
            $table->decimal('basic_salary', 10, 2)->nullable();
            $table->string('nid_number', 50)->nullable();
            $table->text('address')->nullable();
            $table->string('emergency_contact_name', 150)->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('leave_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->integer('days_per_year')->nullable();
            $table->boolean('is_paid')->default(true);
            $table->timestamps();
        });

        Schema::create('leave_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('employee_id')->constrained('employees');
            $table->foreignUuid('leave_type_id')->constrained('leave_types');
            $table->date('from_date');
            $table->date('to_date');
            $table->decimal('days', 4, 1);
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();
            $table->timestamps();
        });

        Schema::create('attendance', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('employee_id')->constrained('employees');
            $table->date('date');
            $table->enum('status', ['present', 'absent', 'half_day', 'on_leave', 'holiday', 'off']);
            $table->time('check_in')->nullable();
            $table->time('check_out')->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('recorded_by')->constrained('users');
            $table->timestamps();
            $table->unique(['employee_id', 'date']);
        });

        Schema::create('employee_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('employee_id')->constrained('employees');
            $table->string('type', 100);
            $table->string('file_path');
            $table->string('file_name');
            $table->date('expiry_date')->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('uploaded_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_documents');
        Schema::dropIfExists('attendance');
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('leave_types');
        Schema::dropIfExists('employees');
    }
};
