<?php

namespace App\Events;

use App\Models\Puja;
use App\Models\Lote;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NuevaPujaEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;
    public $nuevaPujaData;

    /**
     * Create a new event instance.
     */
    public function __construct($pujaData)
    {
        $this->nuevaPujaData = $pujaData;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): Channel|array
    {
        return new Channel('subasta.'.$this->nuevaPujaData['subasta_id']);
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'nueva.puja';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->nuevaPujaData['id'],
            'monto' => $this->nuevaPujaData['monto'],
            'lote_id' => $this->nuevaPujaData['lote_id'],
            'lote_nombre' => $this->nuevaPujaData['lote_nombre'],
            'subasta_id' => $this->nuevaPujaData['subasta_id'],
            'usuario_id' => $this->nuevaPujaData['usuario_id']
        ];
    }
}
