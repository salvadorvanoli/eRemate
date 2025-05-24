<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\UsuarioRegistrado;
use App\Models\Rematador;
use App\Models\CasaDeRemates;
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

            // Buscar usuario existente por email o google_id
            $usuario = Usuario::where('email', $email)
                             ->orWhere('google_id', $googleId)
                             ->first();

            if (!$usuario) {
                return response()->json(['error' => 'Usuario no encontrado. Por favor regístrate primero.'], 404);
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

            // Verificar si el usuario ya existe
            $existingUser = Usuario::where('email', $email)->orWhere('google_id', $googleId)->first();

            if ($existingUser) {
                return response()->json(['error' => 'El usuario ya existe'], 409);
            }

            // Crear usuario con datos mínimos de Google y perfil incompleto
            $usuario = Usuario::create([
                'email' => $email,
                'google_id' => $googleId,
                'telefono' => '', // Se completará después
                'tipo' => '', // Se completará después
                'contrasenia' => '', // No necesaria para Google
                'perfil_completo' => false
            ]);

            $token = $usuario->createToken('google_auth_token')->plainTextToken;

            return response()->json([
                'access_token' => $token,
                'user' => $usuario,
                'requires_completion' => true,
                'google_data' => [
                    'name' => $name,
                    'email' => $email,
                    'picture' => $picture
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Google Register Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error en el registro con Google'], 500);
        }
    }

    public function completeProfile(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user || $user->perfil_completo) {
                return response()->json(['error' => 'Usuario no válido o perfil ya completado'], 400);
            }

            $request->validate([
                'telefono' => 'required|string|max:15',
                'tipo' => 'required|string|in:registrado,rematador,casa',
                // Campos para rematador
                'nombre' => 'required_if:tipo,rematador|string|max:255',
                'apellido' => 'required_if:tipo,rematador|string|max:255',
                'numeroMatricula' => 'required_if:tipo,rematador|string|max:50',
                'direccionFiscal' => 'required_if:tipo,rematador|string|max:255',
                'imagen' => 'nullable|string',
                // Campos para casa de remates
                'identificacionFiscal' => 'required_if:tipo,casa|string|max:50',
                'nombreLegal' => 'required_if:tipo,casa|string|max:255',
                'domicilio' => 'required_if:tipo,casa|string|max:255'
            ]);

            // Actualizar usuario base
            $user->update([
                'telefono' => $request->telefono,
                'tipo' => $request->tipo,
                'perfil_completo' => true
            ]);

            // Crear registros específicos según el tipo
            if ($request->tipo === 'registrado') {
                UsuarioRegistrado::create([
                    'id' => $user->id
                ]);
            } elseif ($request->tipo === 'rematador') {
                Rematador::create([
                    'id' => $user->id,
                    'nombre' => $request->nombre,
                    'apellido' => $request->apellido,
                    'numeroMatricula' => $request->numeroMatricula,
                    'direccionFiscal' => $request->direccionFiscal,
                    'imagen' => $request->imagen ?? ''
                ]);
            } elseif ($request->tipo === 'casa') {
                CasaDeRemates::create([
                    'id' => $user->id,
                    'identificacionFiscal' => $request->identificacionFiscal,
                    'nombreLegal' => $request->nombreLegal,
                    'domicilio' => $request->domicilio
                ]);
            }

            // Recargar usuario con relaciones
            $user->refresh();

            return response()->json([
                'message' => 'Perfil completado exitosamente',
                'user' => $user
            ]);

        } catch (\Exception $e) {
            \Log::error('Complete Profile Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error al completar el perfil'], 500);
        }
    }
}
