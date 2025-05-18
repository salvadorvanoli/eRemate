<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PujaAutomatica extends Model
{
    use HasFactory;

    protected $fillable = [
        'presupuesto',
        'subasta_id',
        'usuarioRegistrado_id',
        'puja_id'
    ];

    
    public function subasta()
    {
        return $this->belongsTo(Subasta::class);
    }

    public function usuarioRegistrado()
    {
        return $this->belongsTo(usuarioRegistrado::class);
    }

    public function puja()
    {
        return $this->belongsTo(Puja::class);
    }
}