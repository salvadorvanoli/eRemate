<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Calificacion extends Model
{
    protected $table = 'calificaciones';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'puntaje',
        'usuarioRegistrado_id',
        'lote_id'  
    ];

    public function usuarioRegistrado()
    {
        return $this->belongsTo(UsuarioRegistrado::class);
    }

    public function lote()  
    {
        return $this->belongsTo(Lote::class);
    }
}
