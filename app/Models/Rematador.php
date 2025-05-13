<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rematador extends Model
{
    protected $table = 'rematadores';
    public $timestamps = false;

    protected $fillable = [
        'usuario_id',
        'nombre',
        'apellido',
        'numeroMatricula',
        'direccionFiscal',
        'imagen'
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class);
    }

    public function casasDeRemates()
    {
        return $this->belongsToMany(CasaDeRemates::class, 'casa_remates_rematador');
    }

    public function subastas()
    {
        return $this->hasMany(Subasta::class);
    }
}
