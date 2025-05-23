<?php

use App\Http\Controllers\ArticuloController;
use App\Http\Controllers\SubastaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\NotificationController;

use App\Http\Controllers\RematadorController;
use App\Http\Controllers\CasaDeRematesController;
use App\Http\Controllers\LoteController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\MensajeController;
use App\Http\Controllers\FacturaController;
use App\Http\Controllers\CompraController;
use App\Http\Controllers\CalificacionController;
use App\Http\Controllers\UsuarioRegistradoController;
use App\Http\Controllers\ContactoController;

// Rutas de Chat
Route::get('chats', [ChatController::class, 'index']);
Route::get('chats/{id}', [ChatController::class, 'show']);
Route::post('chats', [ChatController::class, 'store']);
Route::get('users/{userId}/chats', [ChatController::class, 'getUserChats']);
Route::get('chats/{id}/messages', [ChatController::class, 'getChatMessages']);
Route::delete('chats/{id}', [ChatController::class, 'destroy']);

// Rutas de Mensaje
Route::get('messages', [MensajeController::class, 'index']);
Route::get('messages/{id}', [MensajeController::class, 'show']);
Route::post('messages', [MensajeController::class, 'store']);
Route::delete('messages/{id}', [MensajeController::class, 'destroy']);

// Rutas de Factura
Route::get('invoices', [FacturaController::class, 'index']);
Route::get('invoices/{id}', [FacturaController::class, 'show']);
Route::post('invoices', [FacturaController::class, 'store']);
Route::delete('invoices/{id}', [FacturaController::class, 'destroy']);
Route::get('users/{userId}/invoices', [FacturaController::class, 'getFacturasPorUsuario']);
Route::get('invoices/{id}/pdf', [FacturaController::class, 'descargarPdf']);

// Rutas de Compra
Route::get('purchases', [CompraController::class, 'index']);
Route::get('purchases/{id}', [CompraController::class, 'show']);
Route::post('purchases', [CompraController::class, 'store']);
Route::put('purchases/{id}', [CompraController::class, 'update']);
Route::delete('purchases/{id}', [CompraController::class, 'destroy']);

// Rutas de Calificación
Route::get('ratings', [CalificacionController::class, 'index']);
Route::get('ratings/{id}', [CalificacionController::class, 'show']);
Route::post('ratings', [CalificacionController::class, 'store']);
Route::put('ratings/{id}', [CalificacionController::class, 'update']);
Route::delete('ratings/{id}', [CalificacionController::class, 'destroy']);
Route::get('ratings/by-purchase/{compraId}', [CalificacionController::class, 'getByCompra']);

// Rutas de UsuarioRegistrado
Route::get('registered-users/{id}/payment-methods', [UsuarioRegistradoController::class, 'getMetodosPago']);
Route::post('registered-users/{id}/payment-methods', [UsuarioRegistradoController::class, 'addMetodoPago']);
Route::get('registered-users/{id}/purchase-history', [UsuarioRegistradoController::class, 'getHistorialCompras']);

// Rutas de Lotes Favoritos
Route::get('registered-users/{usuarioId}/favorite-lots', [UsuarioRegistradoController::class, 'getLotesFavoritos']);
Route::post('registered-users/{usuarioId}/favorite-lots', [UsuarioRegistradoController::class, 'addLoteFavorito']);
Route::delete('registered-users/{usuarioId}/favorite-lots/{loteId}', [UsuarioRegistradoController::class, 'removeLoteFavorito']);

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
Route::middleware('auth:sanctum')->get('/me', [AuthController::class, 'getAuthenticatedUser']);

//testing nitificaciones
Route::post('/notify/user-register', [NotificationController::class, 'testBienvenida']);
Route::post('/notify/auction-start', [NotificationController::class, 'notificarInicioSubasta']);
Route::post('/notify/auction-end', [NotificationController::class, 'notificarFinSubasta']);
Route::post('/notify/auction-bid', [NotificationController::class, 'notificarNuevaPuja']);

// Rutas para usuarios
Route::get('/usuarios/{id}', [UsuarioController::class, 'obtenerUsuario']);
Route::get('/usuarios/{id}/perfil', [UsuarioController::class, 'obtenerPerfil']);

Route::middleware('auth:sanctum')->group(function () {
    // ...resto de rutas que sí necesitan autenticación...

    Route::prefix('auction-house')->group(function () {
        Route::put('/{id}', [CasaDeRematesController::class, 'actualizarCasaDeRemates']);
        Route::get('/{id}/auctioneers', [CasaDeRematesController::class, 'obtenerRematadores']);
        Route::post('/{id}/auctioneers/assign', [CasaDeRematesController::class, 'asignarRematador']);
        Route::post('/{id}/auctioneers/{rematadorId}/remove', [CasaDeRematesController::class, 'desasignarRematador']);
    });

    Route::prefix('auction')->group(function () {
        Route::post('/', [SubastaController::class, 'crearSubasta']);
        Route::put('/{id}', [SubastaController::class, 'actualizarSubasta']);

        /* Resto de endpoints de subasta
        Route::post('/{id}/start', [SubastaController::class, 'iniciarSubasta']);
        Route::post('/{id}/end', [SubastaController::class, 'finalizarSubasta']);
        Route::post('/{id}/bid', [SubastaController::class, 'realizarPuja']);
        Route::get('/{id}/bids', [SubastaController::class, 'obtenerPujas']);
        Route::post('/{id}/auto-bid', [SubastaController::class, 'realizarPujaAutomatica']);
        Route::post('/{id}/live-stream', [SubastaController::class, 'obtenerTransmisionEnVivo']);
        */
    });

    Route::prefix('lot')->group(function () {
        Route::post('/', [LoteController::class, 'crearLote']);
        Route::put('/{id}', [LoteController::class, 'actualizarLote']);
        Route::post('/{id}/items/{articuloId}/add', [LoteController::class, 'agregarArticulo']);
        Route::post('/{id}/items/{articuloId}/remove', [LoteController::class, 'removerArticulo']);
    });

    Route::prefix('item')->group(function () {
        Route::post('/', [ArticuloController::class, 'crearArticulo']);
        Route::put('/{id}', [ArticuloController::class, 'actualizarArticulo']);
    });

});

// Rutas de Casa de Remates sin necesidad de autorización
Route::prefix('auction-house')->group(function () {
    Route::put('/{id}', [CasaDeRematesController::class, 'actualizarCasaDeRemates']);
    Route::get('/{id}/auctioneers', [CasaDeRematesController::class, 'obtenerRematadores']);
    Route::post('/{id}/auctioneers/assign', [CasaDeRematesController::class, 'asignarRematador']);
    Route::post('/{id}/auctioneers/{rematadorId}/remove', [CasaDeRematesController::class, 'desasignarRematador']);
});

Route::prefix('auction')->group(function () {
    Route::get('/', [SubastaController::class, 'obtenerSubastas']);
    Route::get('/{id}', [SubastaController::class, 'obtenerSubasta']);
});

Route::prefix('lot')->group(function () {
    Route::get('/{id}', [LoteController::class, 'obtenerLote']);
    Route::get('/{id}/items', [LoteController::class, 'obtenerArticulos']);
});

Route::prefix('item')->group(function () {
    Route::get('/{id}', [ArticuloController::class, 'obtenerArticulo']);
    Route::get('/', [ArticuloController::class, 'obtenerArticulos']);
});

Route::post('/contacto', [ContactoController::class, 'enviarFormulario']);
