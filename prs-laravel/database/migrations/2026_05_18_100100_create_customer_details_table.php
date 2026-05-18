<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customer_details', function (Blueprint $table) {
            $table->id();
            $table->string('person_id_no', 30)->unique();
            $table->string('ni_number', 30)->nullable();
            $table->string('employee_no', 30)->nullable()->index();
            $table->foreignId('salutation_id')->nullable()->constrained('salutations')->nullOnDelete();
            $table->string('person_name', 100);
            $table->string('person_surname', 100);
            $table->string('person_birth_surname', 100)->nullable();
            $table->foreignId('gender_id')->nullable()->constrained('person_genders')->nullOnDelete();
            $table->date('date_of_birth')->nullable();
            $table->date('commencement_date')->nullable();
            $table->string('citizenship', 80)->nullable();
            $table->string('marital_status', 30)->nullable();
            $table->date('date_of_marriage')->nullable();
            $table->string('spouse_id', 30)->nullable();
            $table->string('father_name', 100)->nullable();
            $table->string('father_surname', 100)->nullable();

            $table->string('door_number', 30)->nullable();
            $table->string('house_name', 120)->nullable();
            $table->string('street_subdivision', 120)->nullable();
            $table->string('street_name', 200)->nullable();
            $table->foreignId('locality_id')->nullable()->constrained('villages')->nullOnDelete();
            $table->string('post_code', 20)->nullable();
            $table->string('birth_country', 80)->nullable();

            $table->string('door_number_2', 30)->nullable();
            $table->string('house_name_2', 120)->nullable();
            $table->string('street_subdivision_2', 120)->nullable();
            $table->string('street_name_2', 200)->nullable();
            $table->string('locality_name_2', 120)->nullable();
            $table->string('post_code_2', 20)->nullable();
            $table->string('birth_country_2', 80)->nullable();

            $table->string('telephone_no', 30)->nullable();
            $table->string('mobile_no', 30)->nullable();
            $table->string('email_address', 200)->nullable();

            $table->string('present_employment', 200)->nullable();
            $table->string('post_of_employment', 200)->nullable();
            $table->string('position', 200)->nullable();
            $table->string('teaching_of', 200)->nullable();
            $table->string('department', 200)->nullable();

            $table->boolean('conf_correct')->default(false);
            $table->string('conf_by', 100)->nullable();
            $table->dateTime('conf_correct_on')->nullable();

            $table->boolean('still_in_service')->default(true);
            $table->boolean('resigned')->default(false);
            $table->timestamps();

            $table->index(['person_surname', 'person_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_details');
    }
};
