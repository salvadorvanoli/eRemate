<?php


namespace App\Services\Lote;
use App\Models\CasaDeRemates;
use App\Models\Lote;
use App\Models\Usuario;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use App\Enums\EstadoSubasta;
use Illuminate\Support\Facades\DB;
use App\Models\GanadorPotencial;
use App\Models\Puja;

class LoteService implements LoteServiceInterface
{

    private function validarUsuario()
    {
        $usuarioAutenticado = Auth::user();

        if (!$usuarioAutenticado) {
            return response()->json(['error' => 'Token no proporcionado o inválido'], 401);
        }

        $usuario = Usuario::find($usuarioAutenticado->id);
        
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $casaDeRemates = CasaDeRemates::where('id', $usuarioAutenticado->id)->first();

        if (!$casaDeRemates) {
            return response()->json(['error' => 'No tienes permiso para acceder a esta información'], 403);
        }

        return $usuario;
    }

    private function verificarUsuario($usuario, $subasta)
    {
        $casaDeRemates = CasaDeRemates::where('id', $usuario->id)->first();

        $casaDeRematesSubasta = $subasta->casaRemates ?? null;

        if ($casaDeRemates && $casaDeRemates->id !== $casaDeRematesSubasta->id) {
            return response()->json(['error' => 'No tienes permiso para acceder a este lote'], 403);
        }

        return response()->json($usuario);
    }

    private function buscarLotePorId(int $id)
    {
        $lote = Lote::find($id);

        if (!$lote) {
            return response()->json([
                'success' => false,
                'error' => 'Lote no encontrado'
            ], 404);
        }

        return $lote;
    }

    public function crearLote(array $data): mixed
    {
        $usuario = $this->validarUsuario();

        if (!$usuario instanceof Usuario) {
            return $usuario;
        }

        $lote = Lote::where('subasta_id', $data['subasta_id'])
            ->where('nombre', $data['nombre'])
            ->first();

        // if ($lote) {
        //     return response()->json(
        //         [
        //             'success' => false,
        //             'error' => 'Ya existe un lote con ese nombre dentro de la subasta especificada'
        //         ],
        //         404
        //     );
        // }

        return Lote::create([
            'subasta_id' => $data['subasta_id'],
            'compra_id' => null,
            'ganador_id' => null,
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'],
            'valorBase' => $data['valorBase'],
            'pujaMinima' => $data['pujaMinima'],
            'disponibilidad' => $data['disponibilidad'],
            'condicionesDeEntrega' => $data['condicionesDeEntrega'],
            'vendedorExterno' => $data['vendedorExterno'] ?? false 
        ]);
    }

    public function obtenerLote(int $id)
    {
        return $this->buscarLotePorId($id);
    }

    public function actualizarLote(int $id, array $data): mixed
    {

        // $usuario = $this->validarUsuario();
        // if (!$usuario instanceof Usuario) {
        //     return $usuario;
        // }

        $lote = $this->buscarLotePorId($id);
        if (!$lote instanceof Lote) {
            return $lote;
        }

        // $chequeo = $this->verificarUsuario($usuario, $lote->subasta);
        // if ($chequeo instanceof JsonResponse) {
        //     return $chequeo;
        // }

        if ($lote->compra_id) {
            return response()->json([
                'success' => false,
                'error' => 'No se puede modificar un lote que ya tiene una compra asociada'
            ], 400);
        }

        if (isset($data['subasta_id'])) {
            unset($data['subasta_id']);
        }

        if (isset($data['ganador_id'])) {
            unset($data['ganador_id']);
        }

        if (isset($data['compra_id'])) {
            unset($data['compra_id']);
        }

        $lote->update($data);

        return Lote::find($id);
    }

