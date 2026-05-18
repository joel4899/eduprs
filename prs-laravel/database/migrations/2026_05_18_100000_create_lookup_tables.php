<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('person_genders', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('description', 100);
            $table->timestamps();
        });

        Schema::create('salutations', function (Blueprint $table) {
            $table->id();
            $table->string('title', 50)->unique();
            $table->timestamps();
        });

        Schema::create('villages', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120)->unique();
            $table->string('post_code', 20)->nullable();
            $table->timestamps();
        });

        Schema::create('directorate_colleges', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 200);
            $table->timestamps();
        });

        Schema::create('salary_scales', function (Blueprint $table) {
            $table->id();
            $table->string('scale', 10)->unique();
            $table->string('just_scale', 10)->nullable();
            $table->timestamps();
        });

        Schema::create('teaching_grades', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('description', 200);
            $table->foreignId('salary_scale_id')->nullable()->constrained('salary_scales')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('types_of_leave', function (Blueprint $table) {
            $table->id();
            $table->string('leave_type', 120)->unique();
            $table->string('official_name', 200)->nullable();
            $table->boolean('paid')->default(false);
            $table->boolean('show_in_gp47')->default(false);
            $table->boolean('include_formula')->default(false);
            $table->boolean('insert_date')->default(false);
            $table->boolean('num_of_hrs')->default(false);
            $table->text('comments')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('types_of_leave');
        Schema::dropIfExists('teaching_grades');
        Schema::dropIfExists('salary_scales');
        Schema::dropIfExists('directorate_colleges');
        Schema::dropIfExists('villages');
        Schema::dropIfExists('salutations');
        Schema::dropIfExists('person_genders');
    }
};
