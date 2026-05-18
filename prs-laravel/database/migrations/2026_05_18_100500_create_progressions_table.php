<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Single consolidated progression table — `track` discriminates between
        // the 7 source progression DBs (teachers, non-teaching, EO/HoS,
        // LSE/KGE by qualification, LSE/KGE I/II/III by service).
        Schema::create('progressions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_detail_id')->constrained('customer_details')->cascadeOnDelete();
            $table->foreignId('prs_record_id')->nullable()->constrained('prs_records')->nullOnDelete();
            $table->string('track', 40); // teachers | non_teaching | eo_hos | lse_kge_qual | lse_kge_i | lse_kge_ii | lse_kge_iii
            $table->foreignId('from_grade_id')->nullable()->constrained('teaching_grades')->nullOnDelete();
            $table->foreignId('to_grade_id')->nullable()->constrained('teaching_grades')->nullOnDelete();
            $table->date('eligibility_date')->nullable();
            $table->date('decision_date')->nullable();
            $table->date('effective_date')->nullable();
            $table->string('decision', 30)->default('pending'); // pending | approved | rejected | deferred
            $table->string('qualification_subject', 200)->nullable();
            $table->decimal('service_years', 6, 2)->nullable();
            $table->decimal('unpaid_leave_years', 6, 2)->nullable();
            $table->string('officer', 100)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['track', 'decision']);
            $table->index('effective_date');
        });

        Schema::create('progression_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('progression_id')->constrained('progressions')->cascadeOnDelete();
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30);
            $table->string('changed_by', 100)->nullable();
            $table->text('change_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('progression_history');
        Schema::dropIfExists('progressions');
    }
};
