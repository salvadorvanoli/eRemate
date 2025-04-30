<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Subasta extends Model
{
    use HasFactory;

    protected $fillable = [
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
}
