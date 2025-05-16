<?php

namespace App\Services\Auth;

use App\Models\Usuario;
use App\Models\Rematador;
use App\Models\CasaDeRemates;
use App\Models\UsuarioRegistrado;
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

        // Generar token con Sanctum
        $token = $usuario->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'usuario' => $usuario,
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

        Rematador::create([
            'usuario_id' => $usuarioId,
            'nombre' => $request->nombre,
            'apellido' => $request->apellido,
            'numeroMatricula' => $request->numeroMatricula,
            'direccionFiscal' => $request->direccionFiscal,
            'imagen' => $request->imagen ?? null,
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
            'usuario_id' => $usuarioId,
            'identificacionFiscal' => $request->identificacionFiscal,
            'nombreLegal' => $request->nombreLegal,
            'domicilio' => $request->domicilio,
        ]);
    }

    private function registrarUsuarioComun($usuarioId)
    {
        UsuarioRegistrado::create([
            'usuario_id' => $usuarioId,
        ]);
    }
}