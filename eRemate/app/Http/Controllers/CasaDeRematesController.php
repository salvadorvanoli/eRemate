<?php

namespace App\Http\Controllers;

use App\Models\CasaDeRemates;
use Illuminate\Http\Request;
use App\Services\CasaDeRemates\CasaDeRematesServiceInterface;
use Illuminate\Http\JsonResponse;

class CasaDeRematesController extends Controller
{
    protected $casaDeRematesService;

    public function __construct(CasaDeRematesServiceInterface $casaDeRematesService)
    {
        $this->casaDeRematesService = $casaDeRematesService;
    }

    public function actualizarCasaDeRemates(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'usuario_id' => 'sometimes|required|integer|exists:usuarios,id',
                'identificacionFiscal' => 'sometimes|required|string|max:255|unique:casas_de_remates,identificacionFiscal,' . $id,
                'nombreLegal' => 'sometimes|required|string|max:255|unique:casas_de_remates,identificacionFiscal,' . $id,
                'domicilio' => 'sometimes|nullable|string|max:255'
            ]);

            $casaDeRemates = $this->casaDeRematesService->actualizarCasaDeRemates($id, $data);

            if (!$casaDeRemates instanceof CasaDeRemates) {
                return $casaDeRemates;
            }

            return response()->json([
                'success' => true,
                'data' => $casaDeRemates,
                'message' => 'Casa de remates actualizada correctamente'
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
                'message' => 'Error al actualizar casa de remates: ' . $e->getMessage()
            ], 500);
        }
    }

    public function obtenerRematadores($id)
    {
        try {
            $rematadores = $this->casaDeRematesService->obtenerRematadores($id);

            if ($rematadores instanceof JsonResponse) {
                return $rematadores;
            }

            return response()->json([
                'success' => true,
                'data' => $rematadores,
                'message' => 'Rematadores obtenidos correctamente'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Casa de remates no encontrada'
        ], 404);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener remates: ' . $e->getMessage()
            ], 500);
        }
        
    }

    public function asignarRematador($id, Request $request)
    {
        try {
            $data = $request->validate([
                'email' => 'required|email|exists:usuarios,email'
            ]);
                
            return $this->casaDeRematesService->asignarRematador($id, $data['email']);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors(),
                'message' => 'Error de validación'
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar rematador: ' . $e->getMessage()
            ], 500);
        }
    }

    public function desasignarRematador($id, $rematadorId)
    {
        try {
            
            return $this->casaDeRematesService->desasignarRematador($id, $rematadorId);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Casa de remates o rematador no encontrado'
            ], 404);

        } catch (\Illuminate\Database\QueryException $e) {
            if (strpos($e->getMessage(), 'foreign key constraint fails') !== false) {
                return response()->json([
                    'success' => false,
                    'message' => 'El rematador especificado no existe'
                ], 404);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al desasignar rematador: ' . $e->getMessage()
            ], 500);
        }
    }

}
