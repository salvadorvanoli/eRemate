<?php

namespace App\Services\Usuario;

interface UsuarioServiceInterface
{
    public function obtenerUsuarioPorId($id);
    public function obtenerPerfilRematador($usuarioId);
    public function obtenerPerfilCasaDeRemates($usuarioId);
    public function obtenerPerfilUsuarioRegistrado($usuarioId);
    public function obtenerEmailsPorIds($ids);
}