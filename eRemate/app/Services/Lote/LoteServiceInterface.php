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
    public function obtenerEstadoLote(int $loteId): array;

    //métodos para ganadores potenciales
    public function generarListaGanadoresPotenciales(int $loteId): mixed;
    public function aceptarLote(int $loteId, int $usuarioId): mixed;
    public function rechazarLote(int $loteId, int $usuarioId): mixed;
    public function obtenerGanadoresPotenciales(int $loteId): mixed;
    public function obtenerSiguienteGanadorPendiente(int $loteId): mixed;
}