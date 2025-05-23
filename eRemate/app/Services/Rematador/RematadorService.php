<?php

namespace App\Services\Rematador;

use App\Models\Rematador;
use Illuminate\Database\Eloquent\Collection;

class RematadorService implements RematadorServiceInterface
{


    public function crearRematador(array $data): Rematador
{
    // si ya existe
    $rematador = Rematador::where('numeroMatricula', $data['numeroMatricula'])->first();

    if ($rematador) {
        return $rematador;
    }

    // si no existe
    return Rematador::create([
        'id' => $data['id'],
        'nombre' => $data['nombre'],
        'apellido' => $data['apellido'],
        'numeroMatricula' => $data['numeroMatricula'],
        'direccionFiscal' => $data['direccionFiscal'],
        'imagen' => $data['imagen'] ?? null
    ]);
}

    public function obtenerRematadorPorId(int $id): ?Rematador
    {
        return Rematador::findOrFail($id);
    }

    public function actualizarRematador(int $id, array $data): bool
    {
        $rematador = $this->obtenerRematadorPorId($id);
        return $rematador->update($data);
        
    }

    public function obtenerSubastasPorRematador(int $id): Collection
    {
        $rematador = $this->obtenerRematadorPorId($id);
        return $rematador->subastas;
    }

}