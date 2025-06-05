<?php

namespace App\Services\PaymentRequest;

use App\Models\PaymentRequest;
use App\Events\NuevaSolicitudPagoEvent;
use App\Events\EstadoSolicitudPagoEvent;
use Illuminate\Support\Facades\Auth;

class PaymentRequestService
{
    public function createPaymentRequest($data)
    {
        $paymentRequest = PaymentRequest::create($data);
        
        $paymentRequest->load(['usuarioRegistrado', 'casaDeRemate', 'chat']);
        
        broadcast(new NuevaSolicitudPagoEvent($paymentRequest, $data['chat_id']));
        
        return $paymentRequest;
    }
    
    public function updatePaymentRequestStatus($paymentRequestId, $newStatus)
    {
        $paymentRequest = PaymentRequest::find($paymentRequestId);
        
        if (!$paymentRequest) {
            throw new \Exception('Solicitud de pago no encontrada');
        }
        
        $paymentRequest->estado = $newStatus;
        $paymentRequest->save();
        
        $paymentRequest->load(['usuarioRegistrado', 'casaDeRemate', 'chat']);
        
        broadcast(new EstadoSolicitudPagoEvent($paymentRequest, $paymentRequest->chat_id));
        
        return $paymentRequest;
    }
}
