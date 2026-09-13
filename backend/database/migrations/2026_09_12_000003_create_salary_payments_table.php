<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('salary_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('period_start');
            $table->date('period_end');
            $table->unsignedTinyInteger('working_days')->default(30);
            $table->unsignedTinyInteger('absent_days')->nullable();
            $table->decimal('daily_rate', 14, 8);
            $table->decimal('earned_amount', 14, 2);
            $table->string('payment_status')->default('Due');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'period_start', 'period_end']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_payments');
    }
};
