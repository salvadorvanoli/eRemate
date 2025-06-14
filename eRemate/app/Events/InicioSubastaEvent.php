<?php

namespace App\Events;

use App\Models\Subasta;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InicioSubastaEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;
    
    public $subastaData;

    public function __construct($subastaData)
    {
        $this->subastaData = $subastaData;
    }

    public function broadcastOn(): Channel|array
    {
        return new Channel('subasta.'.$this->subastaData['subasta_id']);
    }

    public function broadcastAs(): string
    {
        return 'subasta.iniciada';
    }

    public function broadcastWith(): array
    {
        return [
            'subasta_id' => $this->subastaData['subasta_id'],
            'estado' => $this->subastaData['estado'],
            'lote_actual_id' => $this->subastaData['lote_actual_id'],
            'lote_actual_nombre' => $this->subastaData['lote_actual_nombre'],
            'url_transmision' => $this->subastaData['url_transmision'] ?? null,
            'timestamp' => now()->toISOString()
        ];
    }
}
