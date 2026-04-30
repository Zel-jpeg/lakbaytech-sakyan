<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('booking_code', 20)->unique()->nullable();
            $table->foreignUuid('car_id')->nullable()->constrained('cars')->nullOnDelete();
            $table->foreignUuid('customer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('partner_id')->nullable()->constrained('partners')->nullOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->text('pickup_location')->nullable();
            $table->text('return_location')->nullable();
            $table->integer('total_days')->nullable();
            $table->decimal('price_per_day', 10, 2)->nullable();
            $table->decimal('subtotal', 10, 2)->nullable();
            $table->decimal('booking_fee', 10, 2)->default(100.00);
            $table->decimal('commission_amount', 10, 2)->nullable();
            $table->decimal('total_amount', 10, 2)->nullable();
            $table->decimal('partner_net', 10, 2)->nullable();
            $table->string('payment_method', 20)->nullable()
                  ->check("payment_method IN ('gcash', 'cash')");
            $table->string('payment_status', 20)->default('pending')
                  ->check("payment_status IN ('pending', 'paid', 'refunded')");
            $table->string('gcash_reference', 100)->nullable();
            $table->string('booking_status', 30)->default('pending_review')
                  ->check("booking_status IN ('pending_review','approved','rejected','active','completed','cancelled')");
            $table->text('special_requests')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
