<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Calificacion extends Model
{

    protected $fillable = [
        
        'id',
        'puntaje',
        'usuarioRegistrado_id',
        'compra_id'
    ];

    public function usuarioRegistrado()
    {
        return $this->belongsTo(UsuarioRegistrado::class);
    }

    public function compra()
    {
        return $this->belongsTo(Compra::class);
    }

}
