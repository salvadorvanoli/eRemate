<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\RematadorController;

Route::prefix('auctioneer')->group(function () {
    Route::post('/', [RematadorController::class, 'store']);
    Route::get('/{id}', [RematadorController::class, 'show']);
    Route::put('/{id}', [RematadorController::class, 'update']);
    Route::get('/{id}/auctions', [RematadorController::class, 'subastas']);
});

