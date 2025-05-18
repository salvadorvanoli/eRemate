<?php

namespace App\Enums;

enum MetodoPago: string
{
    case EFECTIVO = 'efectivo';
    case POSNET = 'posnet';
    case TRANSFERENCIA = 'transferencia';
    case PAYPAL = 'paypal';

    public function label(): string
    {
        return match($this) {
            self::EFECTIVO => 'Efectivo',
            self::POSNET => 'Posnet',
            self::TRANSFERENCIA => 'Transferencia Bancaria',
            self::PAYPAL => 'PayPal'
        };
    }
    
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}