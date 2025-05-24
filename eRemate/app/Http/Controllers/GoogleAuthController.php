<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\UsuarioRegistrado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Google_Client;

class GoogleAuthController extends Controller
{
    public function googleAuth(Request $request)
    {
        try {
            $request->validate([
                'token' => 'required|string'
            ]);

            $client = new Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);
            $payload = $client->verifyIdToken($request->token);

            if (!$payload) {
                return response()->json(['error' => 'Token de Google inválido'], 401);
            }

            $googleId = $payload['sub'];
            $email = $payload['email'];
            $name = $payload['name'] ?? '';
            $picture = $payload['picture'] ?? '';

            // Buscar usuario existente por email
            $usuario = Usuario::where('email', $email)->first();

            if (!$usuario) {
                return response()->json(['error' => 'Usuario no encontrado'], 404);
            }

            // Actualizar google_id si no lo tiene
            if (!$usuario->google_id) {
                $usuario->update(['google_id' => $googleId]);
            }

            $token = $usuario->createToken('google_auth_token')->plainTextToken;

            return response()->json([
                'access_token' => $token,
                'user' => $usuario,
                'message' => 'Inicio de sesión con Google exitoso'
            ]);

        } catch (\Exception $e) {
            \Log::error('Google Auth Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error en autenticación con Google'], 500);
        }
    }

    public function googleRegister(Request $request)
    {
        try {
            $request->validate([
                'token' => 'required|string',
                'tipo' => 'string|in:registrado,rematador,casa'
            ]);

            $client = new Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);
            $payload = $client->verifyIdToken($request->token);

            if (!$payload) {
                return response()->json(['error' => 'Token de Google inválido'], 401);
            }

            $googleId = $payload['sub'];
            $email = $payload['email'];
            $name = $payload['name'] ?? '';
            $picture = $payload['picture'] ?? '';

            // Verificar si el usuario ya existe
            $existingUser = Usuario::where('email', $email)->orWhere('google_id', $googleId)->first();

            if ($existingUser) {
                // Si existe, hacer login
                $token = $existingUser->createToken('google_auth_token')->plainTextToken;
                
                return response()->json([
                    'access_token' => $token,
                    'user' => $existingUser,
                    'message' => 'Usuario ya existía, sesión iniciada'
                ]);
            }

            // Crear nuevo usuario
            $tipoUsuario = $request->tipo ?? 'registrado';
            $telefono = $request->telefono ?? ''; // Puede estar vacío inicialmente

            // Separar nombre y apellido
            $nameParts = explode(' ', trim($name));
            $nombre = $nameParts[0] ?? '';
            $apellido = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : '';            if ($tipoUsuario === 'registrado') {
                // Crear usuario en tabla usuarios primero
                $usuario = Usuario::create([
                    'email' => $email,
                    'telefono' => $telefono,
                    'contrasenia' => Hash::make('google_user_' . time()), // Contraseña temporal
                    'tipo' => 'registrado',
                    'google_id' => $googleId
                ]);

                // Crear entrada en usuarios_registrados
                UsuarioRegistrado::create([
                    'id' => $usuario->id
                ]);
            } else {
                // Para rematador y casa, crear en la tabla Usuario base
                $usuario = Usuario::create([
                    'email' => $email,
                    'telefono' => $telefono,
                    'contrasenia' => Hash::make('google_user_' . time()),
                    'tipo' => $tipoUsuario,
                    'google_id' => $googleId
                ]);
            }

            $token = $usuario->createToken('google_register_token')->plainTextToken;

            return response()->json([
                'access_token' => $token,
                'user' => $usuario,
                'message' => 'Usuario registrado con Google exitosamente',
                'requires_completion' => empty($telefono) // Indica si necesita completar datos
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Google Register Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error en registro con Google'], 500);
        }
    }
}
