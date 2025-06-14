<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\PaymentRequest;

class NuevaSolicitudPagoEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $paymentRequest;
    public $chat_id;

    public function __construct($paymentRequest, $chat_id)
    {
        $this->paymentRequest = $paymentRequest;
        $this->chat_id = $chat_id;
    }

    public function broadcastOn()
    {
        return new Channel('payment-request.' . $this->chat_id);
    }

    public function broadcastWith()
    {
        return [
            'payment_request' => $this->paymentRequest,
            'chat_id' => $this->chat_id,
            'timestamp' => now()->toISOString()
        ];
    }

    public function broadcastAs()
    {
        return 'nueva-solicitud-pago';
    }
}
