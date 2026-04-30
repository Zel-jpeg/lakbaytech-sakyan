<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->string('title')->nullable();
            $table->text('message')->nullable();
            $table->string('type', 50)->nullable()
                  ->check("type IN ('booking', 'approval', 'message', 'payment', 'system')");
            $table->boolean('is_read')->default(false);
            $table->uuid('reference_id')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
