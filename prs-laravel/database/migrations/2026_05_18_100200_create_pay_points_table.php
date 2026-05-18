<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pay_points', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('description', 200);
            $table->foreignId('directorate_college_id')->nullable()->constrained('directorate_colleges')->nullOnDelete();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('sop_pay_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pay_point_id')->constrained('pay_points')->cascadeOnDelete();
            $table->string('title', 200);
            $table->text('procedure_text')->nullable();
            $table->date('effective_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sop_pay_points');
        Schema::dropIfExists('pay_points');
    }
};
