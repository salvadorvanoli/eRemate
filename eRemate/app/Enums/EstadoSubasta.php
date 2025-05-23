<?php

namespace App\Enums;

enum EstadoSubasta: string
{
    case PENDIENTE = 'pendiente';
    case INICIADA = 'iniciada';
    case CERRADA = 'cerrada';

    public function label(): string
    {
        return match($this) {
            self::PENDIENTE => 'Pendiente',
            self::INICIADA => 'Iniciada',
            self::CERRADA => 'Cerrada'
        };
    }
    
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
