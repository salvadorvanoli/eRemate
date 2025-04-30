<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Factura extends Model
{
    use HasFactory;

    protected $fillable = [
        
        'id',
        'monto',
        'metodoEntrega',
        'metodoPago'
    ];

    public function compra()
{
    return $this->hasOne(Compra::class);
}
}


