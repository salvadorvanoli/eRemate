<?php

namespace App\Models;

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
        'fechaInicio',
        'fechaCierre',
        'ubicacion'
    ];

    protected $casts = [
        'mensajes' => 'array',
        'fechaInicio' => 'datetime',
        'fechaCierre' => 'datetime',
    ];

    public function lotes()
    {
        return $this->hasMany(Lote::class);
    }

    /*
    public function rematador()
    {
        return $this->belongsTo(Rematador::class, 'rematador_id');
    }

    public function casaRemates()
    {
        return $this->belongsTo(CasaDeRemates::class, 'casaDeRemates_id');
    }
    */
}
