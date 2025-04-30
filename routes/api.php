<?php

use App\Http\Controllers\CasaDeRemateController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Test route
Route::get('/test', function () {
    return response()->json(['message' => 'API is working']);
});

// Casa de remate routes
Route::apiResource('casas-remate', CasaDeRemateController::class);