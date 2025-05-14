<?php

namespace App\Services\UsuarioRegistrado;

use App\Models\UsuarioRegistrado;
use App\Enums\MetodoPago;

class UsuarioRegistradoService implements UsuarioRegistradoServiceInterface
{
    // Obtener métodos de pago registrados
    public function obtenerMetodosPago($id)
    {
        $usuario = UsuarioRegistrado::findOrFail($id);
        return $usuario->metodos_pago ?? [];
    }

    // Agregar un método de pago (si no existe ya)
    public function agregarMetodoPago($id, string $metodoPago)
    {
        if (!in_array($metodoPago, array_column(MetodoPago::cases(), 'value'))) {
            throw new \InvalidArgumentException('Método de pago inválido.');
        }

        $usuario = UsuarioRegistrado::findOrFail($id);
        $metodos = $usuario->metodos_pago ?? [];
        if (!in_array($metodoPago, $metodos)) {
            $metodos[] = $metodoPago;
            $usuario->metodos_pago = $metodos;
            $usuario->save();
        }
        return $usuario->metodos_pago;
    }

    // Obtener historial de compras
    public function obtenerHistorialCompras($id)
    {
        $usuario = UsuarioRegistrado::findOrFail($id);
        return $usuario->compras ?? [];
    }
}