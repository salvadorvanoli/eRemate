<?php

namespace App\Services\Auth;

use App\Models\Usuario;
use App\Models\Rematador;
use App\Models\CasaDeRemates;
use App\Models\UsuarioRegistrado;
use App\Notifications\BienvenidaUsuarioNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthService implements AuthServiceInterface
{
    public function register($request)
    {
        // Validaciones comunes
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:usuarios,email',
            'contrasenia' => 'required|min:8',
            'telefono' => 'required',
            'tipo' => 'required|in:rematador,casa,registrado'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Crear usuario base
        $usuario = Usuario::create([
            'email' => $request->email,
            'contrasenia' => bcrypt($request->contrasenia),
            'telefono' => $request->telefono,
            'tipo' => $request->tipo,
        ]);

        // Según el tipo, crear el perfil asociado
        switch ($request->tipo) {
            case 'rematador':
                $this->registrarRematador($request, $usuario->id);
                break;

            case 'casa':
                $this->registrarCasaDeRemates($request, $usuario->id);
                break;

            case 'registrado':
            default:
                $this->registrarUsuarioComun($usuario->id);
                break;
        }

        $usuario->update(['perfil_completo' => true]);

        // Send welcome notification
        $this->sendBienvenidaNotification($usuario);

        // Generar token con Sanctum
        $token = $usuario->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token
        ]);
    }

    private function registrarRematador($request, $usuarioId)
    {
        Validator::make($request->all(), [
            'nombre' => 'required|string',
            'apellido' => 'required|string',
            'numeroMatricula' => 'required|string',
            'direccionFiscal' => 'required|string',
        ])->validate();

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
        } elseif ($request->has('imagen')) {
            // Fallback para el formato anterior
            $imagenUrl = $request->imagen;
        }

        Rematador::create([
            'id' => $usuarioId,
            'nombre' => $request->nombre,
            'apellido' => $request->apellido,
            'numeroMatricula' => $request->numeroMatricula,
            'direccionFiscal' => $request->direccionFiscal,
            'imagen' => $imagenUrl,
        ]);
    }

    private function registrarCasaDeRemates($request, $usuarioId)
    {
        Validator::make($request->all(), [
            'identificacionFiscal' => 'required|string',
            'nombreLegal' => 'required|string',
            'domicilio' => 'required|string',
        ])->validate();

        CasaDeRemates::create([
            'id' => $usuarioId,
            'identificacionFiscal' => $request->identificacionFiscal,
            'nombreLegal' => $request->nombreLegal,
            'domicilio' => $request->domicilio,
        ]);
    }

    private function registrarUsuarioComun($usuarioId)
    {
        UsuarioRegistrado::create([
            'id' => $usuarioId,
        ]);
    }

    /**
     * Send BienvenidaUsuarioNotification to the newly registered user
     */
    private function sendBienvenidaNotification(Usuario $usuario)
    {
        try {
            $usuario->notify(new BienvenidaUsuarioNotification());
        } catch (\Exception $e) {
            // Log the error but don't fail the registration process
            \Log::error('Error sending BienvenidaUsuarioNotification: ' . $e->getMessage());
        }
    }
}