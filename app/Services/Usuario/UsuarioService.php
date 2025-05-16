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
        return Rematador::where('usuario_id', $usuarioId)->first();
    }

    public function obtenerPerfilCasaDeRemates($usuarioId)
    {
        return CasaDeRemates::where('usuario_id', $usuarioId)->first();
    }

    public function obtenerPerfilUsuarioRegistrado($usuarioId)
    {
        return UsuarioRegistrado::where('usuario_id', $usuarioId)->first();
    }
}
