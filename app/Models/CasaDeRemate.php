<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CasaDeRemate extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'identificacionFiscal',
        'nombreLegal',
        'email'
    ];

    /**
     * Relación con los artículos que pertenecen a esta casa de remate.
     */
    public function articulos()
    {
        return $this->hasMany(Articulo::class);
    }
}