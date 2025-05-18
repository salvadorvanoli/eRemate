<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Articulo extends Model
{
    use HasFactory;

    protected $fillable = [
        'lote_id',
        'imagenes',
        'especificacionesTecnicas',
        'estado'
    ];

    protected $casts = [
        'imagenes' => 'array',
        'especificacionesTecnicas' => 'array',
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
