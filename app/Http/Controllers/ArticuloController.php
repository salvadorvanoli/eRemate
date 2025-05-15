<?php

namespace App\Http\Controllers;

use App\Models\Articulo;
use Illuminate\Http\Request;
use App\Http\Services\ArticuloService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ArticuloController extends Controller
{
    protected $articuloService;
    
    public function __construct(ArticuloService $articuloService)
    {
        $this->articuloService = $articuloService;
    }    public function crearArticulo(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'lote_id' => 'required|exists:lotes,id',
                'imagenes' => 'required|array',
                'especificacionesTecnicas' => 'required|array',
                'estado' => 'required|string|max:255',
                'categoria_id' => 'nullable|exists:categorias,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Error de validación',
                    'details' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();
            
            $articulo = $this->articuloService->crearArticulo($data);

            if (!$articulo instanceof Articulo) {
                return $articulo;
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Artículo creado exitosamente',
                'data' => $articulo
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error al crear artículo: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al crear artículo',
                'details' => $e->getMessage()
            ], 500);
        }
    }    public function obtenerArticulo(int $id) {
        try {
            $articulo = $this->articuloService->obtenerArticulo($id);

            if (!$articulo instanceof Articulo) {
                return $articulo;
            }

            return response()->json([
                'success' => true,
                'data' => $articulo
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener artículo: ' . $e->getMessage()
            ], 500);
        }
    }    public function actualizarArticulo(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'lote_id' => 'sometimes|required|exists:lotes,id',
                'imagenes' => 'sometimes|required|array',
                'especificacionesTecnicas' => 'sometimes|required|array',
                'estado' => 'sometimes|required|string|max:255',
                'categoria_id' => 'sometimes|nullable|exists:categorias,id'
            ]);

            $articulo = $this->articuloService->actualizarArticulo($id, $data);

            if (!$articulo instanceof Articulo) {
                return $articulo;
            }

            return response()->json([
                'success' => true,
                'data' => $articulo,
                'message' => 'Artículo actualizado correctamente'
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
                'message' => 'Error al actualizar artículo: ' . $e->getMessage()
            ], 500);
        }
    }

    public function obtenerArticulos()
    {
        try {
            $articulos = $this->articuloService->obtenerArticulos();

            if ($articulos instanceof JsonResponse) {
                return $articulos;
            }

            return response()->json([
                'success' => true,
                'data' => $articulos,
                'message' => 'Artículos obtenidos correctamente'
            ], 200);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener artículos: ' . $e->getMessage()
            ], 500);
        }
    }
}
