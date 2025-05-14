<?php

namespace App\Services\Calificacion;

interface CalificacionServiceInterface
{
    public function obtenerTodas();
    public function buscarPorId($id);
    public function crear(array $datos);
    public function actualizar($id, array $datos);
    public function eliminar($id);
    public function obtenerPorCompra($compraId);
}