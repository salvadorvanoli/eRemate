<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Cors
{
    public function handle(Request $request, Closure $next)
    {
        // Obtener configuraciones del .env
        $allowedOrigins = explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:4200'));
        $allowedMethods = env('CORS_ALLOWED_METHODS', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        $allowedHeaders = env('CORS_ALLOWED_HEADERS', 'Accept,Authorization,Content-Type,X-Requested-With,Origin');
        $allowCredentials = env('CORS_ALLOW_CREDENTIALS', 'true');

        // Obtener el origen de la petición
        $origin = $request->header('Origin');
        
        // Manejar peticiones OPTIONS (preflight) primero
        if ($request->getMethod() === 'OPTIONS') {
            $response = response('', 200);
        } else {
            $response = $next($request);
        }

        // Configurar headers CORS
        if ($origin && in_array(trim($origin), array_map('trim', $allowedOrigins))) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        } else {
            // Para Google OAuth, permitir localhost específicamente
            $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:4200');
        }
        
        $response->headers->set('Access-Control-Allow-Methods', $allowedMethods);
        $response->headers->set('Access-Control-Allow-Headers', $allowedHeaders);
        $response->headers->set('Access-Control-Allow-Credentials', $allowCredentials);
        $response->headers->set('Access-Control-Max-Age', '86400');
        
        // Headers corregidos para Google OAuth
        $response->headers->set('Cross-Origin-Opener-Policy', 'unsafe-none');
        $response->headers->set('Cross-Origin-Embedder-Policy', 'unsafe-none');

        return $response;
    }
}