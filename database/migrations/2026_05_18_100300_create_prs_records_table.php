<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('prs_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_detail_id')->constrained('customer_details')->cascadeOnDelete();
            $table->foreignId('teaching_grade_id')->nullable()->constrained('teaching_grades')->nullOnDelete();
            $table->foreignId('pay_point_id')->nullable()->constrained('pay_points')->nullOnDelete();
            $table->foreignId('salary_scale_id')->nullable()->constrained('salary_scales')->nullOnDelete();
            $table->string('record_type', 30)->default('full_time'); // full_time | part_time
            $table->date('effective_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('reason', 200)->nullable();
            $table->string('status', 30)->default('active'); // active | pending_approval | archived
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index(['customer_detail_id', 'effective_date']);
            $table->index('status');
        });

        Schema::create('prs_allowances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prs_record_id')->constrained('prs_records')->cascadeOnDelete();
            $table->string('allowance_code', 30);
            $table->string('description', 200)->nullable();
            $table->decimal('amount', 12, 4)->default(0);
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();
            $table->timestamps();
        });

        Schema::create('prs_remarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prs_record_id')->constrained('prs_records')->cascadeOnDelete();
            $table->text('remark');
            $table->string('officer', 100)->nullable();
            $table->timestamps();
        });

        Schema::create('prs_secq', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prs_record_id')->constrained('prs_records')->cascadeOnDelete();
            $table->string('field_name', 100);
            $table->string('field_value', 500)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prs_secq');
        Schema::dropIfExists('prs_remarks');
        Schema::dropIfExists('prs_allowances');
        Schema::dropIfExists('prs_records');
    }
};
