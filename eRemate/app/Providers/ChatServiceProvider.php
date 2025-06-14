<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Chat\ChatServiceInterface;
use App\Services\Chat\ChatService;

class ChatServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(ChatServiceInterface::class, ChatService::class);
    }

    public function boot(): void
    {
        // No se necesita lógica de arranque
    }
}
