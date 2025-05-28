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
                'casaDeRemates_id' => 'nullable|exists:casas_de_remates,id',
                'rematador_id' => 'nullable|exists:rematadores,id',
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
            $validator = Validator::make($request->all(), [
                'rematador_id' => 'sometimes|nullable|exists:rematadores,id',
                'mensajes' => 'sometimes|nullable|array',
                'urlTransmision' => 'sometimes|required|string',
                'tipoSubasta' => 'sometimes|required|string',
                'fechaInicio' => 'sometimes|required|date',
                'fechaCierre' => 'sometimes|required|date|after:fechaInicio',
                'ubicacion' => 'sometimes|required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Error de validación',
                    'details' => $validator->errors()
                ], 422);
            }
            
            $data = $validator->validated();
            
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

    public function obtenerSubastasOrdenadas()
    {
        try {
            $subastas = $this->subastaService->obtenerSubastasOrdenadas();

            if ($subastas instanceof JsonResponse) {
                return $subastas;
            }

            return response()->json([
                'success' => true,
                'data' => $subastas,
                'message' => 'Subastas ordenadas obtenidas correctamente'
            ], 200);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener subastas ordenadas: ' . $e->getMessage()
            ], 500);
        }
    }

    public function obtenerSubastasFiltradas(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'cerrada' => 'sometimes|nullable|boolean',
                'categoria' => 'sometimes|nullable|numeric|exists:categorias,id',
                'ubicacion' => 'sometimes|nullable|string',
                'fechaCierreLimite' => 'sometimes|nullable|date'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Error de validación',
                    'details' => $validator->errors()
                ], 422);
            }
            
            $data = $validator->validated();

            $subastas = $this->subastaService->obtenerSubastasFiltradas($data);

            if ($subastas instanceof JsonResponse) {
                return $subastas;
            }

            return response()->json([
                'success' => true,
                'data' => $subastas,
                'message' => 'Subastas filtradas obtenidas correctamente'
            ], 200);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener subastas filtradas: ' . $e->getMessage()
            ], 500);
        }
    }

    public function obtenerSubastasOrdenadasPorCierre(Request $request)
    {
        $pagina = $request->query('pagina', 1);
        $cantidad = $request->query('cantidad', 10);

        try {
            $subastas = $this->subastaService->obtenerSubastasOrdenadasPorCierre($pagina, $cantidad);

            if ($subastas instanceof JsonResponse) {
                return $subastas;
            }

            return response()->json([
                'success' => true,
                'data' => $subastas,
                'message' => 'Subastas ordenadas por cierre obtenidas correctamente'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener subastas ordenadas: ' . $e->getMessage()
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

    public function iniciarSubasta($id)
    {
        try {
            $resultado = $this->subastaService->iniciarSubasta($id);

            if ($resultado instanceof JsonResponse) {
                return $resultado;
            }

            return response()->json([
                'success' => true,
                'data' => $resultado,
                'message' => 'Subasta iniciada correctamente'
            ], 200);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al iniciar la subasta: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cerrarSubasta($id)
    {
        try {
            $resultado = $this->subastaService->cerrarSubasta($id);

            if ($resultado instanceof JsonResponse) {
                return $resultado;
            }

            return response()->json([
                'success' => true,
                'data' => $resultado,
                'message' => 'Subasta cerrada correctamente'
            ], 200);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cerrar la subasta: ' . $e->getMessage()
            ], 500);
        }
    }

    public function realizarPuja(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'monto' => 'required|numeric|min:0',
                'lote_id' => 'required|exists:lotes,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Error de validación',
                    'details' => $validator->errors()
                ], 422);
            }
            
            $data = $validator->validated();
            
            $puja = $this->subastaService->realizarPuja($data, $id);

            if ($puja instanceof JsonResponse) {
                return $puja;
            }

            return response()->json([
                'success' => true,
                'data' => $puja,
                'message' => 'Puja realizada correctamente'
            ], 200);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al realizar la puja: ' . $e->getMessage()
            ], 500);
        }
    }

    public function realizarPujaAutomatica(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'presupuesto' => 'required|numeric|min:0',
                'lote_id' => 'required|exists:lotes,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Error de validación',
                    'details' => $validator->errors()
                ], 422);
            }
            
            $data = $validator->validated();
            
            $pujaAutomatica = $this->subastaService->realizarPujaAutomatica($data, $id);

            if ($pujaAutomatica instanceof JsonResponse) {
                return $pujaAutomatica;
            }

            return response()->json([
                'success' => true,
                'data' => $pujaAutomatica,
                'message' => 'Puja automática creada correctamente'
            ], 200);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la puja automática: ' . $e->getMessage()
            ], 500);
        }
    }

    public function obtenerTransmisionEnVivo(int $id)
    {
        try {
            $urlTransmision = $this->subastaService->obtenerTransmisionEnVivo($id);

            if ($urlTransmision instanceof JsonResponse) {
                return $urlTransmision;
            }

            return response()->json([
                'success' => true,
                'data' => $urlTransmision,
                'message' => 'Enlace de la transmisión obtenido correctamente'
            ], 200);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener enlace de la transmisión: ' . $e->getMessage()
            ], 500);
        }
    }
}
