<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->foreignUuid('sender_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('receiver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('content');
            $table->boolean('is_read')->default(false);
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
