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
                'identificacionFiscal' => 'sometimes|required|string|max:255',
                'nombreLegal' => 'sometimes|required|string|max:255',
                'domicilio' => 'sometimes|nullable|string|max:255',
                'email' => 'sometimes|nullable|email|max:255',
                'telefono' => 'sometimes|nullable|string|max:255',
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
                'message' => 'Error al obtener rematadores: ' . $e->getMessage()
            ], 500);
        }
        
    }

    public function obtenerSubastas($id)
    {
        try {
            $subastas = $this->casaDeRematesService->obtenerSubastas($id);

            if ($subastas instanceof JsonResponse) {
                return $subastas;
            }

            return response()->json([
                'success' => true,
                'data' => $subastas,
                'message' => 'Subastas obtenidas correctamente'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Casa de remates no encontrada'
        ], 404);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener subastas: ' . $e->getMessage()
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

    public function estadisticaVentas(Request $request, $id)
    {
        try {
            $year = $request->query('year', now()->year);
            
            // Validar que el año sea válido
            if (!is_numeric($year) || $year < 1900 || $year > now()->year + 10) {
                return response()->json([
                    'success' => false,
                    'message' => 'Año inválido'
                ], 422);
            }

            $estadisticas = $this->casaDeRematesService->estadisticaVentas($id, (int)$year);

            if (isset($estadisticas['success']) && $estadisticas['success']) {
                return response()->json($estadisticas, 200);
            }

            return $estadisticas;

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas de ventas: ' . $e->getMessage()
            ], 500);
        }
    }

    public function estadisticasPorCategoria(Request $request, $id)
    {
        try {
            $year = $request->query('year', now()->year);
            
            // Validar que el año sea válido
            if (!is_numeric($year) || $year < 1900 || $year > now()->year + 10) {
                return response()->json([
                    'success' => false,
                    'message' => 'Año inválido'
                ], 422);
            }

            $estadisticas = $this->casaDeRematesService->estadisticasPorCategoria($id, (int)$year);

            if (isset($estadisticas['success']) && $estadisticas['success']) {
                return response()->json($estadisticas, 200);
            }

            return response()->json($estadisticas, 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas por categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    public function estadisticasPujas(Request $request, $id)
    {
        try {
            $estadisticas = $this->casaDeRematesService->estadisticasPujas($id);

            if (isset($estadisticas['success']) && $estadisticas['success']) {
                return response()->json($estadisticas, 200);
            }

            return response()->json($estadisticas, 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas de pujas: ' . $e->getMessage()
            ], 500);
        }
    }

}
