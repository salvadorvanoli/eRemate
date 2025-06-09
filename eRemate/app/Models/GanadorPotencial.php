<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GanadorPotencial extends Model
{
    protected $table = 'ganadores_potenciales';

    protected $fillable = [
        'lote_id',
        'usuario_registrado_id',
        'posicion',
        'estado',
        'fecha_notificacion',
        'fecha_respuesta',
        'es_ganador_actual'
    ];

    protected $casts = [
        'fecha_notificacion' => 'datetime',
        'fecha_respuesta' => 'datetime',
        'es_ganador_actual' => 'boolean'
    ];

    const ESTADO_PENDIENTE = 'pendiente';
    const ESTADO_ACEPTADO = 'aceptado';
    const ESTADO_RECHAZADO = 'rechazado';

    public function lote(): BelongsTo
    {
        return $this->belongsTo(Lote::class);
    }

    public function usuarioRegistrado(): BelongsTo
    {
        return $this->belongsTo(UsuarioRegistrado::class);
    }

    public function scopePendientes($query)
    {
        return $query->where('estado', self::ESTADO_PENDIENTE);
    }

    public function scopeAceptados($query)
    {
        return $query->where('estado', self::ESTADO_ACEPTADO);
    }

    public function scopeRechazados($query)
    {
        return $query->where('estado', self::ESTADO_RECHAZADO);
    }

    public function scopeGanadorActual($query)
    {
        return $query->where('es_ganador_actual', true);
    }
}
