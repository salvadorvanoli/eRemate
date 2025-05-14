<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Compra extends Model
{
    public $timestamps = false; 
    
    protected $fillable = [
        'id',
        'usuarioRegistrado_id',
        'factura_id'
    ];

    public function factura()
    {
        return $this->belongsTo(Factura::class);
    }

    public function usuarioRegistrado()
    {
        return $this->belongsTo(UsuarioRegistrado::class);
    }

    public function lote()
    {
        return $this->hasOne(Lote::class);
    }

    public function calificaciones()
    {
        return $this->hasMany(Calificacion::class);
    }

    public function compra()
    {
        return $this->hasOne(Compra::class, 'factura_id', 'id');
    }

}