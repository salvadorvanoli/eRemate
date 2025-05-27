<?php

namespace App\Services\Usuario;

use App\Models\Usuario;
use App\Models\Rematador;
use App\Models\CasaDeRemates;
use App\Models\UsuarioRegistrado;

class UsuarioService implements UsuarioServiceInterface
{
    public function obtenerUsuarioPorId($id)
    {
        return Usuario::find($id);
    }

    public function obtenerPerfilRematador($usuarioId)
    {
        $rematador = Rematador::where('id', $usuarioId)->first();
        $usuario = Usuario::find($usuarioId);
        
        if (!$rematador || !$usuario) {
            return null;
        }
        
        return [
            'rematador' => $rematador,
            'usuario' => $usuario
        ];
    }

    public function obtenerPerfilCasaDeRemates($usuarioId)
    {
        $casa = CasaDeRemates::where('id', $usuarioId)->first();
        $usuario = Usuario::find($usuarioId);
        
        if (!$casa || !$usuario) {
            return null;
        }
        
        return [
            'casa' => $casa,
            'usuario' => $usuario
        ];
    }

    public function obtenerPerfilUsuarioRegistrado($usuarioId)
    {
        $usuarioRegistrado = UsuarioRegistrado::where('id', $usuarioId)->first();
        $usuario = Usuario::find($usuarioId);
        
        if (!$usuarioRegistrado || !$usuario) {
            return null;
        }
        
        return [
            'usuarioRegistrado' => $usuarioRegistrado,
            'usuario' => $usuario
        ];
    }
}
