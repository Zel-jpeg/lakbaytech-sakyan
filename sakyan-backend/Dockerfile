FROM php:8.2-apache

# Install PostgreSQL driver + curl + zip extensions
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    curl \
    zip \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql zip \
    && a2enmod rewrite

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy project files
COPY . .

# Install PHP dependencies (no dev, optimized autoloader)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Apache config: point DocumentRoot to /public
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf

# Add ServerName to suppress warning
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

EXPOSE 80

CMD ["apache2-foreground"]
