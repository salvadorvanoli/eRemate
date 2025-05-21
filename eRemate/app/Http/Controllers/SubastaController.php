<?php

namespace App\Http\Controllers;

use App\Models\Subasta;
use Illuminate\Http\Request;
use App\Services\Subasta\SubastaServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class SubastaController extends Controller
{
    protected $subastaService;
    
    public function __construct(SubastaServiceInterface $subastaService)
    {
        $this->subastaService = $subastaService;
    }
    
    public function crearSubasta(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'rematador_id' => 'nullable|exists:usuarios,id',
                'mensajes' => 'nullable|array',
                'urlTransmision' => 'required|string',
                'tipoSubasta' => 'required|string',
                'fechaInicio' => 'required|date',
                'fechaCierre' => 'required|date|after:fechaInicio',
                'ubicacion' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Error de validación',
                    'details' => $validator->errors()
                ], 422);
            }
            
            $data = $validator->validated();
            
            $subasta = $this->subastaService->crearSubasta($data);

            if (!$subasta instanceof Subasta) {
                return $subasta;
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Subasta creada exitosamente',
                'data' => $subasta
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error al crear subasta: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al crear subasta',
                'details' => $e->getMessage()
            ], 500);
        }
    }
    
    public function obtenerSubasta(int $id) {
        try {
            $subasta = $this->subastaService->obtenerSubasta($id);

            if (!$subasta instanceof Subasta) {
                return $subasta;
            }

            return response()->json([
                'success' => true,
                'data' => $subasta
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener subasta: ' . $e->getMessage()
            ], 500);
        }
    }

    public function actualizarSubasta(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'rematador_id' => 'sometimes|nullable|exists:usuarios,id',
                'mensajes' => 'sometimes|nullable|array',
                'urlTransmision' => 'sometimes|required|string',
                'tipoSubasta' => 'sometimes|required|string',
                'fechaInicio' => 'sometimes|required|date',
                'fechaCierre' => 'sometimes|required|date|after:fechaInicio',
                'ubicacion' => 'sometimes|required|string'
            ]);

            $subasta = $this->subastaService->actualizarSubasta($id, $data);

            if (!$subasta instanceof Subasta) {
                return $subasta;
            }

            return response()->json([
                'success' => true,
                'data' => $subasta,
                'message' => 'Subasta actualizada correctamente'
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors(),
                'message' => 'Error de validación'
            ], 422);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar subasta: ' . $e->getMessage()
            ], 500);
        }
    }

    public function obtenerSubastas()
    {
        try {
            $subastas = $this->subastaService->obtenerSubastas();

            if ($subastas instanceof JsonResponse) {
                return $subastas;
            }

            return response()->json([
                'success' => true,
                'data' => $subastas,
                'message' => 'Subastas obtenidas correctamente'
            ], 200);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener subastas: ' . $e->getMessage()
            ], 500);
        }
    }

    public function obtenerLotes($id)
    {
        try {
            $lotes = $this->subastaService->obtenerLotes($id);

            if ($lotes instanceof JsonResponse) {
                return $lotes;
            }

            return response()->json([
                'success' => true,
                'data' => $lotes,
                'message' => 'Lotes obtenidos correctamente'
            ], 200);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener lotes: ' . $e->getMessage()
            ], 500);
        }
    }
}
