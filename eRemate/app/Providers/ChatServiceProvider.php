<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Chat\ChatServiceInterface;
use App\Services\Chat\ChatService;

class ChatServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(ChatServiceInterface::class, ChatService::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
