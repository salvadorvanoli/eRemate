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
use Illuminate\Support\Facades\Log;  
use App\Models\Chat;

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
            \Log::info("=== INICIO generarListaGanadoresPotenciales ===", ['lote_id' => $loteId]);
            
            // 1. Buscar el lote
            \Log::info("Paso 1: Buscando lote", ['lote_id' => $loteId]);
            $lote = $this->buscarLotePorId($loteId);
            
            if (!$lote instanceof Lote) {
                \Log::error("Error: Lote no encontrado o no es instancia de Lote", [
                    'lote_id' => $loteId,
                    'lote_type' => gettype($lote)
                ]);
                return $lote;
            }
            
            \Log::info("Paso 1 ✅: Lote encontrado", [
                'lote_id' => $lote->id,
                'lote_nombre' => $lote->nombre ?? 'Sin nombre'
            ]);

            // 2. Obtener pujas
            \Log::info("Paso 2: Obteniendo pujas para el lote", ['lote_id' => $loteId]);
            
            $pujas = Puja::where('lote_id', $loteId)
                ->orderBy('created_at', 'desc')
                ->get();

            \Log::info("Paso 2 ✅: Pujas obtenidas", [
                'cantidad_pujas' => $pujas->count(),
                'primera_puja_id' => $pujas->first()->id ?? 'No hay pujas',
                'primera_puja_usuario' => $pujas->first()->usuarioRegistrado_id ?? 'N/A'  
            ]);

            if ($pujas->isEmpty()) {
                \Log::warning("No hay pujas para este lote", ['lote_id' => $loteId]);
                return response()->json([
                    'success' => false,
                    'message' => 'No hay pujas para este lote'
                ], 404);
            }

            
            \Log::info("Paso 3: Inicializando variables");
            $usuariosEncontrados = [];
            $ganadoresPotenciales = [];
            $posicion = 1;

        
            \Log::info("Paso 4: Limpiando ganadores potenciales existentes", ['lote_id' => $loteId]);
            
            $deletedCount = GanadorPotencial::where('lote_id', $loteId)->count();
            GanadorPotencial::where('lote_id', $loteId)->delete();
            
            \Log::info("Paso 4 ✅: Ganadores potenciales eliminados", [
                'eliminados' => $deletedCount
            ]);

            
            \Log::info("Paso 5: Procesando pujas", ['total_pujas' => $pujas->count()]);
            
            foreach ($pujas as $index => $puja) {
                \Log::info("Procesando puja", [
                    'puja_index' => $index,
                    'puja_id' => $puja->id,
                    'usuario_id' => $puja->usuarioRegistrado_id,  
                    'monto' => $puja->monto ?? 'Sin monto',
                    'fecha' => $puja->created_at
                ]);

            
                if (is_null($puja->usuarioRegistrado_id)) {
                    \Log::warning("Puja ignorada por usuarioRegistrado_id null", [
                        'puja_id' => $puja->id,
                        'lote_id' => $loteId
                    ]);
                    continue; 
                }

                
                if (!in_array($puja->usuarioRegistrado_id, $usuariosEncontrados)) { 
                    \Log::info("Usuario único encontrado", [
                        'usuario_id' => $puja->usuarioRegistrado_id,  
                        'posicion' => $posicion
                    ]);
                    
                    $usuariosEncontrados[] = $puja->usuarioRegistrado_id; 
                    
                    // 6. Crear ganador potencial
                    \Log::info("Paso 6: Creando ganador potencial", [
                        'lote_id' => $loteId,
                        'usuario_id' => $puja->usuarioRegistrado_id,  
                        'posicion' => $posicion,
                        'es_ganador_actual' => $posicion === 1
                    ]);

                    try {
                        $ganadorPotencial = GanadorPotencial::create([
                            'lote_id' => $loteId,
                            'usuario_registrado_id' => $puja->usuarioRegistrado_id,  
                            'posicion' => $posicion,
                            'estado' => GanadorPotencial::ESTADO_PENDIENTE,
                            'fecha_notificacion' => $posicion === 1 ? now() : null,
                            'es_ganador_actual' => $posicion === 1
                        ]);

                        \Log::info("Paso 6 ✅: Ganador potencial creado", [
                            'ganador_id' => $ganadorPotencial->id,
                            'posicion' => $posicion
                        ]);

                        $ganadoresPotenciales[] = $ganadorPotencial;
                        $posicion++;
                        
                    } catch (\Exception $e) {
                        \Log::error("ERROR al crear ganador potencial", [
                            'lote_id' => $loteId,
                            'usuario_id' => $puja->usuarioRegistrado_id,  
                            'posicion' => $posicion,
                            'error' => $e->getMessage(),
                            'line' => $e->getLine()
                        ]);
                        throw $e;
                    }
                    
                    // Límite de 10 ganadores
                    if ($posicion > 10) {
                        \Log::info("Límite de 10 ganadores alcanzado, terminando");
                        break;
                    }
                } else {
                    \Log::info("Usuario ya procesado, saltando", [
                        'usuario_id' => $puja->usuarioRegistrado_id  
                    ]);
                }
            }

            \Log::info("=== FIN generarListaGanadoresPotenciales ===", [
                'total_ganadores_creados' => count($ganadoresPotenciales),
                'usuarios_unicos' => count($usuariosEncontrados)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Lista de ganadores potenciales generada correctamente',
                'data' => $ganadoresPotenciales
            ], 200);

        } catch (\Exception $e) {
            \Log::error('ERROR CRÍTICO en generarListaGanadoresPotenciales', [
                'lote_id' => $loteId,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Error al generar lista de ganadores: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function aceptarLote(int $loteId, int $usuarioId): mixed
    {
        try {
            DB::beginTransaction();
            
            $ganadorPotencial = GanadorPotencial::where('lote_id', $loteId)
                ->where('usuario_registrado_id', $usuarioId)
                ->where('estado', GanadorPotencial::ESTADO_PENDIENTE)
                ->first();

            if (!$ganadorPotencial) {
                DB::rollback();
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes una oferta pendiente para este lote'
                ], 404);
            }

           
            $ganadorPotencial->update([
                'estado' => GanadorPotencial::ESTADO_ACEPTADO,
                'fecha_respuesta' => now()
            ]);

            
            $lote = Lote::with('subasta')->find($loteId);
            
            if ($lote) {
                $lote->update([
                    'ganador_id' => $usuarioId
                ]);

                \Log::info("Lote actualizado con ganador", [
                    'lote_id' => $loteId,
                    'ganador_id' => $usuarioId
                ]);

                
                if ($lote->subasta) {
                    Chat::updateOrCreate(
                        ['id' => $loteId], 
                        [
                            'usuarioRegistrado_id' => $usuarioId,
                            'casa_de_remate_id' => $lote->subasta->casaDeRemates_id
                        ]
                    );

                    \Log::info("Chat creado al aceptar lote", [
                        'lote_id' => $loteId,
                        'usuario_id' => $usuarioId,
                        'casa_remate_id' => $lote->subasta->casaDeRemates_id
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Lote aceptado correctamente. Se ha creado el chat para coordinar la entrega.'
            ], 200);

        } catch (\Exception $e) {
            DB::rollback();
            \Log::error('Error al aceptar lote', [
                'lote_id' => $loteId,
                'usuario_id' => $usuarioId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Error al aceptar lote: ' . $e->getMessage()
            ], 500);
        }
    }

    public function rechazarLote(int $loteId, int $usuarioId): mixed
    {
        try {
            DB::beginTransaction();
        
            $ganadorPotencial = GanadorPotencial::where('lote_id', $loteId)
                ->where('usuario_registrado_id', $usuarioId)
                ->where('estado', GanadorPotencial::ESTADO_PENDIENTE)
                ->first();

            if (!$ganadorPotencial) {
                DB::rollback();
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes una oferta pendiente para este lote'
                ], 404);
            }

            
            $ganadorPotencial->update([
                'estado' => GanadorPotencial::ESTADO_RECHAZADO,
                'fecha_respuesta' => now(),
                'es_ganador_actual' => false  
            ]);

            
            $siguienteGanador = GanadorPotencial::where('lote_id', $loteId)
                ->where('estado', GanadorPotencial::ESTADO_PENDIENTE)
                ->where('posicion', '>', $ganadorPotencial->posicion)
                ->orderBy('posicion')
                ->first();

            if ($siguienteGanador) {
                
                $siguienteGanador->update([
                    'es_ganador_actual' => true,  
                    'fecha_notificacion' => now()
                ]);

                \Log::info("Siguiente ganador potencial activado", [
                    'lote_id' => $loteId,
                    'usuario_rechazado' => $usuarioId,
                    'siguiente_usuario' => $siguienteGanador->usuario_registrado_id,
                    'posicion' => $siguienteGanador->posicion
                ]);
            } else {
                \Log::info("No hay más ganadores potenciales disponibles", [
                    'lote_id' => $loteId,
                    'usuario_rechazado' => $usuarioId
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $siguienteGanador 
                    ? 'Lote rechazado. Se ha notificado al siguiente ganador potencial'
                    : 'Lote rechazado. No hay más ganadores potenciales disponibles'
            ], 200);

        } catch (\Exception $e) {
            DB::rollback();
            \Log::error('Error al rechazar lote', [
                'lote_id' => $loteId,
                'usuario_id' => $usuarioId,
                'error' => $e->getMessage()
            ]);
        
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

           
        }
    }

    public function obtenerUltimaPuja($id)
    {
        try {
            $lote = Lote::findOrFail($id);
            
            $ultimaPuja = \App\Models\Puja::where('lote_id', $id)
            ->orderBy('id', 'desc')
            ->first();
            
            $valorActual = $ultimaPuja ?? 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'lote_id' => $id,
                    'valor_actual' => $valorActual,
                    'es_valor_base' => $ultimaPuja === null
                ],
                'message' => 'Valor actual del lote obtenido correctamente'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lote no encontrado'
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener valor actual del lote: ' . $e->getMessage()
            ], 500);
        }
    }
}
