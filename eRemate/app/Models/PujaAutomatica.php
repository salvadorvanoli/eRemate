<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PujaAutomatica extends Model
{
    use HasFactory;

    protected $fillable = [
        'presupuesto',
        'lote_id',
        'usuarioRegistrado_id'
    ];
    
    public function lote()
    {
        return $this->belongsTo(Lote::class);
    }

    public function usuarioRegistrado()
    {
        return $this->belongsTo(usuarioRegistrado::class);
    }
}