<?php

use App\Http\Controllers\ArticuloController;
use App\Http\Controllers\SubastaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\UsuarioController;

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
use App\Http\Controllers\PayPalController;
use App\Http\Controllers\PaymentRequestController;
use App\Http\Controllers\ImageController;

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

// Rutas de Factura que requieren autenticación
Route::middleware('auth:sanctum')->group(function () {
    Route::get('invoices/{id}/pdf', [FacturaController::class, 'descargarPdf']);
});

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
Route::get('ratings/by-lot/{loteId}', [CalificacionController::class, 'getByLote']); // Cambiado de by-purchase a by-lot

// Rutas de UsuarioRegistrado
Route::get('registered-users/{id}/payment-methods', [UsuarioRegistradoController::class, 'getMetodosPago']);
Route::post('registered-users/{id}/payment-methods', [UsuarioRegistradoController::class, 'addMetodoPago']);
Route::get('registered-users/{id}/purchase-history', [UsuarioRegistradoController::class, 'getHistorialCompras']);
Route::get('registered-users/{usuarioId}/bidded-lots', [UsuarioRegistradoController::class, 'getLotesConPujas']);

// Rutas de Lotes Favoritos
Route::middleware('auth:sanctum')->group(function () {

Route::get('registered-users/{usuarioId}/favorite-lots', [UsuarioRegistradoController::class, 'getLotesFavoritos']);
Route::post('registered-users/{usuarioId}/favorite-lots', [UsuarioRegistradoController::class, 'addLoteFavorito']);
Route::delete('registered-users/{usuarioId}/favorite-lots/{loteId}', [UsuarioRegistradoController::class, 'removeLoteFavorito']);

// Nuevas rutas de favoritos simplificadas (sin usuarioId en la URL, se obtiene del token)
Route::get('lotes-favoritos', [UsuarioRegistradoController::class, 'getLotesFavoritosAuth']);
Route::post('lotes-favoritos', [UsuarioRegistradoController::class, 'addLoteFavoritoAuth']);
Route::delete('lotes-favoritos/{loteId}', [UsuarioRegistradoController::class, 'removeLoteFavoritoAuth']);
});

// Rutas de Rematador
Route::prefix('auctioneer')->group(function () {
    Route::post('/', [RematadorController::class, 'store']);
    Route::get('/{id}', [RematadorController::class, 'show']);
    Route::put('/{id}', [RematadorController::class, 'update']);
    Route::get('/{id}/auctions', [RematadorController::class, 'subastas']);

    Route::get('/{id}/schedule', [RematadorController::class, 'obtenerAgenda']);
    
    Route::get('/{id}/requested-auctions', [RematadorController::class, 'obtenerSubastasSolicitadas']);
    
    Route::post('/{id}/auctions/{subastaId}/accept', [RematadorController::class, 'aceptarSubasta']);
    
    Route::post('/{id}/auctions/{subastaId}/reject', [RematadorController::class, 'rechazarSubasta']);
});

// Rutas de autenticación
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
Route::middleware('auth:sanctum')->get('/me', [AuthController::class, 'getAuthenticatedUser']);


// Ruta de Home (Carrusel)
Route::get('/auction/page', [SubastaController::class, 'obtenerSubastasOrdenadasPorCierre']);

// Rutas para usuarios
Route::get('/usuarios/{id}', [UsuarioController::class, 'obtenerUsuario']);
Route::get('/usuarios/{id}/perfil', [UsuarioController::class, 'obtenerPerfil']);

// Rutas de Casa de Remates
Route::prefix('auction-house')->group(function () {
    Route::get('/{id}/auctioneers', [CasaDeRematesController::class, 'obtenerRematadores']);
    Route::get('/{id}/auctions', [CasaDeRematesController::class, 'obtenerSubastas']);
    Route::get('/{id}/sales-statistics', [CasaDeRematesController::class, 'estadisticaVentas']);
    Route::get('/{id}/category-statistics', [CasaDeRematesController::class, 'estadisticasPorCategoria']);
    Route::get('/{id}/bid-statistics', [CasaDeRematesController::class, 'estadisticasPujas']); // Nueva ruta
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/{id}/auctioneers/assign', [CasaDeRematesController::class, 'asignarRematador']);
        Route::post('/{id}/auctioneers/{rematadorId}/remove', [CasaDeRematesController::class, 'desasignarRematador']);

        Route::put('/{id}', [CasaDeRematesController::class, 'actualizarCasaDeRemates']);
    });
});

