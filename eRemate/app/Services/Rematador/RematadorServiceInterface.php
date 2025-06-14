<?php

namespace App\Services\Rematador;

interface RematadorServiceInterface
{
    public function crearRematador(array $data);
    public function obtenerRematadorPorId(int $id);
    public function actualizarRematador(int $id, array $data);
    public function obtenerSubastasPorRematador(int $id);
    public function obtenerAgendaRematador(int $id);
    public function obtenerSubastasSolicitadas(int $id);
    public function aceptarSubasta(int $rematadorId, int $subastaId);
    public function rechazarSubasta(int $rematadorId, int $subastaId);
}