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
        return Rematador::where('id', $usuarioId)->first();
    }

    public function obtenerPerfilCasaDeRemates($usuarioId)
    {
        return CasaDeRemates::where('id', $usuarioId)->first();
    }

    public function obtenerPerfilUsuarioRegistrado($usuarioId)
    {
        return UsuarioRegistrado::where('id', $usuarioId)->first();
    }
}
