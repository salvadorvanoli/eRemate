<?php

namespace App\Services\UsuarioRegistrado;

interface UsuarioRegistradoServiceInterface
{
    public function obtenerMetodosPago($id);
    public function agregarMetodoPago($id, string $metodoPago);
    public function obtenerHistorialCompras($id);
}