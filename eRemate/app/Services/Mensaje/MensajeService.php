<?php

namespace App\Services\Mensaje;

use App\Models\Mensaje;
use App\Events\NuevoMensajeEvent;
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
        $mensaje = Mensaje::create($datos);
        
        $mensaje->load('usuario');
        
        $mensajeData = [
            'id' => $mensaje->id,
            'contenido' => $mensaje->contenido,
            'chat_id' => $mensaje->chat_id,
            'usuario_id' => $mensaje->usuario_id,
            'usuario_nombre' => $mensaje->usuario->nombre ?? 'Usuario',
            'created_at' => $mensaje->created_at->toISOString(),
            'tipo' => $datos['tipo'] ?? 'mensaje'
        ];
        
        event(new NuevoMensajeEvent($mensajeData));
        
        return $mensaje;
    }

    public function eliminar($id)
    {
        $mensaje = $this->buscarPorId($id);
        $mensaje->delete();
    }
    
}