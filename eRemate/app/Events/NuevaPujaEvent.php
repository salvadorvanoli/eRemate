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
    public $pujaData;
    public $subastaId;

    /**
     * Create a new event instance.
     */
    public function __construct($pujaData, $subastaId)
    {
        $this->pujaData = $pujaData;
        $this->subastaId = $subastaId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): Channel|array
    {
        return new Channel('subasta.'.$this->subastaId);
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
            'id' => $this->pujaData['id'],
            'monto' => $this->pujaData['monto'],
            'lote_id' => $this->pujaData['lote_id'],
            'lote_nombre' => $this->pujaData['lote_nombre'],
            'usuario_id' => $this->pujaData['usuario_id'],
            'subasta_id' => $this->subastaId,
        ];
    }
}
