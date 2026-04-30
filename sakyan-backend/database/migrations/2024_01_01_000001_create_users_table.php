<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // users table extends Supabase Auth (auth.users)
        // We use raw SQL for the foreign key reference to auth schema
        DB::statement("
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                full_name VARCHAR(255) NOT NULL DEFAULT '',
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'partner', 'admin')),
                avatar_url TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