// Rutas de Subasta
Route::prefix('auction')->group(function () {
    Route::get('/', [SubastaController::class, 'obtenerSubastas']);
    Route::get('/ordered', [SubastaController::class, 'obtenerSubastasOrdenadas']);
    Route::get('/filtered', [SubastaController::class, 'obtenerSubastasFiltradas']);
    Route::get('/locations', [SubastaController::class, 'obtenerUbicaciones']);
    Route::get('/tipos', [SubastaController::class, 'obtenerTipos']);
    Route::get('/{id}', [SubastaController::class, 'obtenerSubasta']);
    Route::get('/{id}/lots', [SubastaController::class, 'obtenerLotes']);
    Route::get('/{id}/live-stream', [SubastaController::class, 'obtenerTransmisionEnVivo']);
    Route::get('/{id}/random-image', [SubastaController::class, 'obtenerImagenAleatoria']);

    //Route::get('/{id}/bids', [SubastaController::class, 'obtenerPujas']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [SubastaController::class, 'crearSubasta']);
        Route::post('/{id}/start', [SubastaController::class, 'iniciarSubasta']);
        Route::post('/{id}/end', [SubastaController::class, 'cerrarSubasta']);
        Route::post('/{id}/bid', [SubastaController::class, 'realizarPuja']);
        Route::post('/{id}/auto-bid', [SubastaController::class, 'realizarPujaAutomatica']);

        Route::put('/{id}', [SubastaController::class, 'actualizarSubasta']);

        Route::delete('/{id}', [SubastaController::class, 'eliminarSubasta']);
    });
});

// Rutas de Lote
Route::prefix('lot')->group(function () {
    Route::get('/{id}', [LoteController::class, 'obtenerLote']);
    Route::get('/{id}/items', [LoteController::class, 'obtenerArticulos']);
    Route::get('/{id}/status', [LoteController::class, 'obtenerEstadoLote']); // ← Nueva ruta
    Route::get('/auction/{id}', [LoteController::class, 'obtenerLotesPorSubasta']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [LoteController::class, 'crearLote']);
        Route::post('/{id}/items/{articuloId}/add', [LoteController::class, 'agregarArticulo']);
        Route::post('/{id}/items/{articuloId}/remove', [LoteController::class, 'removerArticulo']);

        Route::put('/{id}', [LoteController::class, 'actualizarLote']);

        Route::delete('/{id}', [LoteController::class, 'eliminarLote']);
    });
});

// Rutas de Artículo
Route::prefix('item')->group(function () {
    Route::get('/', [ArticuloController::class, 'obtenerArticulos']);

    Route::get('/categories/all', [ArticuloController::class, 'obtenerAllCategorias']); 
    Route::get('/ordered', [ArticuloController::class, 'obtenerArticulosOrdenados']);
    Route::get('/filtered', [ArticuloController::class, 'obtenerArticulosFiltrados']);
    Route::get('/categories', [ArticuloController::class, 'obtenerCategorias']);
    Route::get('/estados', [ArticuloController::class, 'obtenerEstados']);
    Route::get('/{id}', [ArticuloController::class, 'obtenerArticulo']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [ArticuloController::class, 'crearArticulo']);

        Route::put('/{id}', [ArticuloController::class, 'actualizarArticulo']);
    });
});

// Rutas de PayPal
Route::prefix('paypal')->group(function () {
    // Rutas públicas
    Route::get('/verify-credentials', [PayPalController::class, 'verificarCredenciales']);
    Route::get('/success', [PayPalController::class, 'pagoExitoso'])->name('paypal.success');
    Route::get('/cancel', [PayPalController::class, 'pagoCancelado'])->name('paypal.cancel');
    
    // Rutas que requieren autenticación
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/create-payment', [PayPalController::class, 'crearPago']);
        Route::post('/create-payment-from-chat', [PayPalController::class, 'crearPagoDesdeChatId']);
        Route::post('/execute-payment', [PayPalController::class, 'ejecutarPago']);
        Route::get('/payment-status/{paymentId}', [PayPalController::class, 'obtenerEstadoPago']);
        Route::get('/verify-payment-processed/{paymentId}', [PayPalController::class, 'verificarPagoProcesado']);
    });
});

// Rutas de Solicitudes de Pago
Route::prefix('payment-requests')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [PaymentRequestController::class, 'index']);
    Route::get('/{id}', [PaymentRequestController::class, 'show']);
    Route::get('/user/{userId}', [PaymentRequestController::class, 'getByUser']);

    Route::post('/', [PaymentRequestController::class, 'store']);
    
    Route::put('/{id}/status', [PaymentRequestController::class, 'updateStatus']);
});

// Ruta del contáctanos
Route::post('/contacto', action: [ContactoController::class, 'enviarFormulario']);

// Google OAuth routes
Route::post('/auth/google', [GoogleAuthController::class, 'googleAuth']);
Route::post('/register/google', [GoogleAuthController::class, 'googleRegister']);

// Complete profile route (protected)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/complete-profile', [GoogleAuthController::class, 'completeProfile']);
});

// Rutas de Imágenes
Route::prefix('images')->group(function () {
    Route::get('/serve/{folder}/{filename}', [ImageController::class, 'serve']);
    Route::get('/list/{folder?}', [ImageController::class, 'list']);

    Route::post('/upload', [ImageController::class, 'upload']);
    
    Route::delete('/{folder}/{filename}', [ImageController::class, 'delete']);
});

















