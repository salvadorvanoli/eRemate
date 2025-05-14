<?php

namespace App\Services\Mensaje;

use App\Models\Mensaje;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class MensajeService implements MensajeServiceInterface
{
    public function obtenerTodos()
    {
        return Mensaje::all();
    }

    public function buscarPorId($id)
    {
        return Mensaje::findOrFail($id);
    }

    public function crear(array $datos)
    {
        return Mensaje::create($datos);
    }

    public function eliminar($id)
    {
        $mensaje = $this->buscarPorId($id);
        $mensaje->delete();
    }
    
    public function obtenerPorChat($chatId)
    {
        return Mensaje::where('chat_id', $chatId)
                    ->orderBy('created_at', 'asc')
                    ->get();
    }
}