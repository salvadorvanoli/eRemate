<?php

namespace App\Http\Controllers;
use App\Services\Rematador\RematadorServiceInterface;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class RematadorController extends Controller
{
    protected $rematadorService;

    public function __construct(RematadorServiceInterface $rematadorService)
    {
        $this->rematadorService = $rematadorService;
    }

    public function index()
    {
        //
    }

    /**
     * Crear un rematador
     */
    public function store(Request $request)
{
    try {
        // Validación más explícita
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer',
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'numeroMatricula' => 'required|string|max:255|unique:rematadores,numeroMatricula',
            'direccionFiscal' => 'required|string|max:255',
            'imagen' => 'nullable|image|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Error de validación',
                'details' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        
        $data['imagen'] = null;
        if ($request->hasFile('imagen')) {
            $data['imagen'] = $request->file('imagen')->store('rematadores', 'public');
        }

        $rematador = $this->rematadorService->crearRematador($data);
        
        return response()->json([
            'message' => 'Rematador creado exitosamente',
            'data' => $rematador
        ], 201);

    } catch (\Exception $e) {
        \Log::error('Error en store rematador: ' . $e->getMessage());
        return response()->json([
            'error' => 'Error al crear rematador',
            'details' => $e->getMessage()
        ], 500);
    }
}

    /**
     * Ver los detalles de un rematador
     */
    public function show($id)
    {
        $rematador = $this->rematadorService->obtenerRematadorPorId($id);

        return response()->json($rematador);
        
    }

    /**
     * Actualizar un rematador
     */
    public function update(Request $request, $id)
{
    try {
        $data = $request->validate([
            'id' => 'sometimes|integer|exists:usuarios,id',
            'nombre' => 'sometimes|string|max:255',
            'apellido' => 'sometimes|string|max:255',
            'numeroMatricula' => 'sometimes|string|max:255', // Eliminado unique
            'direccionFiscal' => 'sometimes|string|max:255',
            'imagen' => 'nullable|image|max:2048',
            // Validación sin restricción unique
            'email' => 'sometimes|email|max:255', // Eliminado unique
            'telefono' => 'sometimes|string|max:20'
        ]);

        // Si hay imagen, procesarla
        if ($request->hasFile('imagen')) {
            $data['imagen'] = $request->file('imagen')->store('rematadores', 'public');
        }

        $rematador = $this->rematadorService->actualizarRematador($id, $data);

        return response()->json([
            'success' => true,
            'data' => $rematador,
            'message' => 'Rematador actualizado correctamente'
        ]);

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'success' => false,
            'errors' => $e->errors(),
            'message' => 'Error de validación'
        ], 422);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error al actualizar rematador: ' . $e->getMessage()
        ], 500);
    }
}


    public function subastas($id)
{
    try {
        $subastas = $this->rematadorService->obtenerSubastasPorRematador($id);
        
        return response()->json([
            'success' => true,
            'data' => $subastas,
            'count' => $subastas->count(),
            'message' => $subastas->isEmpty() 
                ? 'El rematador no tiene subastas registradas' 
                : 'Subastas obtenidas correctamente'
        ]);
        
    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Rematador no encontrado'
        ], 404);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error al obtener subastas: ' . $e->getMessage()
        ], 500);
    }
}


    /**
     * Obtener agenda de subastas aceptadas del rematador
     */
    public function obtenerAgenda($id)
{
    try {
        $subastas = $this->rematadorService->obtenerAgendaRematador($id);
        
        return response()->json([
            'success' => true,
            'data' => $subastas,
            'count' => $subastas->count(),
            'message' => $subastas->isEmpty() 
                ? 'El rematador no tiene subastas programadas' 
                : 'Agenda de subastas obtenida correctamente'
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error al obtener agenda: ' . $e->getMessage()
        ], 500);
    }
}

/**
 * Obtener subastas solicitadas al rematador
 */
public function obtenerSubastasSolicitadas($id)
{
    try {
        $subastas = $this->rematadorService->obtenerSubastasSolicitadas($id);
        
        return response()->json([
            'success' => true,
            'data' => $subastas,
            'count' => $subastas->count(),
            'message' => $subastas->isEmpty() 
                ? 'No hay subastas pendientes de aprobación' 
                : 'Subastas solicitadas obtenidas correctamente'
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error al obtener subastas solicitadas: ' . $e->getMessage()
        ], 500);
    }
}

/**
 * Aceptar una subasta solicitada
 */
public function aceptarSubasta($id, $subastaId)
{
    try {
        $subasta = $this->rematadorService->aceptarSubasta($id, $subastaId);
        
        return response()->json([
            'success' => true,
            'data' => $subasta,
            'message' => 'Subasta aceptada correctamente'
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error al aceptar subasta: ' . $e->getMessage()
        ], 500);
    }
}

/**
 * Rechazar/cancelar una subasta
 */
public function rechazarSubasta($id, $subastaId)
{
    try {
        $subasta = $this->rematadorService->rechazarSubasta($id, $subastaId);
        
        return response()->json([
            'success' => true,
            'data' => $subasta,
            'message' => 'Subasta cancelada correctamente'
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error al cancelar subasta: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
