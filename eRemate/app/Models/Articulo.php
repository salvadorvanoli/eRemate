<?php

namespace App\Models;

use App\Enums\EstadoArticulo;
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
        'imagenes' => 'array',
        'estado' => EstadoArticulo::class,
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
