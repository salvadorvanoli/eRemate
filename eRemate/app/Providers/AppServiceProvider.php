<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Articulo\ArticuloServiceInterface;
use App\Services\Articulo\ArticuloService;
use App\Services\Auth\AuthServiceInterface;
use App\Services\Auth\AuthService;
use App\Services\Calificacion\CalificacionServiceInterface;
use App\Services\Calificacion\CalificacionService;
use App\Services\CasaDeRemates\CasaDeRematesServiceInterface;
use App\Services\CasaDeRemates\CasaDeRematesService;
use App\Services\Chat\ChatServiceInterface;
use App\Services\Chat\ChatService;
use App\Services\Compra\CompraServiceInterface;
use App\Services\Compra\CompraService;
use App\Services\Factura\FacturaServiceInterface;
use App\Services\Factura\FacturaService;
use App\Services\Lote\LoteServiceInterface;
use App\Services\Lote\LoteService;
use App\Services\Mensaje\MensajeServiceInterface;
use App\Services\Mensaje\MensajeService;
use App\Services\Rematador\RematadorServiceInterface;
use App\Services\Rematador\RematadorService;
use App\Services\Subasta\SubastaServiceInterface;
use App\Services\Subasta\SubastaService;
use App\Services\Usuario\UsuarioServiceInterface;
use App\Services\Usuario\UsuarioService;
use App\Services\UsuarioRegistrado\UsuarioRegistradoServiceInterface;
use App\Services\UsuarioRegistrado\UsuarioRegistradoService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //Servicio para Articulo
        $this->app->bind(
            ArticuloServiceInterface::class,
            ArticuloService::class
        );

        //Servicio para Auth
        $this->app->bind(
            AuthServiceInterface::class,
            AuthService::class
        );

        //Servicio para Calificacion
        $this->app->bind(
            CalificacionServiceInterface::class,
            CalificacionService::class
        );

        //Servicio para Casa de Remates
        $this->app->bind(
            CasaDeRematesServiceInterface::class,
            CasaDeRematesService::class
        );

        //Servicio para el Chat
        $this->app->bind(
            ChatServiceInterface::class,
            ChatService::class
        );
        
        //Servicio para Compra
        $this->app->bind(
            CompraServiceInterface::class,
            CompraService::class
        );

        //Servicio para Factura
        $this->app->bind(
            FacturaServiceInterface::class,
            FacturaService::class
        );

        //Servicio para Lote
        $this->app->bind(
            LoteServiceInterface::class,
            LoteService::class
        );
        
        //Servicio para los Mensajes
        $this->app->bind(
            MensajeServiceInterface::class,
            MensajeService::class
        );

        //Servicio para Rematador
        $this->app->bind(
            RematadorServiceInterface::class,
            RematadorService::class
        );

        //Servicio para Subasta
        $this->app->bind(
            SubastaServiceInterface::class,
            SubastaService::class
        );

        //Servicio para Usuario
        $this->app->bind(
            UsuarioServiceInterface::class,
            UsuarioService::class
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
