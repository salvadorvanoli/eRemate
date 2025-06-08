<?php

namespace App\Enums;

enum TipoSubasta: string
{
    case PRESENCIAL = 'PRESENCIAL';
    case HIBRIDA = 'HIBRIDA';
    case REMOTA = 'REMOTA';

    public static function valores(): array
    {
        return array_column(self::cases(), 'value');
    }    public static function etiquetas(): array
    {
        return [
            self::PRESENCIAL->value => 'Presencial',
            self::HIBRIDA->value => 'Híbrida',
            self::REMOTA->value => 'Remota',
        ];
    }    public function etiqueta(): string
    {
        return self::etiquetas()[$this->value];
    }

    public static function options(): array
    {
        return array_map(fn($case) => [
            'value' => $case->value,
            'label' => $case->etiqueta()
        ], self::cases());
    }
}
