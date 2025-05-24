<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Auth\AuthServiceInterface;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;

class AuthController extends Controller
{
    protected $authService;

    // Inyectamos el service por constructor
    public function __construct(AuthServiceInterface $authService)
    {
        $this->authService = $authService;
    }

    // Método para registrar un usuario
    public function register(Request $request)
    {
        return $this->authService->register($request);
    }

    public function login(Request $request)
    {
        $usuario = Usuario::where('email', $request->email)->first();

        if (! $usuario || ! Hash::check($request->contrasenia, $usuario->contrasenia)) {
            return response()->json(['error' => 'Credenciales inválidas'], 401);
        }

        $token = $usuario->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    public function getAuthenticatedUser(Request $request)
    {
        $usuario = Usuario::with(['rematador', 'casaDeRemates', 'usuarioRegistrado'])
        ->find($request->user()->id);

        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        return response()->json($usuario);
    }
}
