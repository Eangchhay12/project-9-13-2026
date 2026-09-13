<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->longText('photo')->nullable()->after('email');
            $table->date('joined_at')->nullable()->after('photo');
            $table->date('pay_date')->nullable()->after('salary');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['photo', 'joined_at', 'pay_date']);
        });
    }
};