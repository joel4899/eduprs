<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('increments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_detail_id')->constrained('customer_details')->cascadeOnDelete();
            $table->foreignId('prs_record_id')->nullable()->constrained('prs_records')->nullOnDelete();
            $table->foreignId('pay_point_id')->nullable()->constrained('pay_points')->nullOnDelete();
            $table->string('current_grade', 50)->nullable();
            $table->integer('scale_step')->nullable();
            $table->integer('increment_step')->nullable();
            $table->decimal('next_salary', 12, 4)->nullable();
            $table->date('probation_expiry_date')->nullable();
            $table->date('from_date')->nullable();
            $table->date('wef')->nullable(); // with effect from
            $table->integer('granted_status')->default(0); // 0 pending, 1 granted, 2 not granted
            $table->string('officer', 100)->nullable();
            $table->boolean('sent_to_salaries')->default(false);
            $table->boolean('added_to_prs')->default(false);
            $table->boolean('sent_to_gozo')->default(false);
            $table->boolean('mark_to_print')->default(false);
            $table->boolean('prs_printed')->default(false);
            $table->date('send_by_date')->nullable();
            $table->text('remarks')->nullable();
            $table->text('remarks_hod')->nullable();
            $table->string('prs_reason', 200)->nullable();
            $table->string('add_emoluments', 100)->nullable();
            $table->string('file_number', 60)->nullable();
            $table->timestamps();

            $table->index(['granted_status', 'from_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('increments');
    }
};
