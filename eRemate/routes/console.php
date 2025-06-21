<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('auctions:send-reminders')->everyMinute();

Schedule::command('subastas:cancelar-expiradas')
    ->everyTenMinutes()
    ->withoutOverlapping()
    ->runInBackground();
