<?php

namespace App\Models;

use App\Enums\EstadoSubasta;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Subasta extends Model
{
    use HasFactory;

    protected $fillable = [
        'casaDeRemates_id',
        'rematador_id',
        'mensajes',
        'urlTransmision',
        'tipoSubasta',
        'estado',
        'pujaHabilitada',
        'fechaInicio',
        'fechaCierre',
        'ubicacion'
    ];

    protected $casts = [
        'mensajes' => 'array',
        'pujaHabilitada' => 'boolean',
        'fechaInicio' => 'datetime',
        'fechaCierre' => 'datetime',
        'estado' => EstadoSubasta::class,
    ];

    public function lotes()
    {
        return $this->hasMany(Lote::class);
    }

    public function loteActual()
    {
        return $this->hasOne(Lote::class, 'loteActual_id');
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
