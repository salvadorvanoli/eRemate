<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\NotificationController;

use App\Http\Controllers\RematadorController;

Route::prefix('auctioneer')->group(function () {
    Route::post('/', [RematadorController::class, 'store']);
    Route::get('/{id}', [RematadorController::class, 'show']);
    Route::put('/{id}', [RematadorController::class, 'update']);
    Route::get('/{id}/auctions', [RematadorController::class, 'subastas']);
});

// Rutas de autenticación

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

//testing nitificaciones
Route::post('/notify/user-register', [NotificationController::class, 'testBienvenida']);
Route::post('/notify/auction-start', [NotificationController::class, 'notificarInicioSubasta']);
Route::post('/notify/auction-end', [NotificationController::class, 'notificarFinSubasta']);
Route::post('/notify/auction-bid', [NotificationController::class, 'notificarNuevaPuja']);

// Rutas para usuarios
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/usuarios/{id}', [UsuarioController::class, 'obtenerUsuario']);
    Route::get('/usuarios/{id}/perfil', [UsuarioController::class, 'obtenerPerfil']);

    /*// Notificaciones de subastas
    Route::post('/auction-start', [NotificationController::class, 'notificarInicioSubasta'])
        ->name('notifications.auction.start');
    
    Route::post('/auction-end', [NotificationController::class, 'notificarFinSubasta'])
        ->name('notifications.auction.end');
    
    Route::post('/auction-bid', [NotificationController::class, 'notificarNuevaPuja'])
        ->name('notifications.auction.bid');*/

});