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
use App\Events\NuevaPujaEvent;
use App\Jobs\ProcesarPujasAutomaticas;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

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
                'error' => 'El ID de la casa de remates es requerido.'
            ], 422);
        }

        $casaDeRematesId = $data['casaDeRemates_id'];

        // Opcional: Verificar si la casa de remates existe.
        $casaDeRematesExistente = CasaDeRemates::find($casaDeRematesId);
        if (!$casaDeRematesExistente) {
            return response()->json([
                'success' => false,
                'error' => 'La casa de remates especificada no existe.'
            ], 404);
        }

        // Validar que el rematador pertenezca a esta casa de remates
        if (isset($data['rematador_id']) && $data['rematador_id'] !== null) {
            // Se usa $casaDeRematesExistente que ya se buscó.
            if ($casaDeRematesExistente) {
                $rematadorPertenece = $casaDeRematesExistente->rematadores()->where('rematador_id', $data['rematador_id'])->exists();
                
                if (!$rematadorPertenece) {
                    return response()->json([
                        'success' => false,
                        'error' => 'El rematador especificado no pertenece a esta casa de remates'
                    ], 422);
                }
            } 
            // No se necesita el 'else' aquí porque ya se validó la existencia de la casa de remates.
        }

        return Subasta::create([
            'casaDeRemates_id' => $casaDeRematesId, // Se usa el ID de la casa de remates proporcionado en $data.
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

        $subasta->update($data);

        return Subasta::find($id)->first();
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
            ->orderBy('fechaInicio', 'asc')
            ->get();

        if ($subastas->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay subastas disponibles'
            ], 404);
        }

        return $subastas;
    }

    public function obtenerSubastasFiltradas(array $data)
    {
        $query = Subasta::query();

        $cerrada = $data['cerrada'] ?? false;
        $categoria = $data['categoria'] ?? null;
        $ubicacion = $data['ubicacion'] ?? null;
        $fechaCierreLimite = $data['fechaCierreLimite'] ?? null;

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

        $subastas = $query->get();

        if ($subastas->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay subastas disponibles con los filtros aplicados'
            ], 404);
        }

        return $subastas;
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

        if ($subasta->estado !== EstadoSubasta::PENDIENTE) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden iniciar subastas en estado pendiente'
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

        $subasta->estado = EstadoSubasta::INICIADA;
        $subasta->loteActual_id = $primerLote->id;
        $subasta->save();

        $this->iniciarProcesoDeAutomatizacion($subasta, $primerLote);

        return response()->json([
            'success' => true,
            'message' => 'Subasta iniciada correctamente',
            'data' => $subasta
        ]);
    }

    public function cerrarSubasta(int $id)
    {
        $rematador = $this->validarUsuario();
        if (!$rematador instanceof Usuario) {
            return $rematador;
        }

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

        $loteActual->update([
            'ganador_id' => $loteActual->pujas()->latest()->first()->usuarioRegistrado_id
        ]);

        $lotesSinGanador = $subasta->lotes()->where('ganador_id', null)->count();

        if ($lotesSinGanador === 0) {
            $subasta->update([
                'estado' => EstadoSubasta::CERRADA,
                'loteActual_id' => null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Subasta cerrada correctamente',
                'data' => $subasta
            ]);
        }

        $nuevoLoteActual = $subasta->lotes()->where('ganador_id', null)->first();

        $subasta->update([
            'loteActual_id' => $nuevoLoteActual->id
        ]);

        $this->iniciarProcesoDeAutomatizacion($subasta, $nuevoLoteActual);

        return response()->json([
            'success' => true,
            'message' => 'Lote subastado correctamente',
            'data' => $subasta
        ]);
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

        $montoMinimo = $loteActual->pujaMinima;

        if ($puja['monto'] < $montoMinimo) {
            return response()->json([
                'success' => false,
                'message' => 'La puja debe ser de al menos $'.$montoMinimo
            ], 422);
        }

        $nuevoTotal = $loteActual->oferta + $puja['monto'];

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

        try {
            $loteActual->update([
                'oferta' => $nuevoTotal,
                'fechaUltimaPuja' => now()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el lote: ' . $e->getMessage()
            ], 500);
        }

        $nuevaPujaData = [
            'id' => $pujaCreada->id,
            'monto' => $pujaCreada->monto,
            'nuevo_total' => $nuevoTotal,
            'lote_id' => $loteActual->id,
            'lote_nombre' => $loteActual->nombre,
            'subasta_id' => $subasta->id,
            'usuario_id' => $pujaCreada->usuarioRegistrado_id
        ];

        try {
            event(new NuevaPujaEvent($nuevaPujaData));
        } catch (\Exception $e) {
            
        }

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

        if ($subasta->estado !== EstadoSubasta::PENDIENTE) {
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

        $pujaAutomaticaRepetida = PujaAutomatica::where('lote_id', $lote->id)
            ->where('usuarioRegistrado_id', $usuario->id)
            ->first();

        if ($pujaAutomaticaRepetida) {
            return response()->json([
                'success' => false,
                'message' => 'Ya existe una puja automática para este lote y usuario'
            ], 422);
        }

        PujaAutomatica::create([
            'presupuesto' => $pujaAutomatica['presupuesto'],
            'lote_id' => $lote->id,
            'usuarioRegistrado_id' => $usuario->id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Puja automática creada correctamente'
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

        // Crear la puja
        $pujaCreada = $loteActual->pujas()->create([
            'monto' => $puja['monto'],
            'usuarioRegistrado_id' => $usuario->id
        ]);

        // Calculate the new total offer amount
        $nuevoTotal = $loteActual->oferta + $puja['monto'];

        $loteActual->update([
            'oferta' => $nuevoTotal,
            'fechaUltimaPuja' => now()
        ]);

        $nuevaPujaData = [
            'id' => $pujaCreada->id,
            'monto' => $pujaCreada->monto,
            'nuevo_total' => $nuevoTotal,
            'lote_id' => $loteActual->id,
            'lote_nombre' => $loteActual->nombre,
            'subasta_id' => $subasta->id,
            'usuario_id' => $pujaCreada->usuarioRegistrado_id
        ];

        event(new NuevaPujaEvent($nuevaPujaData));

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
}
