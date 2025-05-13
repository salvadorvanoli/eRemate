<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Model
{
    use HasApiTokens;

    protected $table = 'usuarios';

    protected $fillable = [
        'email',
        'contrasenia',
        'telefono',
        'tipo'
    ];

    public function rematador()
    {
        return $this->hasOne(Rematador::class);
    }

    public function casaDeRemates()
    {
        return $this->hasOne(CasaDeRemates::class);
    }

    public function usuarioRegistrado()
    {
        return $this->hasOne(UsuarioRegistrado::class);
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
