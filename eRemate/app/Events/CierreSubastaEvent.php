<?php

namespace App\Events;

use App\Models\Subasta;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CierreSubastaEvent implements ShouldBroadcastNow
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
        return 'subasta.cerrada';
    }

    public function broadcastWith(): array
    {
        return [
            'subasta_id' => $this->subastaData['subasta_id'],
            'estado' => $this->subastaData['estado'],
            'lote_cerrado_id' => $this->subastaData['lote_cerrado_id'] ?? null,
            'lote_cerrado_nombre' => $this->subastaData['lote_cerrado_nombre'] ?? null,
            'ganador_id' => $this->subastaData['ganador_id'] ?? null,
            'siguiente_lote_id' => $this->subastaData['siguiente_lote_id'] ?? null,
            'siguiente_lote_nombre' => $this->subastaData['siguiente_lote_nombre'] ?? null,
            'subasta_finalizada' => $this->subastaData['subasta_finalizada'] ?? false,
            'timestamp' => now()->toISOString()
        ];
    }
}
