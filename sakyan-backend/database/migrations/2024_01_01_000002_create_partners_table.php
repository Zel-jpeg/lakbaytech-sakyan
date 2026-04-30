<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partners', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->string('business_name')->nullable();
            $table->string('partner_type', 20)->nullable();
            $table->text('business_address')->nullable();
            $table->text('business_permit_url')->nullable();
            $table->text('government_id_url')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->decimal('commission_rate', 4, 2)->default(10.00);
            $table->string('status', 20)->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestampTz('approved_at')->nullable();
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('created_at')->useCurrent();
        });

        DB::statement("ALTER TABLE partners ADD CONSTRAINT partners_type_check CHECK (partner_type IN ('individual', 'company'))");
        DB::statement("ALTER TABLE partners ADD CONSTRAINT partners_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('partners');
    }
};
