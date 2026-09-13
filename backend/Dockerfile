FROM php:8.4-cli
WORKDIR /var/www/html
RUN apt-get update && apt-get install -y git unzip libzip-dev default-mysql-client && docker-php-ext-install pdo_mysql
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts
COPY . .
RUN cp .env.example .env && php artisan key:generate
RUN php artisan storage:link
RUN composer dump-autoload --optimize
EXPOSE 8000
CMD ["sh", "-c", "php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=8000"]
