<?php

namespace App\Services\Subasta;

use App\Models\Lote;
use App\Models\Subasta;

interface SubastaServiceInterface
{
    public function crearSubasta(array $data);
    public function obtenerSubasta(int $id);
    public function actualizarSubasta(int $id, array $data);
    public function obtenerSubastas();
    public function obtenerSubastasOrdenadas();
    public function obtenerSubastasFiltradas(array $data);
    public function obtenerUbicaciones();
    public function obtenerDatosParaMapa();
    public function obtenerSubastasOrdenadasPorCierre($pagina = 1, $cantidad = 10);
    public function obtenerLotes(int $id);
    public function iniciarSubasta(int $id);
    public function cerrarSubasta(int $id);
    public function realizarPuja(array $puja, int $id);
    public function obtenerPujas(int $id);
    public function realizarPujaAutomatica(array $pujaAutomatica, int $id);
    public function obtenerTransmisionEnVivo(int $id);
    public function iniciarProcesoDeAutomatizacion(Subasta $subasta, Lote $lote);
    public function realizarPujaInterna(array $puja, int $subastaId, int $usuarioId);
    public function eliminarSubasta(int $id);
    public function obtenerImagenAleatoria(int $subastaId);
    public function manejarLoteSinGanadores(int $loteId): mixed;
}