<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Usuario\UsuarioServiceInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class UsuarioController extends Controller
{
    protected $usuarioService;

    public function __construct(UsuarioServiceInterface $usuarioService)
    {
        $this->usuarioService = $usuarioService;
    }

    public function obtenerUsuario($id)
    {
        $usuarioAutenticado = Auth::user();

        if (!$usuarioAutenticado) {
            return response()->json(['error' => 'Token no proporcionado o inválido'], 401);
        }

        if ($usuarioAutenticado->id !== (int) $id) {
            return response()->json(['error' => 'No tienes permiso para acceder a esta información'], 403);
        }

        $usuario = $this->usuarioService->obtenerUsuarioPorId($id);
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }
        return response()->json($usuario);
    }

    public function obtenerPerfil($id)
    {
        
        $usuario = $this->usuarioService->obtenerUsuarioPorId($id);
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        switch ($usuario->tipo) {
            case 'rematador':
                $perfil = $this->usuarioService->obtenerPerfilRematador($id);
                break;
            case 'casa':
                $perfil = $this->usuarioService->obtenerPerfilCasaDeRemates($id);
                break;
            case 'registrado':
                $perfil = $this->usuarioService->obtenerPerfilUsuarioRegistrado($id);
                break;
            default:
                $perfil = null;
        }

        if (!$perfil) {
            return response()->json(['error' => 'Perfil no encontrado'], 404);
        }

        return response()->json($perfil);
    }
}
