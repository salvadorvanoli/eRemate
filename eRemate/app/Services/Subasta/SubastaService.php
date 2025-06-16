<?php


namespace App\Services\Subasta;
use App\Models\PujaAutomatica;
use App\Models\Subasta;
use App\Models\CasaDeRemates;
use App\Models\Usuario;
use App\Models\Rematador;
use App\Enums\EstadoSubasta;
use App\Models\UsuarioRegistrado;
use App\Models\Lote;
use App\Models\Chat;
use App\Events\NuevaPujaEvent;
use App\Events\InicioSubastaEvent;
use App\Events\CierreSubastaEvent;
use App\Events\ActualizacionUrlTransmision;
use App\Jobs\ProcesarPujasAutomaticas;
use App\Notifications\ComienzoSubastaNotification;
use App\Notifications\NuevaPujaNotification;
use App\Notifications\SubastaFinalizadaNotification;
use App\Notifications\UmbralOfertaNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use App\Services\Lote\LoteServiceInterface;
use App\Models\GanadorPotencial;
use Illuminate\Support\Facades\Log; 

class SubastaService implements SubastaServiceInterface
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

        $usuarioEspecifico = null;

        if ($usuario->tipo === 'rematador') {
            $usuarioEspecifico = Rematador::where('id', $usuarioAutenticado->id)->first();
        } else if ($usuario->tipo === 'casa') {
            $usuarioEspecifico = CasaDeRemates::where('id', $usuarioAutenticado->id)->first();
        } else {
            $usuarioEspecifico = UsuarioRegistrado::where('id', $usuarioAutenticado->id)->first();
        }

        if (!$usuarioEspecifico) {
            return response()->json(['error' => 'No tienes permiso para acceder a esta información'], 403);
        }

        return $usuario;
    }
    
    private function verificarUsuario($usuario, $subasta)
    {
        $usuarioEspecifico = null;
        $subastaUsuario  = null;
        
        if ($usuario->tipo === 'rematador') {
            $usuarioEspecifico = Rematador::where('id', $usuario->id)->first();
            $subastaUsuario = $subasta->rematador ?? null;
        } else {
            $usuarioEspecifico = CasaDeRemates::where('id', $usuario->id)->first();
            $subastaUsuario = $subasta->casaRemates ?? null;
        }

        if (($usuarioEspecifico && $usuarioEspecifico->id !== $subastaUsuario?->id)) {
            return response()->json(['error' => 'No tienes permiso para acceder a esta subasta'], 403);
        }

        return $usuario;
    }

    private function buscarSubastaPorId($id)
    {
        $subasta = Subasta::find($id);

        if (!$subasta) {
            return response()->json([
                'success' => false,
                'message' => 'Subasta no encontrada'
            ], 404);
        }

        return $subasta;
    }
    
    public function crearSubasta(array $data): mixed
    {
        $usuario = $this->validarUsuario();
        
        if (!$usuario instanceof Usuario) {
            return $usuario;
        }

        $casaDeRemates = CasaDeRemates::where('id', $usuario->id)->first();
        
        if (!$casaDeRemates) {
            return response()->json([
                'success' => false,
                'error' => 'La casa de remates especificada no existe.'
            ], 422);
        }

        $casaDeRematesId = $data['casaDeRemates_id'];

        $casaDeRematesExistente = CasaDeRemates::find($casaDeRematesId);
        if (!$casaDeRematesExistente) {
            return response()->json([
                'success' => false,
                'error' => 'La casa de remates especificada no existe.'
            ], 404);
        }

        if (isset($data['rematador_id']) && $data['rematador_id'] !== null) {
            if ($casaDeRematesExistente) {
                $rematadorPertenece = $casaDeRematesExistente->rematadores()->where('rematador_id', $data['rematador_id'])->exists();
                
                if (!$rematadorPertenece) {
                    return response()->json([
                        'success' => false,
                        'error' => 'El rematador especificado no pertenece a esta casa de remates'
                    ], 422);
                }
            } 
        }

        return Subasta::create([
            'casaDeRemates_id' => $casaDeRematesId,
            'rematador_id' => $data['rematador_id'] ?? null,
            'mensajes' => $data['mensajes'] ?? [],
            'urlTransmision' => $data['urlTransmision'],
            'tipoSubasta' => $data['tipoSubasta'],
            'estado' => EstadoSubasta::PENDIENTE_APROBACION,
            'fechaInicio' => $data['fechaInicio'],
            'fechaCierre' => $data['fechaCierre'],
            'ubicacion' => $data['ubicacion']
        ]);
    }
    
    public function obtenerSubasta(int $id) 
    {
        return $this->buscarSubastaPorId($id);
    }
    
    public function actualizarSubasta(int $id, array $data): mixed
    {
        $usuario = $this->validarUsuario();
        if (!$usuario instanceof Usuario) {
            return $usuario;
        }
        
        $subasta = $this->buscarSubastaPorId($id);
        if (!$subasta instanceof Subasta) {
            return $subasta;
        }

        $chequeo = $this->verificarUsuario($usuario, $subasta);
        if ($chequeo instanceof JsonResponse) {
            return $chequeo;
        }

        if (!in_array($subasta->estado, [EstadoSubasta::PENDIENTE, EstadoSubasta::PENDIENTE_APROBACION, EstadoSubasta::ACEPTADA])) {
            return response()->json([
            'success' => false,
            'error' => 'No se puede modificar una subasta que no está en estado pendiente, pendiente de aprobación o aceptada'
            ], 422);
        }
        
        if (isset($data['rematador_id']) && $data['rematador_id'] !== null) {
            $casaDeRemates = CasaDeRemates::find($subasta->casaDeRemates_id);
            if ($casaDeRemates) {
                $rematadorPertenece = $casaDeRemates->rematadores()->where('id', $data['rematador_id'])->exists();
                
                if (!$rematadorPertenece) {
                    return response()->json([
                        'success' => false,
                        'error' => 'El rematador especificado no pertenece a la casa de remates de esta subasta'
                    ], 422);
                }
            } else {
                return response()->json([
                    'success' => false,
                    'error' => 'La subasta no tiene una casa de remates asociada'
                ], 422);
            }
        }
        
        if (isset($data['id'])) {
            unset($data['id']);
        }
        
        if (isset($data['casaDeRemates_id'])) {
            unset($data['casaDeRemates_id']);
        }
        
        if (isset($data['estado'])) {
            unset($data['estado']);
        }

        if ($subasta->urlTransmision !== $data['urlTransmision']) {
            $actualizacionUrlTransmisionData = [
                'subasta_id' => $subasta->id,
                'urlTransmision' => $data['urlTransmision']
            ];
            event(new ActualizacionUrlTransmision($actualizacionUrlTransmisionData));
        }

        $subasta->update($data);

        return Subasta::find($id);
    }
    
    public function obtenerSubastas() 
    {
        $subastas = Subasta::all();

        if (!$subastas || $subastas->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay subastas disponibles'
            ], 404);
        }

        return $subastas;
    }

    public function obtenerSubastasOrdenadas() 
    {
        $subastas = Subasta::whereNotIn('estado', [EstadoSubasta::CANCELADA, EstadoSubasta::CERRADA])
            ->with(['lotes.articulos', 'lotes' => function ($query) {
                $query->select('id', 'subasta_id', 'nombre');
            }])
            ->orderBy('fechaInicio', 'asc')
            ->get();

        if ($subastas->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay subastas disponibles'
            ], 404);
        }

        $catalogElements = $subastas->map(function ($subasta) {
            $loteIds = $subasta->lotes->pluck('id')->toArray();
            $totalLotes = count($loteIds);
            
            $imagen = null;
            if ($subasta->loteActual_id) {
                $loteActual = $subasta->lotes->firstWhere('id', $subasta->loteActual_id);
                if ($loteActual && $loteActual->articulos->isNotEmpty() && !empty($loteActual->articulos[0]->imagenes)) {
                    $imagenes = is_string($loteActual->articulos[0]->imagenes) ? 
                        json_decode($loteActual->articulos[0]->imagenes, true) : 
                        $loteActual->articulos[0]->imagenes;
                    $imagen = is_array($imagenes) && !empty($imagenes) ? $imagenes[0] : null;
                }
            }
            
            if (!$imagen && $subasta->lotes->isNotEmpty() && $subasta->lotes[0]->articulos->isNotEmpty() && !empty($subasta->lotes[0]->articulos[0]->imagenes)) {
                $primerLote = $subasta->lotes[0];
                $imagenes = is_string($primerLote->articulos[0]->imagenes) ? 
                    json_decode($primerLote->articulos[0]->imagenes, true) : 
                    $primerLote->articulos[0]->imagenes;
                $imagen = is_array($imagenes) && !empty($imagenes) ? $imagenes[0] : null;
            }

            return [
                'id' => $subasta->id,
                'imagen' => $imagen,
                'lotes' => $loteIds,
                'lote_id' => $subasta->loteActual_id,
                'subasta_id' => $subasta->id,
                'etiqueta' => strtoupper($subasta->estado->name),
                'texto1' => strtoupper($subasta->tipoSubasta->value),
                'texto2' => strtoupper($subasta->ubicacion),
                'texto3' => "{$totalLotes} LOTES EN TOTAL",
                'fechaInicio' => $subasta->fechaInicio,
                'fechaCierre' => $subasta->fechaCierre
            ];
        });
        
        return $catalogElements;
    }

    public function obtenerSubastasFiltradas(array $data)
    {
        $query = Subasta::query()
            ->with(['lotes.articulos', 'lotes' => function ($query) {
                $query->select('id', 'subasta_id', 'nombre');
            }]);

        $textoBusqueda = (isset($data['textoBusqueda']) && $data['textoBusqueda'] !== null && $data['textoBusqueda'] !== "null") ? $data['textoBusqueda'] : null;
        $cerrada = (isset($data['cerrada']) && $data['cerrada'] !== null && is_bool($data['cerrada'])) ? $data['cerrada'] : false;
        $categoria = (isset($data['categoria']) && $data['categoria'] !== null && $data['categoria'] !== "null") ? $data['categoria'] : null;
        $ubicacion = (isset($data['ubicacion']) && $data['ubicacion'] !== null && $data['ubicacion'] !== "null") ? $data['ubicacion'] : null;
        $fechaCierreLimite = (isset($data['fechaCierreLimite']) && $data['fechaCierreLimite'] !== null && $data['fechaCierreLimite'] !== "null") ? $data['fechaCierreLimite'] : null;

        if ($textoBusqueda) {
            $query->where(function($q) use ($textoBusqueda) {
                $q->where('tipoSubasta', 'like', "%{$textoBusqueda}%")
                  ->orWhere('ubicacion', 'like', "%{$textoBusqueda}%");
            });
        }

        if ($cerrada) {
            $query->where('estado', EstadoSubasta::CERRADA);
        } else {
            $query->whereNotIn('estado', [EstadoSubasta::CANCELADA, EstadoSubasta::CERRADA]);
        }

        if ($categoria) {
            $query->whereHas('lotes.articulos', function($q) use ($categoria) {
                $q->where('categoria_id', $categoria); 
            });
        }

        if ($ubicacion) {
            $query->where('ubicacion', $ubicacion);
        }

        if ($fechaCierreLimite) {
            $query->where('fechaCierre', '<=', $fechaCierreLimite);
        }

        $query->orderBy('fechaCierre', 'asc');

        $subastas = $query->get();

        if ($subastas->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay subastas disponibles con los filtros aplicados'
            ], 404);
        }

        $catalogElements = $subastas->map(function ($subasta) {
            $loteIds = $subasta->lotes->pluck('id')->toArray();
            $totalLotes = count($loteIds);
            
            $imagen = null;
            if ($subasta->loteActual_id) {
                $loteActual = $subasta->lotes->firstWhere('id', $subasta->loteActual_id);
                if ($loteActual && $loteActual->articulos->isNotEmpty() && !empty($loteActual->articulos[0]->imagenes)) {
                    $imagenes = is_string($loteActual->articulos[0]->imagenes) ? 
                        json_decode($loteActual->articulos[0]->imagenes, true) : 
                        $loteActual->articulos[0]->imagenes;
                    $imagen = is_array($imagenes) && !empty($imagenes) ? $imagenes[0] : null;
                }
            }
            
            if (!$imagen && $subasta->lotes->isNotEmpty() && $subasta->lotes[0]->articulos->isNotEmpty() && !empty($subasta->lotes[0]->articulos[0]->imagenes)) {
                $primerLote = $subasta->lotes[0];
                $imagenes = is_string($primerLote->articulos[0]->imagenes) ? 
                    json_decode($primerLote->articulos[0]->imagenes, true) : 
                    $primerLote->articulos[0]->imagenes;
                $imagen = is_array($imagenes) && !empty($imagenes) ? $imagenes[0] : null;
            }

            return [
                'id' => $subasta->id,
                'imagen' => $imagen,
                'lotes' => $loteIds,
                'lote_id' => $subasta->loteActual_id,
                'subasta_id' => $subasta->id,
                'etiqueta' => strtoupper($subasta->estado->name),
                'texto1' => strtoupper($subasta->tipoSubasta->value),
                'texto2' => strtoupper($subasta->ubicacion),
                'texto3' => "{$totalLotes} LOTES EN TOTAL",
                'fechaInicio' => $subasta->fechaInicio,
                'fechaCierre' => $subasta->fechaCierre
            ];
        });
        
        return $catalogElements;
    }

    public function obtenerUbicaciones()
    {
        $ubicaciones = Subasta::select('ubicacion')
            ->whereNotNull('ubicacion')
            ->distinct()
            ->orderBy('ubicacion', 'asc')
            ->pluck('ubicacion')
            ->toArray();
        
        if (empty($ubicaciones)) {
            return response()->json([
                'success' => false,
                'message' => 'No hay ubicaciones disponibles'
            ], 404);
        }
        
        return $ubicaciones;
    }

    public function obtenerDatosParaMapa()
    {
        $datosOptimizados = Subasta::select('id', 'ubicacion', 'tipoSubasta', 'estado')
            ->where(function($query) {
                $query->whereNotNull('ubicacion')
                      ->where('ubicacion', '!=', '')
                      ->whereNotIn('estado', [EstadoSubasta::CERRADA, EstadoSubasta::CANCELADA]);
            })
            ->get()
            ->map(function ($subasta) {
                return [
                    'id' => $subasta->id,
                    'ubicacion' => $subasta->ubicacion,
                    'tipoSubasta' => $subasta->tipoSubasta,
                    'estado' => $subasta->estado
                ];
            })
            ->filter(function ($item) {
                return !empty($item['ubicacion']) && 
                       trim($item['ubicacion']) !== '' &&
                       strtolower($item['ubicacion']) !== 'null' &&
                       strtolower($item['ubicacion']) !== 'undefined';
            })
            ->values();
        
        if ($datosOptimizados->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay subastas con ubicación disponible'
            ], 404);
        }
        
        return $datosOptimizados->toArray();
    }

    public function obtenerSubastasOrdenadasPorCierre($pagina = 1, $cantidad = 10)
    {
        $subastas = Subasta::where('fechaCierre', '>', now())
            ->orderBy('fechaCierre', 'asc')
            ->paginate($cantidad, ['*'], 'page', $pagina);


        if ($subastas->total() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'No hay subastas disponibles'
            ], 404);
        }

        return $subastas;
    }

    public function obtenerLotes(int $id)
    {
        $subasta = $this->buscarSubastaPorId($id);
        if (!$subasta instanceof Subasta) {
            return $subasta;
        }

        if ($subasta->lotes()->count() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'No hay lotes asociados a esta subasta'
            ], 404);
        }

        return $subasta->lotes;
    }

    public function iniciarSubasta(int $id)
    {
        $subasta = $this->buscarSubastaPorId($id);
        if (!$subasta instanceof Subasta) {
            return $subasta;
        }

        if ($subasta->estado !== EstadoSubasta::ACEPTADA) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden iniciar subastas en estado aceptada'
            ], 422);
        }

        $fechaActual = now();
        $fechaInicio = $subasta->fechaInicio;
        $diferencia = $fechaInicio->diffInMinutes($fechaActual, true);
        if ($diferencia > 15) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede iniciar la subasta a más de 15 minutos de su fecha de inicio'
            ], 422);
        }

        $primerLote = $subasta->lotes()->first();
        if (!$primerLote) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontraron lotes asociados a esta subasta'
            ], 404);
        }

        $subasta->update([
            'estado' => EstadoSubasta::INICIADA,
            'loteActual_id' => $primerLote->id
        ]);

        $this->iniciarProcesoDeAutomatizacion($subasta, $primerLote);

        $this->sendComienzoSubastaNotification($subasta);

        $inicioSubastaData = [
            'subasta_id' => $subasta->id,
            'estado' => EstadoSubasta::INICIADA->value,
            'lote_actual_id' => $primerLote->id,
            'lote_actual_nombre' => $primerLote->nombre,
            'url_transmision' => $subasta->urlTransmision
        ];
        event(new InicioSubastaEvent($inicioSubastaData));

        return response()->json([
            'success' => true,
            'message' => 'Subasta iniciada correctamente',
            'data' => $subasta
        ]);
    }

    private function sendComienzoSubastaNotification(Subasta $subasta)
    {
        try {
            $subastaWithRelations = Subasta::with('lotes.usuariosInteresados')->find($subasta->id);
            
            if (!$subastaWithRelations) {
                return;
            }

            $usuariosInteresados = $subastaWithRelations->lotes
                ->flatMap(fn($lote) => $lote->usuariosInteresados)
                ->unique('id');

            foreach ($usuariosInteresados as $usuarioRegistrado) {
                $usuarioNotificado = Usuario::find($usuarioRegistrado->id);
                if ($usuarioNotificado) {
                    $usuarioNotificado->notify(new ComienzoSubastaNotification($subasta));
                }
            }
        } catch (\Exception $e) {
            Log::error('Error sending ComienzoSubastaNotification: ' . $e->getMessage());
        }
    }

    private function sendNuevaPujaNotification(Subasta $subasta, $puja, Lote $lote)
    {
        try {
            $loteWithRelations = Lote::with('usuariosInteresados')->find($lote->id);
            
            if (!$loteWithRelations) {
                return;
            }

            $usuariosInteresados = $loteWithRelations->usuariosInteresados;

            if ($usuariosInteresados->count() === 0) {
                return;
            }

            foreach ($usuariosInteresados as $usuarioRegistrado) {
                if ($usuarioRegistrado->id !== $puja->usuarioRegistrado_id) {
                    $usuarioNotificado = Usuario::find($usuarioRegistrado->id);
                    if ($usuarioNotificado) {
                        $usuarioNotificado->notify(new NuevaPujaNotification($subasta, $puja, $lote));
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Error sending NuevaPujaNotification: ' . $e->getMessage());
        }
    }


    private function sendSubastaFinalizadaNotification(Subasta $subasta)
    {
        try {
            $subastaWithRelations = Subasta::with('lotes.usuariosInteresados')->find($subasta->id);
            
            if (!$subastaWithRelations) {
                return;
            }

            $usuariosInteresados = $subastaWithRelations->lotes
                ->flatMap(fn($lote) => $lote->usuariosInteresados)
                ->unique('id');

            foreach ($usuariosInteresados as $usuarioRegistrado) {
                $usuarioNotificado = Usuario::find($usuarioRegistrado->id);
                if ($usuarioNotificado) {
                    $usuarioNotificado->notify(new SubastaFinalizadaNotification($subasta, $subastaWithRelations->lotes));
                }
            }
        } catch (\Exception $e) {
            Log::error('Error sending SubastaFinalizadaNotification: ' . $e->getMessage());
        }
    }

    public function cerrarSubasta(int $id)
    {
        try {            
            $rematador = $this->validarUsuario();
            
            $subasta = $this->buscarSubastaPorId($id);
            if (!$subasta instanceof Subasta) {
                return $subasta;
            }

            if ($subasta->estado !== EstadoSubasta::INICIADA) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden cerrar subastas que estén iniciadas'
                ], 422);
            }

            $loteActual = $subasta->loteActual;
            if (!$loteActual) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay un lote siendo subastado actualmente'
                ], 404);
            }
            if ($loteActual->fechaUltimaPuja === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede cerrar la subasta porque no se han realizado pujas en el lote actual'
                ], 422);
            }
          
            $loteService = app(LoteServiceInterface::class);
            $resultadoGanadores = $loteService->generarListaGanadoresPotenciales($loteActual->id);
            
            if (!$resultadoGanadores instanceof \Illuminate\Http\JsonResponse || 
                !$resultadoGanadores->getData()->success) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al generar ganadores potenciales'
                ], 500);
            }

            
            $primerGanadorPotencial = GanadorPotencial::where('lote_id', $loteActual->id)
                ->where('posicion', 1)
                ->first();
            
            $ganadorId = $primerGanadorPotencial ? $primerGanadorPotencial->usuario_registrado_id : null;
        
            PujaAutomatica::where('lote_id', $loteActual->id)->delete();

            $lotesSinGanador = $subasta->lotes()
                ->whereDoesntHave('ganadoresPotenciales', function($query) {
                    $query->where('es_ganador_actual', true);
                })
                ->count();

            if ($lotesSinGanador == 0) {
                $subasta->update([
                    'estado' => EstadoSubasta::CERRADA,
                    'loteActual_id' => null,
                    'fechaCierre' => now()
                ]);

                $this->sendSubastaFinalizadaNotification($subasta);

                $cierreSubastaData = [
                    'subasta_id' => $subasta->id,
                    'estado' => EstadoSubasta::CERRADA->value,
                    'lote_cerrado_id' => $loteActual->id,
                    'lote_cerrado_nombre' => $loteActual->nombre,
                    'ganador_id' => $ganadorId,
                    'siguiente_lote_id' => null,
                    'siguiente_lote_nombre' => null,
                    'subasta_finalizada' => true
                ];
                event(new CierreSubastaEvent($cierreSubastaData));

                return response()->json([
                    'success' => true,
                    'message' => 'Subasta cerrada correctamente',
                    'data' => $subasta
                ]);
            }

            $nuevoLoteActual = $subasta->lotes()
                ->whereDoesntHave('ganadoresPotenciales')
                ->first();

            $subasta->update([
                'loteActual_id' => $nuevoLoteActual->id
            ]);

            $this->iniciarProcesoDeAutomatizacion($subasta, $nuevoLoteActual);

            $cierreSubastaData = [
                'subasta_id' => $subasta->id,
                'estado' => EstadoSubasta::INICIADA->value,
                'lote_cerrado_id' => $loteActual->id,
                'lote_cerrado_nombre' => $loteActual->nombre,
                'ganador_id' => $ganadorId,
                'siguiente_lote_id' => $nuevoLoteActual->id,
                'siguiente_lote_nombre' => $nuevoLoteActual->nombre,
                'subasta_finalizada' => false
            ];
            event(new CierreSubastaEvent($cierreSubastaData));

            return response()->json([
                'success' => true,
                'message' => 'Lote subastado correctamente',
                'data' => $subasta
            ]);
        } catch (\Exception $e) {
            Log::error("ERROR EN CERRAR SUBASTA: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error interno: ' . $e->getMessage()
            ], 500);
        }
    }

    public function realizarPuja(array $puja, int $id)
    {
        $usuario = $this->validarUsuario();
        if (!$usuario instanceof Usuario) {
            return $usuario;
        }

        if ($usuario->tipo !== 'registrado') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los usuarios registrados pueden realizar pujas'
            ], 422);
        }

        $subasta = $this->buscarSubastaPorId($id);
        if (!$subasta instanceof Subasta) {
            return $subasta;
        }

        if ($subasta->estado !== EstadoSubasta::INICIADA) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden realizar pujas en subastas iniciadas'
            ], 422);
        }

        $loteActual_id = $subasta->loteActual_id;
        if (!$loteActual_id) {
            return response()->json([
                'success' => false,
                'message' => 'No hay un lote siendo subastado actualmente'
            ], 404);
        }

        $loteActual = $subasta->lotes()->find($loteActual_id);
        
        $ultimaPuja = $loteActual->pujas()->latest()->first();
        if ($ultimaPuja && $ultimaPuja->usuarioRegistrado_id === $usuario->id) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes realizar una puja inmediatamente después de tu última puja'
            ], 422);
        }
        
        $fechaUltimaPuja = $loteActual->fechaUltimaPuja ?? null;
        $tiempoMinimoPujas = 3;
        
        if ($fechaUltimaPuja && now()->diffInSeconds($fechaUltimaPuja, true) < $tiempoMinimoPujas) {
            return response()->json([
                'success' => false,
                'message' => "Debe esperar {$tiempoMinimoPujas} segundos entre pujas"
            ], 429);
        }

        if ($puja['monto'] < $loteActual->pujaMinima) {
            return response()->json([
                'success' => false,
                'message' => 'La puja debe ser de al menos $'.$loteActual->pujaMinima
            ], 422);
        }

        if ($puja['lote_id'] !== $loteActual->id) {
            return response()->json([
                'success' => false,
                'message' => 'El ID del lote no coincide con el lote actual de la subasta'
            ], 422);
        }

        $pujaCreada = $loteActual->pujas()->create([
            'monto' => $puja['monto'],
            'usuarioRegistrado_id' => $usuario->id
        ]);

        $nuevoTotal = $puja['monto'];

        if ($loteActual->oferta == 0) {
            $nuevoTotal += $loteActual->valorBase;
        } else {
            $nuevoTotal += $loteActual->oferta;
        }

        $loteActual->update([
            'oferta' => $nuevoTotal,
            'fechaUltimaPuja' => now()
        ]);

        $nuevaPujaData = [
            'id' => $pujaCreada->id,
            'monto' => $pujaCreada->monto,
            'lote_id' => $loteActual->id,
            'lote_nombre' => $loteActual->nombre,
            'subasta_id' => $subasta->id,
            'usuario_id' => $pujaCreada->usuarioRegistrado_id,
            'oferta' => $loteActual->oferta
        ];

        try {
            event(new NuevaPujaEvent($nuevaPujaData));
        } catch (\Exception $e) {
            
        }

        if ($loteActual instanceof Lote){
            $this->sendNuevaPujaNotification($subasta, $pujaCreada, $loteActual);
        }

        $this->checkThresholdAndNotify($subasta, $loteActual, $nuevoTotal);

        return response()->json([
            'success' => true,
            'message' => 'Puja realizada correctamente',
            'data' => [
                'puja' => $pujaCreada,
                'nuevo_total_lote' => $nuevoTotal
            ]
        ], 200);
    }

    public function obtenerPujas(int $id)
    {
        $subasta = Subasta::find($id);

        if (!$subasta) {
            return response()->json([
                'success' => false,
                'message' => 'Subasta no encontrada'
            ], 404);
        }

        $loteActual = $subasta->loteActual;
        if (!$loteActual) {
            return response()->json([
                'success' => false,
                'message' => 'No hay un lote siendo subastado actualmente'
            ], 404);
        }

        return $loteActual->pujas()->get();
    }

    public function realizarPujaAutomatica(array $pujaAutomatica, int $id)
    {
        $usuario = $this->validarUsuario();
        if (!$usuario instanceof Usuario) {
            return $usuario;
        }

        if ($usuario->tipo !== 'registrado') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los usuarios registrados pueden crear pujas automáticas'
            ], 422);
        }

        $subasta = $this->buscarSubastaPorId($id);
        if (!$subasta instanceof Subasta) {
            return $subasta;
        }

        if (in_array($subasta->estado, [EstadoSubasta::INICIADA, EstadoSubasta::CERRADA, EstadoSubasta::CANCELADA])) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden crear pujas automáticas en subastas pendientes'
            ], 422);
        }

        $lote = $subasta->lotes()->find($pujaAutomatica['lote_id']);
        if (!$lote) {
            return response()->json([
                'success' => false,
                'message' => 'Lote no encontrado en esta subasta'
            ], 404);
        }

        $presupuestoMinimo = $lote->valorBase + $lote->pujaMinima;

        if ($pujaAutomatica['presupuesto'] < $presupuestoMinimo) {
            return response()->json([
                'success' => false,
                'message' => 'El presupuesto debe ser de al menos $'.$presupuestoMinimo
            ], 422);
        }

        $pujaAutomaticaData = PujaAutomatica::updateOrCreate(
            [
                'lote_id' => $lote->id,
                'usuarioRegistrado_id' => $usuario->id
            ],
            [
                'presupuesto' => $pujaAutomatica['presupuesto']
            ]
        );

        $mensaje = $pujaAutomaticaData->wasRecentlyCreated 
            ? 'Puja automática creada correctamente'
            : 'Puja automática actualizada correctamente';

        return response()->json([
            'success' => true,
            'message' => $mensaje
        ]);
    }
    
    public function obtenerTransmisionEnVivo(int $id): mixed
    {
        $subasta = Subasta::find($id);

        if (!$subasta) {
            return response()->json([
                'success' => false,
                'message' => 'Subasta no encontrada'
            ], 404);
        }

        return $subasta->urlTransmision;
    }

    public function iniciarProcesoDeAutomatizacion(Subasta $subasta, Lote $lote)
    {
        $pujasAutomaticas = PujaAutomatica::where('lote_id', $lote->id)->get();
        
        if ($pujasAutomaticas->isEmpty()) {
            return;
        }
        
        $pujasAutomaticasArray = $pujasAutomaticas->map(function ($pa) {
            return [
                'id' => $pa->id,
                'presupuesto' => $pa->presupuesto,
                'lote_id' => $pa->lote_id,
                'usuarioRegistrado_id' => $pa->usuarioRegistrado_id
            ];
        })->toArray();
        
        ProcesarPujasAutomaticas::dispatch($subasta, $lote, $pujasAutomaticasArray)
            ->delay(now()->addSeconds(3));
    }

    public function realizarPujaInterna(array $puja, int $subastaId, int $usuarioId)
    {
        $usuario = Usuario::find($usuarioId);
        if (!$usuario || $usuario->tipo !== 'registrado') {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no válido para realizar pujas automáticas'
            ], 422);
        }

        $subasta = $this->buscarSubastaPorId($subastaId);
        if (!$subasta instanceof Subasta) {
            return $subasta;
        }

        if ($subasta->estado !== EstadoSubasta::INICIADA) {
            return response()->json([
                'success' => false,
                'message' => 'La subasta no está en curso'
            ], 422);
        }

        $loteActual = $subasta->lotes()->find($subasta->loteActual_id);
        if (!$loteActual || $loteActual->id !== $puja['lote_id']) {
            return response()->json([
                'success' => false,
                'message' => 'El lote no es el que se está subastando actualmente'
            ], 422);
        }

        $fechaUltimaPuja = $loteActual->fechaUltimaPuja ?? null;
        $tiempoMinimoPujas = 3;
        
        if ($fechaUltimaPuja && now()->diffInSeconds($fechaUltimaPuja, true) < $tiempoMinimoPujas) {
            return response()->json([
                'success' => false,
                'message' => "Debe esperar {$tiempoMinimoPujas} segundos entre pujas"
            ], 429);
        }

        $ultimaPuja = $loteActual->pujas()->latest()->first();
        if ($ultimaPuja && $ultimaPuja->usuarioRegistrado_id === $usuario->id) {
            return response()->json([
                'success' => false,
                'message' => 'Este usuario ya realizó la última puja'
            ], 422);
        }

        $pujaCreada = $loteActual->pujas()->create([
            'monto' => $puja['monto'],
            'usuarioRegistrado_id' => $usuario->id
        ]);

        $nuevoTotal = $puja['monto'];

        if ($loteActual->oferta == 0) {
            $nuevoTotal += $loteActual->valorBase;
        } else {
            $nuevoTotal += $loteActual->oferta;
        }

        $loteActual->update([
            'oferta' => $nuevoTotal,
            'fechaUltimaPuja' => now()
        ]);

        $nuevaPujaData = [
            'id' => $pujaCreada->id,
            'monto' => $pujaCreada->monto,
            'lote_id' => $loteActual->id,
            'lote_nombre' => $loteActual->nombre,
            'subasta_id' => $subasta->id,
            'usuario_id' => $pujaCreada->usuarioRegistrado_id,
            'oferta' => $nuevoTotal
        ];

        event(new NuevaPujaEvent($nuevaPujaData));

        // Mandar notificación de nueva puja
         if ($loteActual instanceof Lote){
            $this->sendNuevaPujaNotification($subasta, $pujaCreada, $loteActual);
        }

        $this->checkThresholdAndNotify($subasta, $loteActual, $nuevoTotal);
        
        return $pujaCreada;
    }

    public function eliminarSubasta(int $id)
    {
        $subasta = Subasta::find($id);
        if (!$subasta) {
            return response()->json([
                'success' => false,
                'message' => 'Subasta no encontrada'
            ], 404);
        }
        $subasta->delete();
        return response()->json([
            'success' => true,
            'message' => 'Subasta eliminada correctamente'
        ]);
    }

    public function obtenerImagenAleatoria(int $subastaId)
    {
        $subasta = $this->buscarSubastaPorId($subastaId);
        if (!$subasta instanceof Subasta) {
            return $subasta;
        }

        $lotes = $subasta->lotes()->with('articulos')->get();
        
        $todasLasImagenes = [];
        
        foreach ($lotes as $lote) {
            foreach ($lote->articulos as $articulo) {
                if (!empty($articulo->imagenes)) {
                    $imagenes = is_string($articulo->imagenes) 
                        ? json_decode($articulo->imagenes, true) 
                        : $articulo->imagenes;
                    
                    if (is_array($imagenes)) {
                        foreach ($imagenes as $index => $imagen) {
                            $todasLasImagenes[] = [
                                'imagen' => $imagen,
                                'lote_id' => $lote->id,
                                'lote_numero' => $lote->numero,
                                'articulo_id' => $articulo->id,
                                'articulo_descripcion' => $articulo->descripcion,
                                'imagen_index' => $index + 1
                            ];
                        }
                    }
                }
            }
        }

        if (empty($todasLasImagenes)) {
            return response()->json([
                'success' => false,
                'message' => 'No hay imágenes disponibles en esta subasta'
            ], 404);
        }

        $imagenAleatoria = $todasLasImagenes[array_rand($todasLasImagenes)];

        return response()->json([
            'success' => true,
            'data' => [
                'imagen' => $imagenAleatoria['imagen'],
                'contexto' => [
                    'subasta_id' => $subasta->id,
                    'subasta_titulo' => $subasta->titulo,
                    'lote_id' => $imagenAleatoria['lote_id'],
                    'lote_numero' => $imagenAleatoria['lote_numero'],
                    'articulo_id' => $imagenAleatoria['articulo_id'],
                    'articulo_descripcion' => $imagenAleatoria['articulo_descripcion'],
                    'imagen_index' => $imagenAleatoria['imagen_index']
                ]
            ]
        ]);
    }

    private function checkThresholdAndNotify(Subasta $subasta, Lote $lote, $nuevoTotal)
    {
        try {
            $valorBase = $lote->valorBase;
            if ($valorBase <= 0) {
                return; 
            }

            $thresholds = [2, 3, 5, 7, 10];
            
            $currentMultiplier = $nuevoTotal / $valorBase;
            
            foreach ($thresholds as $threshold) {
                $lowerBound = $threshold; 
                $upperBound = $threshold * 1.25;
                
                if ($currentMultiplier >= $lowerBound && $currentMultiplier <= $upperBound) {
                    $cacheKey = "threshold_notification_{$subasta->id}_{$lote->id}_{$threshold}";
                    
                    if (!\Cache::has($cacheKey)) {
                        $casaDeRemates = CasaDeRemates::find($subasta->casaDeRemates_id);
                        if ($casaDeRemates) {
                            $usuarioCasa = Usuario::find($casaDeRemates->id);
                            if ($usuarioCasa) {
                                $usuarioCasa->notify(new UmbralOfertaNotification(
                                    $subasta, 
                                    $lote, 
                                    $threshold, 
                                    $nuevoTotal, 
                                    $valorBase
                                ));
                                
                                \Cache::put($cacheKey, true, now()->addHour());
                                
                                \Log::info("Threshold notification sent for auction {$subasta->id}, lot {$lote->id}, threshold {$threshold}x");
                            }
                        }
                        break;
                    }
                }
            }
        } catch (\Exception $e) {
            \Log::error('Error checking threshold and sending notification: ' . $e->getMessage());
        }
    }

    public function manejarLoteSinGanadores(int $loteId): mixed
    {
        try {
            
            $lote = Lote::with('subasta')->find($loteId);
            
            if (!$lote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lote no encontrado'
                ], 404);
            }

            $lote->update(['ganador_id' => null]);
            
            return response()->json([
                'success' => true,
                'message' => 'Lote marcado como sin ganador disponible'
            ], 200);
            
        } catch (\Exception $e) {
            \Log::error('Error manejando lote sin ganadores', [
                'lote_id' => $loteId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Error al manejar lote sin ganadores'
            ], 500);
        }
    }

    public function obtenerDatosParaMapaFiltrados(array $filtros = [])
    {
        $query = Subasta::select('id', 'ubicacion', 'tipoSubasta', 'estado')
            ->whereNotNull('ubicacion')
            ->where('ubicacion', '!=', '');

        if (isset($filtros['tipoSubasta']) && $filtros['tipoSubasta'] !== null && $filtros['tipoSubasta'] !== "null") {
            $query->where('tipoSubasta', $filtros['tipoSubasta']);
        }

        if (isset($filtros['estado']) && $filtros['estado'] !== null && $filtros['estado'] !== "null") {
            if (is_array($filtros['estado'])) {
                $query->whereIn('estado', $filtros['estado']);
            } else {
                $query->where('estado', $filtros['estado']);
            }
        } else {
            $query->whereNotIn('estado', [EstadoSubasta::CERRADA, EstadoSubasta::CANCELADA]);
        }

        if (isset($filtros['categoria']) && $filtros['categoria'] !== null && $filtros['categoria'] !== "null") {
            $query->whereHas('lotes.articulos', function($q) use ($filtros) {
                $q->where('categoria_id', $filtros['categoria']);
            });
        }

        $datosOptimizados = $query->get()
            ->map(function ($subasta) {
                return [
                    'id' => $subasta->id,
                    'ubicacion' => $subasta->ubicacion,
                    'tipoSubasta' => $subasta->tipoSubasta,
                    'estado' => $subasta->estado
                ];
            })
            ->filter(function ($item) {
                return !empty($item['ubicacion']) && 
                       trim($item['ubicacion']) !== '' &&
                       strtolower($item['ubicacion']) !== 'null' &&
                       strtolower($item['ubicacion']) !== 'undefined';
            })
            ->values();
        
        return $datosOptimizados->toArray();
    }
}
