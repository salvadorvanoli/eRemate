<?php

namespace App\Services\Lote;

interface LoteServiceInterface
{
    public function crearLote(array $data);
    public function obtenerLote(int $id);
    public function actualizarLote(int $id, array $data);
    public function obtenerArticulos(int $id);
    public function agregarArticulo(int $id, int $articuloId);
    public function removerArticulo(int $id, int $articuloId);
    public function obtenerLotesPorSubasta(int $subastaId);
    public function eliminarLote(int $id);
}