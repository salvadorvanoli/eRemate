<?php

namespace App\Enums;

enum EstadoArticulo: string
{
    case NUEVO = 'NUEVO';
    case MUY_BUENO = 'MUY_BUENO';
    case BUENO = 'BUENO';
    case ACEPTABLE = 'ACEPTABLE';
    case REACONDICIONADO = 'REACONDICIONADO';
    case DEFECTUOSO = 'DEFECTUOSO';

    public function label(): string
    {
        return match($this) {
            self::NUEVO => 'Nuevo',
            self::MUY_BUENO => 'Muy Bueno',
            self::BUENO => 'Bueno',
            self::ACEPTABLE => 'Aceptable',
            self::REACONDICIONADO => 'Reacondicionado',
            self::DEFECTUOSO => 'Defectuoso'
        };
    }
    
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
    
    public static function options(): array
    {
        return array_map(function($case) {
            return [
                'value' => $case->value,
                'label' => $case->label()
            ];
        }, self::cases());
    }
}
