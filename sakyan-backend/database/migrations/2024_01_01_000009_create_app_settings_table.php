<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_settings', function (Blueprint $table) {
            $table->increments('id');
            $table->string('key', 100)->unique();
            $table->text('value');
            $table->text('description')->nullable();
            $table->timestampTz('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        // Seed default values
        DB::table('app_settings')->insert([
            [
                'key'         => 'booking_fee',
                'value'       => '100',
                'description' => 'Flat booking fee charged to customers per booking in PHP (range: 80-150)',
            ],
            [
                'key'         => 'platform_name',
                'value'       => 'Sakyan',
                'description' => 'Platform display name',
            ],
            [
                'key'         => 'min_booking_days',
                'value'       => '1',
                'description' => 'Minimum number of rental days per booking',
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('app_settings');
    }
};
