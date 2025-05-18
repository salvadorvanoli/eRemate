<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Categoria extends Model
{
    protected $fillable = ['nombre', 'categoria_padre_id'];

    // Categoría padre
    public function padre()
    {
        return $this->belongsTo(Categoria::class, 'categoria_padre_id');
    }

    // Categorías hijas
    public function hijas()
    {
        return $this->hasMany(Categoria::class, 'categoria_padre_id');
    }
}