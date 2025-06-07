<?php

namespace App\Events;

use App\Models\Puja;
use App\Models\Lote;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ActualizacionUrlTransmision implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;
    public $actualizacionUrlTransmisionData;

    /**
     * Create a new event instance.
     */
    public function __construct($actualizacionUrlTransmisionData)
    {
        $this->actualizacionUrlTransmisionData = $actualizacionUrlTransmisionData;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): Channel|array
    {
        return new Channel('subasta.'.$this->actualizacionUrlTransmisionData['subasta_id']);
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'actualizacion.url.transmision';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        return [
            'subasta_id' => $this->actualizacionUrlTransmisionData['subasta_id'],
            'urlTransmision' => $this->actualizacionUrlTransmisionData['urlTransmision']
        ];
    }
}
