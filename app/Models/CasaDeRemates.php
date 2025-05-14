<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CasaDeRemates extends Model
{
    protected $table = 'casas_de_remates';
    public $timestamps = false;

    protected $fillable = [
        'usuario_id',
        'identificacionFiscal',
        'nombreLegal',
        'domicilio'
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class);
    }

    public function rematadores()
    {
        return $this->belongsToMany(Rematador::class, 'casa_remates_rematador');
    }

    public function chats()   
    {
        return $this->hasMany(Chat::class);
    }

    public function articulos()
    {
        return $this->hasMany(Articulo::class);
    }

    public function subastas()   
    {
        return $this->hasMany(Subasta::class);
    }
}
