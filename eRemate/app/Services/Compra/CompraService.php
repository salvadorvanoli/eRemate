<?php

namespace App\Services\Compra;

use App\Models\Compra;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class CompraService implements CompraServiceInterface
{
    public function obtenerTodas()
    {
        return Compra::all();
    }
    
    public function buscarPorId($id)
    {
        return Compra::findOrFail($id);
    }
    
    public function crear(array $datos)
    {
        return Compra::create($datos);
    }
    
    public function actualizar($id, array $datos)
    {
        $compra = $this->buscarPorId($id);
        $compra->update($datos);
        return $compra->fresh();
    }
    
    public function eliminar($id)
    {
        $compra = $this->buscarPorId($id);
        $compra->delete();
    }
}