<?php


namespace App\Services\Subasta;
use App\Models\Subasta;
use App\Models\CasaDeRemates;
use App\Models\Usuario;
use App\Models\Rematador;
use App\Enums\EstadoSubasta;
use App\Models\UsuarioRegistrado;
use App\Models\Lote;
use App\Events\NuevaPujaEvent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class SubastaService implements SubastaServiceInterface
{

    private function validarUsuario()
    {
        // Obtiene el usuario autenticado actualmente a través del token JWT.
        // Este es el primer paso de seguridad para asegurar que cualquier operación
        // que requiera una casa de remates sea realizada por un usuario logueado.
        $usuarioAutenticado = Auth::user();

        // Si no hay un usuario autenticado (token no proporcionado o inválido),
        // se retorna un error 401 (No autorizado).
        if (!$usuarioAutenticado) {
            return response()->json(['error' => 'Token no proporcionado o inválido'], 401);
        }

        $usuario = Usuario::find($usuarioAutenticado)->first();
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $casaDeRemates = CasaDeRemates::where('id', $usuarioAutenticado->id)->first();

        if (!$casaDeRemates) {
            return response()->json(['error' => 'No tienes permiso para acceder a esta información'], 403);
        }

        return $usuario;
    }

    private function validarRematador()
    {
        $usuarioAutenticado = Auth::user();

        if (!$usuarioAutenticado) {
            return response()->json(['error' => 'Token no proporcionado o inválido'], 401);
        }

        $usuario = Usuario::find($usuarioAutenticado)->first();
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $rematador = Rematador::where('id', $usuarioAutenticado->id)->first();

        if (!$usuarioEspecifico) {
            return response()->json(['error' => 'No tienes permiso para acceder a esta información'], 403);
        }

        return $usuario;
    }
    
    private function verificarUsuario($usuario, $subasta)
    {
        $casaDeRemates = CasaDeRemates::where('id', $usuario->id)->first();

        $casaDeRematesSubasta = $subasta->casaRemates ?? null;

        if (($casaDeRemates && $casaDeRemates->id !== $casaDeRematesSubasta?->id)) {
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
        $usuario = $this->validarCasa();
        
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

        if ($subasta->estado !== EstadoSubasta::PENDIENTE) {
            return response()->json([
                'success' => false,
                'error' => 'No se puede modificar una subasta que no está en estado pendiente'
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
        $diferencia = $fechaInicio->diffInMinutes($fechaActual);
        if ($diferencia > 30) {
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

        $lotes = $subasta->lotes;
        foreach ($lotes as $lote) {
            if ($lote->ganador === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede cerrar la subasta porque hay lotes que no han sido subastados'
                ], 422);
            }
        }

        $subasta->estado = EstadoSubasta::CERRADA;
        $subasta->save();

        return response()->json([
            'success' => true,
            'message' => 'Subasta cerrada correctamente',
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

        // Calculate the new total offer (current offer + new bid amount)
        $nuevoTotal = $loteActual->oferta + $puja['monto'];
        $minimoRequerido = $loteActual->oferta + $loteActual->pujaMinima;

        if ($nuevoTotal < $minimoRequerido) {
            return response()->json([
                'success' => false,
                'message' => 'La puja debe ser mayor o igual a la puja mínima (' . $loteActual->pujaMinima . ')'
            ], 422);
        }

        if ($puja['lote_id'] !== $loteActual->id) {
            return response()->json([
                'success' => false,
                'message' => 'El ID del lote no coincide con el lote actual de la subasta'
            ], 422);
        }

        // Create the bid with the bid amount (not total)
        $pujaCreada = $loteActual->pujas()->create([
            'monto' => $puja['monto'],
            'usuarioRegistrado_id' => $usuario->id
        ]);

        // Update the lot's current offer with the new total
        $loteActual->oferta = $nuevoTotal;
        $loteActual->save();

        $pujaData = [
            'id' => $pujaCreada->id,
            'monto' => $pujaCreada->monto,
            'nuevo_total' => $nuevoTotal,
            'lote_id' => $loteActual->id,
            'lote_nombre' => $loteActual->nombre,
            'usuario_id' => $pujaCreada->usuarioRegistrado_id
        ];

        // Disparar evento para WebSockets
        event(new NuevaPujaEvent($pujaData, $subasta->id));

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

        return $loteActual->pujas;
    }

    public function realizarPujaAutomatica(int $id)
    {
        
    }
    
    public function obtenerTransmisionEnVivo(int $id)
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
