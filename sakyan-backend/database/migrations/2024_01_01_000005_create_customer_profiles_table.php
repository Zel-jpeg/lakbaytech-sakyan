<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->date('birthday')->nullable();
            $table->text('address')->nullable();
            $table->string('drivers_license_number', 50)->nullable();
            $table->text('drivers_license_url')->nullable();
            $table->date('license_expiry')->nullable();
            $table->string('valid_id_type', 100)->nullable();
            $table->text('valid_id_url')->nullable();
            $table->text('selfie_url')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_profiles');
    }
};
