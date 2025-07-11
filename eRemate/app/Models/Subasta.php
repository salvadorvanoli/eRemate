<?php

namespace App\Models;

use App\Enums\EstadoSubasta;
use App\Enums\TipoSubasta;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Subasta extends Model
{
    use HasFactory;

    protected $fillable = [
        'casaDeRemates_id',
        'rematador_id',
        'loteActual_id',
        'mensajes',
        'urlTransmision',
        'tipoSubasta',
        'estado',
        'fechaInicio',
        'fechaCierre',
        'ubicacion'
    ];

    protected $casts = [
        'mensajes' => 'array',
        'fechaInicio' => 'datetime',
        'fechaCierre' => 'datetime',
        'estado' => EstadoSubasta::class,
        'tipoSubasta' => TipoSubasta::class,
    ];

    public function lotes()
    {
        return $this->hasMany(Lote::class);
    }

    public function loteActual()
    {
        return $this->belongsTo(Lote::class, 'loteActual_id');
    }

    public function rematador()
    {
        return $this->belongsTo(Rematador::class, 'rematador_id');
    }

    public function casaRemates()
    {
        return $this->belongsTo(CasaDeRemates::class, 'casaDeRemates_id');
    }


}
