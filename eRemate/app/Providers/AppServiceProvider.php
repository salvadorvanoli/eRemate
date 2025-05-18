<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Chat\ChatServiceInterface;
use App\Services\Chat\ChatService;
use App\Services\Mensaje\MensajeServiceInterface;
use App\Services\Mensaje\MensajeService;
use App\Services\Factura\FacturaServiceInterface;
use App\Services\Factura\FacturaService;
use App\Services\Compra\CompraServiceInterface;
use App\Services\Compra\CompraService;
use App\Services\Calificacion\CalificacionServiceInterface;
use App\Services\Calificacion\CalificacionService;
use App\Services\UsuarioRegistrado\UsuarioRegistradoServiceInterface;
use App\Services\UsuarioRegistrado\UsuarioRegistradoService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //Servicio para el Chat
        $this->app->bind(ChatServiceInterface::class, ChatService::class);
        
        //Servicio para los Mensajes
        $this->app->bind(MensajeServiceInterface::class, MensajeService::class);

        //Servicio para Factura
        $this->app->bind(
            FacturaServiceInterface::class, FacturaService::class
        );

        //Servicio para Compra
        $this->app->bind(
            CompraServiceInterface::class, CompraService::class
        );

        //Servicio para Calificacion
        $this->app->bind(
            CalificacionServiceInterface::class,
            CalificacionService::class
        );

        //Servicio para Usuario Registrado
        $this->app->bind(
            UsuarioRegistradoServiceInterface::class,
            UsuarioRegistradoService::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
