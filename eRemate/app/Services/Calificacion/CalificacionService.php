<?php

namespace App\Services\Calificacion;

use App\Models\Calificacion;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class CalificacionService implements CalificacionServiceInterface
{
    public function obtenerTodas()
    {
        return Calificacion::all();
    }

    public function buscarPorId($id)
    {
        return Calificacion::findOrFail($id);
    }

    public function crear(array $datos)
    {
        return Calificacion::create($datos);
    }

    public function actualizar($id, array $datos)
    {
        $calificacion = $this->buscarPorId($id);
        $calificacion->update($datos);
        return $calificacion->fresh();
    }

    public function eliminar($id)
    {
        $calificacion = $this->buscarPorId($id);
        $calificacion->delete();
    }

    public function obtenerPorLote($loteId) // Cambiado de obtenerPorCompra a obtenerPorLote
    {
        return Calificacion::where('lote_id', $loteId)->first();
    }
}