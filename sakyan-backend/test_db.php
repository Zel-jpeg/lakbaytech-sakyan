<?php
// Quick DB connection test - delete after testing
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $result = DB::select('SELECT version()');
    echo "✅ DB Connected! PostgreSQL version: " . $result[0]->version . "\n";
    
    // Check if our tables exist
    $tables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    if (count($tables) === 0) {
        echo "⚠️  No tables found. Please run sakyan-db/00_cleanup.sql then 01_schema.sql in Supabase SQL Editor.\n";
    } else {
        echo "📋 Tables found: " . implode(', ', array_column($tables, 'table_name')) . "\n";
    }
} catch (Exception $e) {
    echo "❌ DB Error: " . $e->getMessage() . "\n";
}
