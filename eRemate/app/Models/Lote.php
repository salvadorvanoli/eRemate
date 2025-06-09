<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Lote extends Model
{
    use HasFactory;

    protected $fillable = [
        'subasta_id',
        'compra_id',
        'ganador_id',
        'nombre',
        'descripcion',
        'valorBase',
        'pujaMinima',
        'oferta',
        'fechaUltimaPuja',
        'disponibilidad',
        'condicionesDeEntrega',
        'vendedorExterno'
    ];

    protected $casts = [
        'fechaUltimaPuja' => 'datetime',
        'vendedorExterno' => 'boolean'
    ];

    public function subasta()
    {
        return $this->belongsTo(Subasta::class);
    }

    public function compra()
    {
        return $this->belongsTo(Compra::class);
    }

    public function articulos()
    {
        return $this->hasMany(Articulo::class, 'lote_id');
    }

    public function pujas()
    {
        return $this->hasMany(Puja::class);
    }

    public function ganador()
    {
        return $this->belongsTo(UsuarioRegistrado::class, 'ganador_id');
    }

    public function usuariosInteresados()
    {
        return $this->belongsToMany(UsuarioRegistrado::class, 'lote_usuario_registrado')
                    ->withTimestamps();
    }

    public function calificacion()
    {
        return $this->hasOne(Calificacion::class);
    }

    public function ganadoresPotenciales()
    {
        return $this->hasMany(GanadorPotencial::class);
    }

    public function ganadorActual()
    {
        return $this->hasOne(GanadorPotencial::class)->where('es_ganador_actual', true);
    }

    public function siguienteGanadorPendiente()
    {
        return $this->hasOne(GanadorPotencial::class)
                ->where('estado', GanadorPotencial::ESTADO_PENDIENTE)
                ->orderBy('posicion');
    }
}
