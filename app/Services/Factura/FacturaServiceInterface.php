<?php

namespace App\Services\Factura;

interface FacturaServiceInterface
{

    public function obtenerTodas();
    public function buscarPorId($id);
    public function crear(array $datos);
    public function eliminar($id);
    public function obtenerPorUsuario($usuarioId);
    public function generarPdf($facturaId);
}