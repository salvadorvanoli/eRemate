<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UsuarioRegistrado extends Model
{
    protected $table = 'usuarios_registrados';
    protected $primaryKey = 'id';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'nombre',
        'apellido', 
        'metodos_pago'
    ];

    protected $casts = [
        'metodos_pago' => 'array',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class);
    }

    public function calificaciones()
    {
        return $this->hasMany(Calificacion::class);
    }

    public function compras()   
    {
        return $this->hasMany(Compra::class, 'usuarioRegistrado_id');
    }

    public function chats()   
    {
        return $this->hasMany(Chat::class);
    }

    public function pujas()   
    {
        return $this->hasMany(Puja::class);
    } 

    public function pujasAutomaticas()   
    {
        return $this->hasMany(PujaAutomatica::class);
    }
     public function lotesFavoritos()
    {
        return $this->belongsToMany(Lote::class, 'lote_usuario_registrado', 'usuario_registrado_id', 'lote_id')
                    ->withTimestamps();
    }

    public function lotesGanados()
    {
        return $this->hasMany(Lote::class, 'ganador_id');
    }

    public function ganadoresPotenciales()
    {
        return $this->hasMany(GanadorPotencial::class);
    }

    public function lotesComoGanadorPotencial()
    {
        return $this->hasMany(GanadorPotencial::class);
    }

    public function lotesPendientesAceptacion()
    {
        return $this->hasMany(GanadorPotencial::class)
                    ->where('estado', GanadorPotencial::ESTADO_PENDIENTE);
    }
}
