<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Articulo extends Model
{
    use HasFactory;

    protected $fillable = [
        'lote_id',
        'nombre',
        'imagenes',
        'especificacionesTecnicas',
        'estado',
        'categoria_id'
    ];

    protected $casts = [
        'imagenes' => 'array'
    ];

    public function lote()
    {
        return $this->belongsTo(Lote::class);
    }

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }
}
