<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mensaje extends Model
{
    use HasFactory;

    protected $fillable = [
        'contenido',
        'chat_id',
        'usuario_id'
    ];

    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class);
    }

}
