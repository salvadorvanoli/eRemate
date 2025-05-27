<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rematador extends Model
{
    protected $table = 'rematadores';
    protected $primaryKey = 'id';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'nombre',
        'apellido',
        'numeroMatricula',
        'direccionFiscal',
        'imagen'
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id', 'id');
    }

    public function casasDeRemates()
    {
        return $this->belongsToMany(CasaDeRemates::class, 'casa_remates_rematador', 'rematador_id', 'casaDeRemates_id');
    }

    public function subastas()
    {
        return $this->hasMany(Subasta::class);
    }
}
