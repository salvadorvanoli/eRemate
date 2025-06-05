<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Calificacion\CalificacionServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;

class CalificacionController extends Controller
{
    protected $calificacionService;

    public function __construct(CalificacionServiceInterface $calificacionService)
    {
        $this->calificacionService = $calificacionService;
    }

    // Obtener todos
    public function index()
    {
        try {
            return response()->json($this->calificacionService->obtenerTodas());
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener las calificaciones: ' . $e->getMessage()], 500);
        }
    }

    // Obtener uno por ID
    public function show($id)
    {
        try {
            return response()->json($this->calificacionService->buscarPorId($id));
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Calificación no encontrada'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener la calificación: ' . $e->getMessage()], 500);
        }
    }

    // Crear nuevo
    public function store(Request $request)
    {
        try {
            $datos = $request->validate([
                'puntaje' => 'required|integer|min:1|max:5',
                'usuarioRegistrado_id' => 'required|exists:usuarios_registrados,id',
                'lote_id' => 'required|exists:lotes,id' // Cambiado de compra_id a lote_id
            ]);

            $calificacion = $this->calificacionService->crear($datos);
            return response()->json($calificacion, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Error de validación',
                'mensajes' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al crear la calificación: ' . $e->getMessage()], 500);
        }
    }

    // Actualizar existente
    public function update(Request $request, $id)
    {
        try {
            $datos = $request->validate([
                'puntaje' => 'sometimes|integer|min:1|max:5',
                'usuarioRegistrado_id' => 'sometimes|exists:usuarios_registrados,id',
                'lote_id' => 'sometimes|exists:lotes,id' // Cambiado de compra_id a lote_id
            ]);

            $calificacion = $this->calificacionService->actualizar($id, $datos);
            return response()->json($calificacion);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Calificación no encontrada'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Error de validación',
                'mensajes' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al actualizar la calificación: ' . $e->getMessage()], 500);
        }
    }

    // Eliminar
    public function destroy($id)
    {
        try {
            $this->calificacionService->eliminar($id);
            return response()->json(null, 204);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Calificación no encontrada'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al eliminar la calificación: ' . $e->getMessage()], 500);
        }
    }

    // Obtener por lote - Cambiado de getByCompra a getByLote
    public function getByLote($loteId)
    {
        $calificacion = $this->calificacionService->obtenerPorLote($loteId);
        return response()->json($calificacion);
    }
}