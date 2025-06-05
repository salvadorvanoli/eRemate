<?php

namespace App\Http\Controllers;

use App\Models\Lote;
use Illuminate\Http\Request;
use App\Services\Lote\LoteServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class LoteController extends Controller
{
    protected $loteService;
    public function __construct(LoteServiceInterface $loteService)
    {
        $this->loteService = $loteService;
    }

    public function crearLote(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'subasta_id' => 'required|exists:subastas,id',
                'nombre' => 'required|string|max:255',
                'descripcion' => 'required|string',
                'valorBase' => 'required|numeric|min:0',
                'pujaMinima' => 'required|numeric|min:0',
                'disponibilidad' => 'required|string|max:255',
                'condicionesDeEntrega' => 'required|string|max:255',
                'vendedorExterno' => 'sometimes|boolean' 
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Error de validación',
                    'details' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();

            $lote = $this->loteService->crearLote($data);

            if (!$lote instanceof Lote) {
                return $lote;
            }

            return response()->json([
                'success' => true,
                'message' => 'Lote creado exitosamente',
                'data' => $lote
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error al crear lote: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al crear lote',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function obtenerLote(int $id)
    {
        try {
            $lote = $this->loteService->obtenerLote($id);

            if (!$lote instanceof Lote) {
                return $lote;
            }

            return response()->json([
                'success' => true,
                'data' => $lote
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener lote: ' . $e->getMessage()
            ], 500);
        }
    }

    public function actualizarLote(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'subasta_id' => 'sometimes|required|exists:subastas,id',
                'nombre' => 'sometimes|required|string|max:255',
                'descripcion' => 'sometimes|required|string',
                'valorBase' => 'sometimes|required|numeric|min:0',
                'pujaMinima' => 'sometimes|required|numeric|min:0',
                'disponibilidad' => 'sometimes|required|string|max:255',
                'condicionesDeEntrega' => 'sometimes|required|string|max:255',
                'vendedorExterno' => 'sometimes|boolean' // <-- AGREGAR ESTA LÍNEA TAMBIÉN
            ]);

            $lote = $this->loteService->actualizarLote($id, $data);

            if (!$lote instanceof Lote) {
                return $lote;
            }

            return response()->json([
                'success' => true,
                'data' => $lote,
                'message' => 'Lote actualizado correctamente'
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
                'message' => 'Error al actualizar lote: ' . $e->getMessage()
            ], 500);
        }
    }

    public function obtenerArticulos($id)
    {
        try {
            $articulos = $this->loteService->obtenerArticulos($id);

            if ($articulos instanceof JsonResponse) {
                return $articulos;
            }

            return response()->json([
                'success' => true,
                'data' => $articulos,
                'message' => 'Artículos obtenidos correctamente'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lote no encontrado'
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener artículos: ' . $e->getMessage()
            ], 500);
        }
    }

    public function agregarArticulo($id, $articuloId)
    {
        try {

            return $this->loteService->agregarArticulo($id, $articuloId);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lote o artículo no encontrado'
            ], 404);

        } catch (\Illuminate\Database\QueryException $e) {
            if (strpos($e->getMessage(), 'foreign key constraint fails') !== false) {
                return response()->json([
                    'success' => false,
                    'message' => 'El artículo especificado no existe'
                ], 404);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar artículo: ' . $e->getMessage()
            ], 500);
        }
    }

    public function removerArticulo($id, $articuloId)
    {
        try {

            return $this->loteService->removerArticulo($id, $articuloId);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lote o artículo no encontrado'
            ], 404);

        } catch (\Illuminate\Database\QueryException $e) {
            if (strpos($e->getMessage(), 'foreign key constraint fails') !== false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Artículo especificado no existe'
                ], 404);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al remover artículo: ' . $e->getMessage()
            ], 500);
        }
    }

    public function obtenerLotesPorSubasta($subastaId)
    {
        try {
            $lotes = $this->loteService->obtenerLotesPorSubasta($subastaId);

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

    public function eliminarLote($id)
    {
        try {
            return $this->loteService->eliminarLote($id);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar lote: ' . $e->getMessage()
            ], 500);
        }
    }
}
