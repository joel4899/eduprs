<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Maps to the role keys used in edu/shell.jsx ROLES{}:
            // super-admin, prs-office, recruitment, salaries, leaves,
            // conf-appointment, discipline-hr, health-safety, forms-docs,
            // terminations, transfers-promotions, progressions, paypoints.
            $table->string('role', 40)->default('super-admin')->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
