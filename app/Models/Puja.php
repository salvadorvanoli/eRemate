<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Puja extends Model
{
    use HasFactory;

    protected $fillable = [
        'monto',
        'lote_id',
        'usuarioRegistrado_id'
    ];

    public function lotes()
    {
        return $this->belongsTo(Lote::class);
    }

    public function usuarioRegistrado()
    {
        return $this->belongsTo(UsuarioRegistrado::class);
    }
}
