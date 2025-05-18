<?php

namespace App\Services\Subasta;

interface SubastaServiceInterface
{
    public function crearSubasta(array $data);
    public function obtenerSubasta(int $id);
    public function actualizarSubasta(int $id, array $data);
    public function obtenerSubastas();
}