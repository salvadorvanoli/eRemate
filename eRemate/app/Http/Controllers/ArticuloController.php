<?php

namespace App\Http\Controllers;

use App\Models\Articulo;
use App\Services\Articulo\ArticuloServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ArticuloController extends Controller
{
    protected $articuloService;
    
    public function __construct(ArticuloServiceInterface $articuloService)
    {
        $this->articuloService = $articuloService;
    }
    
    public function crearArticulo(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'lote_id' => 'required|exists:lotes,id',
                'nombre' => [
                    'required',
                    'string',
                    'max:255',
                    function ($attribute, $value, $fail) use ($request) {
                        // Verificar si ya existe un artículo con el mismo nombre en este lote
                        $existe = Articulo::where('lote_id', $request->lote_id)
                                          ->where('nombre', $value)
                                          ->exists();
                        
                        if ($existe) {
                            $fail('Ya existe un artículo con este nombre en el lote seleccionado.');
                        }
                    }
                ],
                'imagenes' => 'required|array',
                'especificacionesTecnicas' => 'required|string',
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
    }
    
    public function obtenerArticulo(int $id) {
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
    }
    
    public function actualizarArticulo(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'lote_id' => 'sometimes|required|exists:lotes,id',
                'nombre' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:255',
                    function ($attribute, $value, $fail) use ($request, $id) {
                        $query = Articulo::where('lote_id', $request->lote_id ?? Articulo::findOrFail($id)->lote_id)
                                        ->where('nombre', $value)
                                        ->where('id', '!=', $id);
                        
                        if ($query->exists()) {
                            $fail('Ya existe otro artículo con este nombre en el mismo lote.');
                        }
                    }
                ],
                'imagenes' => 'sometimes|required|array',
                'especificacionesTecnicas' => 'sometimes|required|string',
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

    public function obtenerArticulosOrdenados()
    {
        try {
            $articulos = $this->articuloService->obtenerArticulosOrdenados();

            if ($articulos instanceof JsonResponse) {
                return $articulos;
            }

            return response()->json([
                'success' => true,
                'data' => $articulos,
                'message' => 'Artículos ordenados obtenidas correctamente'
            ], 200);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener artículos ordenados: ' . $e->getMessage()
            ], 500);
        }
    }

    public function obtenerArticulosFiltrados(Request $request)
    {
        try {
            $textoBusqueda = $request->query('textoBusqueda', null);
            $cerrada = filter_var($request->query('cerrada', false), FILTER_VALIDATE_BOOLEAN);
            $categoria = $request->query('categoria', null);
            $ubicacion = $request->query('ubicacion', null);
            $fechaCierreLimite = $request->query('fechaCierreLimite', null);
            
            $data = [
                'textoBusqueda' => $textoBusqueda,
                'cerrada' => $cerrada,
                'categoria' => $categoria,
                'ubicacion' => $ubicacion,
                'fechaCierreLimite' => $fechaCierreLimite,
            ];

            $articulos = $this->articuloService->obtenerArticulosFiltrados($data);

            if ($articulos instanceof JsonResponse) {
                return $articulos;
            }

            return response()->json([
                'success' => true,
                'data' => $articulos,
                'message' => 'Artículos filtrados obtenidas correctamente'
            ], 200);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener artículos filtrados: ' . $e->getMessage()
            ], 500);
        }
    }

    public function obtenerCategorias()
    {
        try {
            $categorias = $this->articuloService->obtenerCategorias();

            if ($categorias instanceof JsonResponse) {
                return $categorias;
            }

            return response()->json([
                'success' => true,
                'data' => $categorias,
                'message' => 'Categorías obtenidas correctamente'
            ], 200);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener categorías: ' . $e->getMessage()
            ], 500);
        }
    }
}
