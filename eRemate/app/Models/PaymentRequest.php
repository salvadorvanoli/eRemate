<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'monto',
        'metodo_entrega',
        'chat_id',
        'usuario_registrado_id',
        'casa_de_remate_id',
        'estado'
    ];

    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }

    public function usuarioRegistrado()
    {
        return $this->belongsTo(UsuarioRegistrado::class);
    }

    public function casaDeRemate()
    {
        return $this->belongsTo(CasaDeRemates::class);
    }
}
