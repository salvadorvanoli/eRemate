<?php

namespace App\Services\Subasta;

interface SubastaServiceInterface
{
    public function crearSubasta(array $data);
    public function obtenerSubasta(int $id);
    public function actualizarSubasta(int $id, array $data);
    public function obtenerSubastas();
    public function obtenerSubastasOrdenadasPorCierre($pagina = 1, $cantidad = 10);
    public function obtenerLotes(int $id);
    public function iniciarSubasta(int $id);
    public function cerrarSubasta(int $id);
    public function realizarPuja(int $id);
    public function obtenerPujas(int $id);
    public function realizarPujaAutomatica(int $id);
    public function obtenerTransmisionEnVivo(int $id);
    public function eliminarSubasta(int $id);
}