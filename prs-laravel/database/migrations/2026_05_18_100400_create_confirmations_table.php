<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('confirmations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_detail_id')->constrained('customer_details')->cascadeOnDelete();
            $table->foreignId('prs_record_id')->nullable()->constrained('prs_records')->nullOnDelete();
            $table->string('confirmation_type', 30); // probationary | indefinite
            $table->date('probation_start')->nullable();
            $table->date('probation_end')->nullable();
            $table->date('confirmation_date')->nullable();
            $table->string('status', 30)->default('pending'); // pending | confirmed | extended | terminated
            $table->string('audit_by', 100)->nullable();
            $table->date('audit_date')->nullable();
            $table->string('college_decision', 100)->nullable();
            $table->date('dg_decision_date')->nullable();
            $table->boolean('inserted_in_prs')->default(false);
            $table->date('inserted_in_prs_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'confirmation_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('confirmations');
    }
};
