<?php

namespace Database\Factories;

use App\Models\Compra;
use App\Models\Factura;
use App\Models\UsuarioRegistrado;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompraFactory extends Factory
{
    protected $model = Compra::class;

    public function definition(): array
    {
        return [
            'factura_id' => Factura::factory() 
        ];
    }
}