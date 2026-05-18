<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sick_leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_detail_id')->constrained('customer_details')->cascadeOnDelete();
            $table->foreignId('leave_type_id')->nullable()->constrained('types_of_leave')->nullOnDelete();
            $table->integer('year');
            $table->decimal('total_days', 6, 2)->default(0);
            $table->string('officer', 100)->nullable();
            $table->text('comments')->nullable();
            $table->dateTime('added_at')->nullable();
            $table->string('status', 30)->default('pending'); // pending | meeting_done | gp47_sent | closed
            $table->date('meeting_date')->nullable();
            $table->timestamps();

            $table->index(['customer_detail_id', 'year']);
            $table->index('status');
        });

        Schema::create('special_leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_detail_id')->constrained('customer_details')->cascadeOnDelete();
            $table->foreignId('leave_type_id')->nullable()->constrained('types_of_leave')->nullOnDelete();
            $table->boolean('paid')->default(true);
            $table->date('from_date');
            $table->date('to_date')->nullable();
            $table->decimal('total_days', 6, 2)->default(0);
            $table->integer('num_of_hrs')->nullable();
            $table->string('nature', 120)->nullable();
            $table->date('dob_child')->nullable();
            $table->boolean('show_in_gp47')->default(false);
            $table->boolean('include_formula')->default(false);
            $table->boolean('discipline')->default(false);
            $table->string('teaching_non_teaching', 30)->nullable();
            $table->string('officer', 100)->nullable();
            $table->text('comments')->nullable();
            $table->text('officer_comments')->nullable();
            $table->dateTime('added_at')->nullable();
            $table->string('status', 30)->default('pending');
            $table->date('meeting_date')->nullable();
            $table->timestamps();

            $table->index(['customer_detail_id', 'from_date']);
            $table->index('status');
        });

        Schema::create('gp47_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_detail_id')->constrained('customer_details')->cascadeOnDelete();
            $table->integer('year');
            $table->date('issued_date')->nullable();
            $table->string('reference_no', 60)->nullable()->index();
            $table->text('content')->nullable();
            $table->string('status', 30)->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gp47_forms');
        Schema::dropIfExists('special_leaves');
        Schema::dropIfExists('sick_leaves');
    }
};
