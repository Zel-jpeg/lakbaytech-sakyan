<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cars', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('partner_id')->constrained('partners')->onDelete('cascade');
            $table->string('name');
            $table->string('brand', 100)->nullable();
            $table->string('model', 100)->nullable();
            $table->integer('year')->nullable();
            $table->string('plate_number', 20)->nullable()->unique();
            $table->string('transmission', 20)->nullable();
            $table->string('fuel_type', 20)->nullable();
            $table->integer('seats')->default(5);
            $table->string('color', 50)->nullable();
            $table->decimal('price_per_day', 10, 2);
            $table->string('location')->nullable();
            $table->text('description')->nullable();
            $table->string('status', 20)->default('active');
            $table->boolean('is_available')->default(true);
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        // Native PostgreSQL TEXT[] column for features array
        DB::statement('ALTER TABLE cars ADD COLUMN features TEXT[]');

        // CHECK constraints
        DB::statement("ALTER TABLE cars ADD CONSTRAINT cars_transmission_check CHECK (transmission IN ('manual', 'automatic'))");
        DB::statement("ALTER TABLE cars ADD CONSTRAINT cars_fuel_type_check CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid'))");
        DB::statement("ALTER TABLE cars ADD CONSTRAINT cars_status_check CHECK (status IN ('active', 'inactive', 'booked'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};
