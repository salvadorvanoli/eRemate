<?php

namespace App\Services\PayPal;

interface PayPalServiceInterface
{
    public function crearPago(float $monto, string $metodoEntrega, int $usuarioRegistradoId): mixed;
    public function crearPagoDesdeChatId(float $monto, string $metodoEntrega, int $chatId): mixed;
    public function ejecutarPago(string $paymentId, string $payerId, int $usuarioRegistradoId): mixed;
    public function cancelarPago(string $paymentId): mixed;
    public function obtenerEstadoPago(string $paymentId): mixed;
    public function verificarCredenciales(): bool;
}
