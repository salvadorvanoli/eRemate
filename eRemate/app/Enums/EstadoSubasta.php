<?php

namespace App\Enums;

enum EstadoSubasta: string
{
    case PENDIENTE = 'pendiente';
    case PENDIENTE_APROBACION = 'pendiente_aprobacion';
    case ACEPTADA = 'aceptada';
    case CANCELADA = 'cancelada';
    case INICIADA = 'iniciada';
    case CERRADA = 'cerrada';
    case CANCELADA = 'cancelada';

    public function label(): string
    {
        return match($this) {
            self::PENDIENTE => 'Pendiente',
            self::PENDIENTE_APROBACION => 'Pendiente Aprobación',
            self::ACEPTADA => 'Aceptada',
            self::CANCELADA => 'Cancelada',
            self::INICIADA => 'Iniciada',
            self::CERRADA => 'Cerrada',
            self::CANCELADA => 'Cancelada'
        };
    }
    
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
