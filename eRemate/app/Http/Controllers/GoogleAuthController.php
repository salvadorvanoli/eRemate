<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\UsuarioRegistrado;
use App\Models\Rematador;
use App\Models\CasaDeRemates;
use App\Notifications\BienvenidaUsuarioNotification;
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

            $existingUser = Usuario::where('email', $email)->orWhere('google_id', $googleId)->first();

            if ($existingUser) {
                return response()->json(['error' => 'El usuario ya existe'], 409);
            }

            $usuario = Usuario::create([
                'email' => $email,
                'google_id' => $googleId,
                'telefono' => '',
                'tipo' => '',
                'contrasenia' => '',
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
                'imagenes' => 'nullable|array',
                'imagenes.*' => 'nullable|array',
                // Campos para casa de remates
                'identificacionFiscal' => 'required_if:tipo,casa|string|max:50',
                'nombreLegal' => 'required_if:tipo,casa|string|max:255',
                'domicilio' => 'required_if:tipo,casa|string|max:255'
            ]);

            $user->update([
                'telefono' => $request->telefono,
                'tipo' => $request->tipo,
                'perfil_completo' => true
            ]);

            if ($request->tipo === 'registrado') {
                UsuarioRegistrado::create([
                    'id' => $user->id
                ]);
            } elseif ($request->tipo === 'rematador') {
                // Procesar las imágenes del frontend
                $imagenUrl = null;
                if ($request->has('imagenes') && is_array($request->imagenes) && count($request->imagenes) > 0) {
                    // Tomar la primera imagen del array (para rematadores solo debe ser 1)
                    $primeraImagen = $request->imagenes[0];
                    
                    // Si la imagen tiene la estructura esperada del frontend
                    if (is_array($primeraImagen) && isset($primeraImagen['url'])) {
                        $imagenUrl = $primeraImagen['url'];
                    } elseif (is_string($primeraImagen)) {
                        $imagenUrl = $primeraImagen;
                    }
                }

                Rematador::create([
                    'id' => $user->id,
                    'nombre' => $request->nombre,
                    'apellido' => $request->apellido,
                    'numeroMatricula' => $request->numeroMatricula,
                    'direccionFiscal' => $request->direccionFiscal,
                    'imagen' => $imagenUrl ?? ''
                ]);
            } elseif ($request->tipo === 'casa') {
                CasaDeRemates::create([
                    'id' => $user->id,
                    'identificacionFiscal' => $request->identificacionFiscal,
                    'nombreLegal' => $request->nombreLegal,
                    'domicilio' => $request->domicilio
                ]);
            }

            $user->refresh();

            // Mandar notificación de bienvenida si es un usuario registrado
            if ($user instanceof Usuario) {
                $this->sendBienvenidaNotification($user);
            }

            return response()->json([
                'message' => 'Perfil completado exitosamente',
                'user' => $user
            ]);

        } catch (\Exception $e) {
            \Log::error('Complete Profile Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error al completar el perfil'], 500);
        }
    }

    private function sendBienvenidaNotification(Usuario $usuario)
    {
        try {
            $usuario->notify(new BienvenidaUsuarioNotification());
        } catch (\Exception $e) {
            \Log::error('Error sending BienvenidaUsuarioNotification: ' . $e->getMessage());
        }
    }
}