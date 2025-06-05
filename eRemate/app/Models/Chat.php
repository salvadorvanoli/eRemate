<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    use HasFactory;

    public $incrementing = false; // El ID no es auto-incremental
    protected $keyType = 'int'; // El tipo de la clave primaria

    protected $fillable = [
        'id',
        'usuarioRegistrado_id',
        'casa_de_remate_id'
    ];

    public function usuarioRegistrado()
    {
        return $this->belongsTo(UsuarioRegistrado::class);
    }

    public function casaDeRemates()
    {
        return $this->belongsTo(CasaDeRemates::class);
    }

    public function mensajes()
    {
        return $this->hasMany(Mensaje::class);
    }
}
