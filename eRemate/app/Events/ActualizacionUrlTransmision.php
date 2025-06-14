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

    public function __construct($actualizacionUrlTransmisionData)
    {
        $this->actualizacionUrlTransmisionData = $actualizacionUrlTransmisionData;
    }

    public function broadcastOn(): Channel|array
    {
        return new Channel('subasta.'.$this->actualizacionUrlTransmisionData['subasta_id']);
    }

    public function broadcastAs(): string
    {
        return 'actualizacion.url.transmision';
    }

    public function broadcastWith(): array
    {
        return [
            'subasta_id' => $this->actualizacionUrlTransmisionData['subasta_id'],
            'urlTransmision' => $this->actualizacionUrlTransmisionData['urlTransmision']
        ];
    }
}