    public function obtenerArticulos(int $id): mixed
    {
        $lote = Lote::find($id);

        if (!$lote) {
            return response()->json([
                'success' => false,
                'message' => 'Lote no encontrado'
            ], 404);
        }

        if ($lote->articulos()->count() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'No hay artículos para este lote'
            ], 404);
        }

        return $lote->articulos()->with('categoria')->get();
    }

    public function agregarArticulo(int $id, int $articuloId): mixed
    {
        // $usuario = $this->validarUsuario();
        // if (!$usuario instanceof Usuario) {
        //     return $usuario;
        // }
        
        $lote = $this->buscarLotePorId($id);
        if (!$lote instanceof Lote) {
            return $lote;
        }

        // $chequeo = $this->verificarUsuario($usuario, $lote->subasta);
        // if ($chequeo instanceof JsonResponse) {
        //     return $chequeo;
        // }

        $lote->articulos()->attach($articuloId);

        return response()->json([
            'success' => true,
            'message' => 'Artículo asignado correctamente'
        ], 200);
    }

    public function removerArticulo(int $id, int $articuloId): mixed
    {
        $usuario = $this->validarUsuario();
        if (!$usuario instanceof Usuario) {
            return $usuario;
        }

        $lote = Lote::find($id);

        if (!$lote) {
            return response()->json([
                'success' => false,
                'error' => 'Lote no encontrado'
            ], 404);
        }

        // Buscamos el artículo que pertenece a este lote específico
        $articulo = \App\Models\Articulo::where('id', $articuloId)
                                       ->where('lote_id', $id)
                                       ->first();
        
        if (!$articulo) {
            return response()->json([
                'success' => false,
                'error' => 'Artículo no encontrado en este lote'
            ], 404);
        }
        
        // Eliminamos el artículo directamente
        $articulo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Artículo eliminado correctamente'
        ], 200);
    }

    public function obtenerLotesPorSubasta(int $subastaId)
    {
        $lotes = Lote::where('subasta_id', $subastaId)->get();

        if ($lotes->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay lotes para esta subasta'
            ], 404);
        }

        return $lotes;
    }

    public function eliminarLote(int $id)
    {
        $lote = Lote::find($id);
        if (!$lote) {
            return response()->json([
                'success' => false,
                'message' => 'Lote no encontrado'
            ], 404);
        }
        $lote->delete();
        return response()->json([
            'success' => true,
            'message' => 'Lote eliminado correctamente'
        ]);
    }

    public function obtenerEstadoLote(int $loteId): array
    {
        try {
            $resultado = DB::table('lotes')
                ->join('subastas', 'lotes.subasta_id', '=', 'subastas.id')
                ->where('lotes.id', $loteId)
                ->select([
                    DB::raw('lotes.ganador_id IS NOT NULL as tieneGanador'),
                    DB::raw("
                        CASE 
                            WHEN subastas.estado IN ('pendiente', 'pendiente_aprobacion', 'aceptada') 
                            THEN true 
                            ELSE false 
                        END as esEditable
                    ")
                ])
                ->first();
                
            if (!$resultado) {
                return [
                    'success' => false,
                    'error' => 'Lote no encontrado'
                ];
            }
            
            return [
                'success' => true,
                'data' => [
                    'tieneGanador' => (bool) $resultado->tieneGanador,
                    'esEditable' => (bool) $resultado->esEditable
                ]
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Error al obtener estado del lote: ' . $e->getMessage()
            ];
        }
    }

    public function generarListaGanadoresPotenciales(int $loteId): mixed
    {
        try {
            $lote = $this->buscarLotePorId($loteId);
            if (!$lote instanceof Lote) {
                return $lote;
            }

            // Obtener las mejores pujas ordenadas por monto descendente
            $mejoresPujas = Puja::where('lote_id', $loteId)
                ->orderBy('cantidad', 'desc')
                ->orderBy('created_at', 'asc') // En caso de empate, gana el primero
                ->get()
                ->unique('usuario_registrado_id') // Un usuario solo puede aparecer una vez
                ->take(10); // Máximo 10 ganadores potenciales

            if ($mejoresPujas->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay pujas para este lote'
                ], 404);
            }

            // Limpiar ganadores potenciales existentes
            GanadorPotencial::where('lote_id', $loteId)->delete();

            // Crear lista de ganadores potenciales
            $ganadoresPotenciales = [];
            $posicion = 1;

            foreach ($mejoresPujas as $puja) {
                $ganadorPotencial = GanadorPotencial::create([
                    'lote_id' => $loteId,
                    'usuario_registrado_id' => $puja->usuario_registrado_id,
                    'posicion' => $posicion,
                    'estado' => GanadorPotencial::ESTADO_PENDIENTE,
                    'fecha_notificacion' => null,
                    'es_ganador_actual' => false
                ]);

                $ganadoresPotenciales[] = $ganadorPotencial;
                $posicion++;
            }

            // Notificar al primer ganador potencial
            $this->notificarSiguienteGanador($loteId);

            return response()->json([
                'success' => true,
                'message' => 'Lista de ganadores potenciales generada correctamente',
                'data' => $ganadoresPotenciales
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al generar lista de ganadores: ' . $e->getMessage()
            ], 500);
        }
    }

    public function aceptarLote(int $loteId, int $usuarioId): mixed
    {
        try {
            $ganadorPotencial = GanadorPotencial::where('lote_id', $loteId)
                ->where('usuario_registrado_id', $usuarioId)
                ->where('estado', GanadorPotencial::ESTADO_PENDIENTE)
                ->first();

            if (!$ganadorPotencial) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes una oferta pendiente para este lote'
                ], 404);
            }

            DB::beginTransaction();

            // Actualizar el registro del ganador potencial
            $ganadorPotencial->update([
                'estado' => GanadorPotencial::ESTADO_ACEPTADO,
                'fecha_respuesta' => now(),
                'es_ganador_actual' => true
            ]);

            // Actualizar el lote con el ganador confirmado
            $lote = Lote::find($loteId);
            $lote->update(['ganador_id' => $usuarioId]);

            // Marcar otros ganadores potenciales como no válidos
            GanadorPotencial::where('lote_id', $loteId)
                ->where('id', '!=', $ganadorPotencial->id)
                ->where('estado', GanadorPotencial::ESTADO_PENDIENTE)
                ->update(['estado' => GanadorPotencial::ESTADO_RECHAZADO]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Lote aceptado correctamente',
                'data' => $ganadorPotencial->load('lote', 'usuarioRegistrado')
            ], 200);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'error' => 'Error al aceptar lote: ' . $e->getMessage()
            ], 500);
        }
    }

    public function rechazarLote(int $loteId, int $usuarioId): mixed
    {
        try {
            $ganadorPotencial = GanadorPotencial::where('lote_id', $loteId)
                ->where('usuario_registrado_id', $usuarioId)
                ->where('estado', GanadorPotencial::ESTADO_PENDIENTE)
                ->first();

            if (!$ganadorPotencial) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes una oferta pendiente para este lote'
                ], 404);
            }

            // Marcar como rechazado
            $ganadorPotencial->update([
                'estado' => GanadorPotencial::ESTADO_RECHAZADO,
                'fecha_respuesta' => now()
            ]);

            // Notificar al siguiente ganador potencial
            $this->notificarSiguienteGanador($loteId);

            return response()->json([
                'success' => true,
                'message' => 'Lote rechazado. Se ha notificado al siguiente ganador potencial'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al rechazar lote: ' . $e->getMessage()
            ], 500);
        }
    }

    public function obtenerGanadoresPotenciales(int $loteId): mixed
    {
        try {
            $ganadoresPotenciales = GanadorPotencial::where('lote_id', $loteId)
                ->with(['usuarioRegistrado.usuario'])
                ->orderBy('posicion')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $ganadoresPotenciales
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al obtener ganadores potenciales: ' . $e->getMessage()
            ], 500);
        }
    }

    public function obtenerSiguienteGanadorPendiente(int $loteId): mixed
    {
        try {
            $siguienteGanador = GanadorPotencial::where('lote_id', $loteId)
                ->where('estado', GanadorPotencial::ESTADO_PENDIENTE)
                ->orderBy('posicion')
                ->with(['usuarioRegistrado.usuario'])
                ->first();

            if (!$siguienteGanador) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay más ganadores potenciales pendientes'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $siguienteGanador
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al obtener siguiente ganador: ' . $e->getMessage()
            ], 500);
        }
    }

    private function notificarSiguienteGanador(int $loteId): void
    {
        $siguienteGanador = GanadorPotencial::where('lote_id', $loteId)
            ->where('estado', GanadorPotencial::ESTADO_PENDIENTE)
            ->orderBy('posicion')
            ->first();

        if ($siguienteGanador) {
            $siguienteGanador->update([
                'fecha_notificacion' => now()
            ]);

            // Aquí puedes agregar lógica de notificación (email, push, etc.)
            // Por ejemplo: Mail::to($siguienteGanador->usuarioRegistrado->usuario->email)->send(new NotificacionGanador($siguienteGanador));
        }
    }

}
