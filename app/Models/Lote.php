<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Lote extends Model
{
    use HasFactory;

    protected $fillable = [
        'subasta_id',
        'compra_id',
        'nombre',
        'descripcion',
        'valorBase',
        'pujaMinima',
        'disponibilidad',
        'condicionesDeEntrega'
    ];

    public function subasta()
    {
        return $this->belongsTo(Subasta::class);
    }

    public function compra()
    {
        return $this->belongsTo(Compra::class);
    }

    public function articulos()
    {
        return $this->hasMany(Articulo::class);
    }

    /*
    public function pujas()
    {
        return $this->hasMany(Puja::class);
    }
    */
}
