<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Enums\MetodoPago;

class Factura extends Model
{
    use HasFactory;

    public $timestamps = false; 

    protected $fillable = [
        
        'id',
        'monto',
        'metodoEntrega',
        'metodoPago'
    ];

    public function compra()
    {
        return $this->hasOne(Compra::class, 'factura_id', 'id');
    }

    protected $casts = [
        'metodoPago' => MetodoPago::class
    ];
}


