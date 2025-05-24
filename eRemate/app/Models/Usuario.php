<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class Usuario extends Model
{
    use HasApiTokens;
    use Notifiable;


    protected $table = 'usuarios';

    protected $fillable = [
        'email',
        'contrasenia',
        'telefono',
        'tipo',
        'google_id',
        'perfil_completo'
    ];

    public function usuarioRegistrado()
    {
        return $this->hasOne(UsuarioRegistrado::class, 'id', 'id');
    }

    public function rematador()
    {
        return $this->hasOne(Rematador::class, 'id', 'id');
    }

    public function casaDeRemates()
    {
        return $this->hasOne(CasaDeRemates::class, 'id', 'id');
    }

    public function esRematador()
    {
        return $this->tipo === 'rematador';
    }

    public function esCasaDeRemates()
    {
        return $this->tipo === 'casa';
    }

    public function esUsuarioRegistrado()
    {
        return $this->tipo === 'registrado';
    }
}
