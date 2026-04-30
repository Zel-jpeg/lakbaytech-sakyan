#!/bin/bash
set -e

echo "==> Sakyan startup: running migrations..."
php artisan migrate --force

echo "==> Migrations done. Starting Apache..."
exec apache2-foreground
