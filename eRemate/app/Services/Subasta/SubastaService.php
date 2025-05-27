<?php


namespace App\Services\Subasta;
use App\Models\Subasta;
use App\Models\CasaDeRemates;
use App\Models\Usuario;
use App\Models\Rematador;
use App\Enums\EstadoSubasta;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class SubastaService implements SubastaServiceInterface
{

    private function validarCasa()
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

        // Busca el usuario en la base de datos utilizando el ID del usuario autenticado.
        // Esto asegura que el usuario asociado al token existe en el sistema.
        $usuario = Usuario::find($usuarioAutenticado->id);
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        // Verifica si existe una casa de remates cuyo ID coincida con el ID del usuario autenticado.
        // Esta es una capa crucial de autorización: no solo el usuario debe estar autenticado,
        // sino que también debe estar registrado como una casa de remates con el mismo ID.
        $casaDeRemates = CasaDeRemates::where('id', $usuario->id)->first();

        // Si no se encuentra una casa de remates con el ID del usuario,
        // significa que el usuario autenticado no tiene los permisos para actuar como casa de remates.
        // Se retorna un error 403 (Prohibido).
        if (!$casaDeRemates) {
            return response()->json(['error' => 'No tienes permiso para acceder a esta información'], 403);
        }

        // Si todas las validaciones son exitosas, se retorna el objeto Usuario.
        // Este usuario ya ha sido validado como una casa de remates.
        return $usuario;
    }

    private function validarRematador()
    {
        $usuarioAutenticado = Auth::user();

        if (!$usuarioAutenticado) {
            return response()->json(['error' => 'Token no proporcionado o inválido'], 401);
        }

        $usuario = Usuario::find($usuarioAutenticado->id);
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $rematador = Rematador::where('id', $usuario->id)->first();

        if (!$rematador) {
            return response()->json(['error' => 'No tienes permiso para acceder a esta información'], 403);
        }

        return $usuario;
    }
    
    private function verificarUsuario($usuario, $subasta)
    {
        $casaDeRemates = CasaDeRemates::where('id', $usuario->id)->first();
        $casaDeRematesSubasta = $subasta->casaDeRemates;
        
        if (($casaDeRemates && $casaDeRemates->id !== $casaDeRematesSubasta?->id)) {
            return response()->json(['error' => 'No tienes permiso para acceder a esta subasta'], 403);
        }
        
        return $usuario;
    }
    
    public function crearSubasta(array $data): mixed
    {
        // Verificar si se proporcionó el ID de la casa de remates en los datos.
        if (!isset($data['casaDeRemates_id'])) {
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
        $subasta = Subasta::find($id);

        if (!$subasta) {
            return response()->json([
                'success' => false,
                'message' => 'Subasta no encontrada'
            ], 404);
        }

        return $subasta;
    }
    
    public function actualizarSubasta(int $id, array $data): mixed
    {
        $usuario = $this->validarCasa();
        if (!$usuario instanceof Usuario) {
            return $usuario;
        }
        
        $subasta = Subasta::find($id);
        if (!$subasta) {
            return response()->json([
                'success' => false,
                'error' => 'Subasta no encontrada'
            ], 404);
        }

        $chequeo = $this->verificarUsuario($usuario, $subasta);
        if ($chequeo instanceof JsonResponse) {
            return $chequeo;
        }

        if ($subasta->fechaInicio < now()) {
            return response()->json([
                'success' => false,
                'error' => 'No se puede actualizar una subasta que ya ha finalizado'
            ], 400);
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
        $subasta = Subasta::find($id);

        if (!$subasta) {
            return response()->json([
                'success' => false,
                'message' => 'Subasta no encontrada'
            ], 404);
        }

        return $subasta->lotes;
    }

    public function iniciarSubasta(int $id)
    {
        $subasta = Subasta::find($id);

        if (!$subasta) {
            return response()->json([
                'success' => false,
                'message' => 'Subasta no encontrada'
            ], 404);
        }

        // Verificar que la subasta esté en estado pendiente
        if ($subasta->estado !== EstadoSubasta::PENDIENTE) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden iniciar subastas en estado pendiente'
            ], 422);
        }

        // Actualizar el estado de la subasta
        $subasta->estado = EstadoSubasta::INICIADA;
        $subasta->save();

        return response()->json([
            'success' => true,
            'message' => 'Subasta iniciada correctamente',
            'data' => $subasta
        ]);
    }

    public function cerrarSubasta(int $id)
    {
        $subasta = Subasta::find($id);

        if (!$subasta) {
            return response()->json([
                'success' => false,
                'message' => 'Subasta no encontrada'
            ], 404);
        }

        // Verificar que la subasta esté en estado iniciada
        if ($subasta->estado !== EstadoSubasta::INICIADA) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden cerrar subastas que estén iniciadas'
            ], 422);
        }

        // Actualizar el estado de la subasta
        $subasta->estado = EstadoSubasta::CERRADA;
        $subasta->save();

        return response()->json([
            'success' => true,
            'message' => 'Subasta cerrada correctamente',
            'data' => $subasta
        ]);
    }

    public function realizarPuja(int $id)
    {

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
