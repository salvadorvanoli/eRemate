<?php

namespace App\Events;

use App\Models\Mensaje;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NuevoMensajeEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $mensajeData;

    public function __construct($mensajeData)
    {
        $this->mensajeData = $mensajeData;
    }

    public function broadcastOn(): Channel|array
    {
        return new Channel('chat.' . $this->mensajeData['chat_id']);
    }

    public function broadcastAs(): string
    {
        return 'nuevo.mensaje';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->mensajeData['id'],
            'contenido' => $this->mensajeData['contenido'],
            'chat_id' => $this->mensajeData['chat_id'],
            'usuario_id' => $this->mensajeData['usuario_id'],
            'usuario_nombre' => $this->mensajeData['usuario_nombre'] ?? null,
            'created_at' => $this->mensajeData['created_at'],
            'tipo' => $this->mensajeData['tipo'] ?? 'mensaje'
        ];
    }
}
