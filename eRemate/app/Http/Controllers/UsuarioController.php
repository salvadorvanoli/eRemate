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

    public function obtenerEmailsPorIds(Request $request)
    {
        try {
            $ids = $request->input('ids', []);
            
            $usuarios = $this->usuarioService->obtenerEmailsPorIds($ids);

            if (!$usuarios || !is_array($usuarios) || empty($usuarios)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron usuarios o los IDs proporcionados son inválidos'
                ], 400);
            }

            return response()->json([
                'success' => true,
                'data' => $usuarios
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener emails de usuarios'
            ], 500);
        }
    }
}
