<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Articulo extends Model
{
    use HasFactory;

    protected $fillable = [
        'imagenes',
        'especificacionesTecnicas',
        'valorBase',
        'pujaMinima',
        'disponibilidad',
        'condicionesDeEntrega',
        'casa_de_remate_id',
    ];

    /**
     * Relación con la casa de remates que vende el artículo.
     */
    public function casaDeRemate()
    {
        return $this->belongsTo(CasaDeRemate::class);
    }
}