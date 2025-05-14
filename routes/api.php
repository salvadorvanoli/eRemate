<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\MensajeController;
use App\Http\Controllers\FacturaController;
use App\Http\Controllers\CompraController;
use App\Http\Controllers\CalificacionController;
use App\Http\Controllers\UsuarioRegistradoController;

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

