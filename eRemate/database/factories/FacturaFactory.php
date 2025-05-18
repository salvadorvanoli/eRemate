<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class FacturaFactory extends Factory
{
    protected $model = \App\Models\Factura::class;

    public function definition(): array
    {
        return [
            'monto' => $this->faker->randomFloat(2, 10, 1000),
            'metodoEntrega' => $this->faker->randomElement(['Envío', 'Recogida']),
            'metodoPago' => $this->faker->randomElement(['Efectivo', 'Tarjeta', 'Transferencia']), 
        ];
    }
}