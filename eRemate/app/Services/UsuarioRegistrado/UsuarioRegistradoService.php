<?php

namespace App\Services\UsuarioRegistrado;

use App\Models\UsuarioRegistrado;
use App\Enums\MetodoPago;
use Illuminate\Support\Facades\DB;

class UsuarioRegistradoService implements UsuarioRegistradoServiceInterface
{
    // Obtener métodos de pago registrados
    public function obtenerMetodosPago($id)
    {
        $usuario = UsuarioRegistrado::findOrFail($id);
        return $usuario->metodos_pago ?? [];
    }

    // Agregar un método de pago (si no existe ya)
    public function agregarMetodoPago($id, string $metodoPago)
    {
        if (!in_array($metodoPago, array_column(MetodoPago::cases(), 'value'))) {
            throw new \InvalidArgumentException('Método de pago inválido.');
        }

        $usuario = UsuarioRegistrado::findOrFail($id);
        $metodos = $usuario->metodos_pago ?? [];
        if (!in_array($metodoPago, $metodos)) {
            $metodos[] = $metodoPago;
            $usuario->metodos_pago = $metodos;
            $usuario->save();
        }
        return $usuario->metodos_pago;
    }

    // Obtener historial de compras
    public function obtenerHistorialCompras($id)
    {
        $usuario = UsuarioRegistrado::findOrFail($id);
        return $usuario->compras ?? [];
    }

    // Agregar un lote a los favoritos del usuario
    public function agregarLoteFavorito($usuarioId, $loteId)
    {
        try {
            $favoritoExistente = DB::table('lote_usuario_registrado')
                ->where('usuario_registrado_id', $usuarioId)
                ->where('lote_id', $loteId)
                ->exists();
            
            if ($favoritoExistente) {
                return ['error' => 'Este lote ya está en tus favoritos'];
            }
            
            DB::table('lote_usuario_registrado')->insert([
                'usuario_registrado_id' => $usuarioId,
                'lote_id' => $loteId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            return true;
        } catch (\Exception $e) {
            return ['error' => 'No se pudo agregar el lote a favoritos: ' . $e->getMessage()];
        }
    }

    // Quitar un lote de los favoritos del usuario
    public function quitarLoteFavorito($usuarioId, $loteId)
    {
        try {
            $resultado = DB::table('lote_usuario_registrado')
                ->where('usuario_registrado_id', $usuarioId)
                ->where('lote_id', $loteId)
                ->delete();
                
            if ($resultado == 0) {
                return ['error' => 'Este lote no está en tus favoritos'];
            }
            
            return true;
        } catch (\Exception $e) {
            return ['error' => 'No se pudo quitar el lote de favoritos: ' . $e->getMessage()];
        }
    }

    // Obtener todos los lotes favoritos de un usuario
    public function obtenerLotesFavoritos($usuarioId)
    {
        try {
            $lotesFavoritos = DB::table('lotes')
                ->join('lote_usuario_registrado', 'lotes.id', '=', 'lote_usuario_registrado.lote_id')
                ->where('lote_usuario_registrado.usuario_registrado_id', $usuarioId)
                ->select('lotes.*', 'lote_usuario_registrado.created_at as favorito_desde')
                ->get();
                
            return $lotesFavoritos;
        } catch (\Exception $e) {
            return ['error' => 'No se pudieron obtener los lotes favoritos: ' . $e->getMessage()];
        }
    }

    // Obtener lotes donde el usuario ha pujado
    public function obtenerLotesConPujas($usuarioId)
    {
        try {
            // Obtener los IDs de lotes donde el usuario ha pujado
            $loteIds = DB::table('pujas')
                ->where('usuarioRegistrado_id', $usuarioId)
                ->distinct()
                ->pluck('lote_id');
                
            // Obtener los lotes completos con sus subastas
            $lotes = DB::table('lotes')
                ->whereIn('id', $loteIds)
                ->get();
                
            // Obtener información de la puja más alta del usuario en cada lote
            // y verificar si es ganador
            foreach ($lotes as $lote) {
                $lote->puja_maxima = DB::table('pujas')
                    ->where('lote_id', $lote->id)
                    ->where('usuarioRegistrado_id', $usuarioId)
                    ->max('monto');
                    
                // Verificar si este usuario es el ganador del lote
                $lote->es_ganador = ($lote->ganador_id == $usuarioId);
            }
                    
            return $lotes;
        } catch (\Exception $e) {
            return ['error' => 'No se pudieron obtener los lotes con pujas: ' . $e->getMessage()];
        }
    }
}