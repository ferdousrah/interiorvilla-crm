<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->foreignUuid('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('name', 150);
            $table->string('email', 150)->nullable();
            $table->string('phone', 20);
            $table->enum('source', ['referral', 'facebook', 'instagram', 'website', 'walk_in', 'cold_call', 'exhibition', 'other']);
            $table->string('project_type', 100)->nullable();
            $table->decimal('estimated_value', 15, 2)->nullable();
            $table->enum('status', ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'])->default('new');
            $table->text('lost_reason')->nullable();
            $table->dateTime('follow_up_at')->nullable();
            $table->foreignUuid('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('converted_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('lead_activities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->enum('type', ['call', 'email', 'whatsapp', 'site_visit', 'meeting', 'note']);
            $table->text('summary');
            $table->text('next_action')->nullable();
            $table->dateTime('next_action_at')->nullable();
            $table->foreignUuid('performed_by')->constrained('users');
            $table->dateTime('performed_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_activities');
        Schema::dropIfExists('leads');
    }
};
