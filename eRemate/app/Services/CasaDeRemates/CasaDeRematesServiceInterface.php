<?php

namespace App\Services\CasaDeRemates;

interface CasaDeRematesServiceInterface
{
    public function actualizarCasaDeRemates(int $id, array $data);
    public function obtenerRematadores(int $id);
    public function obtenerSubastas(int $id);
    public function desasignarRematador(int $id, int $rematadorId);
    public function asignarRematador(int $id, string $email);
    public function estadisticaVentas(int $id, int $year = null);
    public function estadisticasPorCategoria(int $id, int $year = null);
    public function estadisticasPujas(int $id); 
}