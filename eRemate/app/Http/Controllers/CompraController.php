<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Compra\CompraServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;

class CompraController extends Controller
{
    protected $compraService;

    public function __construct(CompraServiceInterface $compraService)
    {
        $this->compraService = $compraService;
    }

    // Obtener todas las compras
    public function index()
    {
        try {
            return response()->json($this->compraService->obtenerTodas());
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener las compras: ' . $e->getMessage()], 500);
        }
    }

    // Obtener una compra específica
    public function show($id)
    {
        try {
            return response()->json($this->compraService->buscarPorId($id));
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Compra no encontrada'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener la compra: ' . $e->getMessage()], 500);
        }
    }

    // Crear una nueva compra
    public function store(Request $request)
    {
        try {
            $datos = $request->validate([
                'usuarioRegistrado_id' => 'required|exists:usuarios_registrados,id',
                'factura_id' => 'nullable|exists:facturas,id'
            ]);

            $compra = $this->compraService->crear($datos);
            return response()->json($compra, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Error de validación',
                'mensajes' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al crear la compra: ' . $e->getMessage()], 500);
        }
    }

    // Actualizar una compra existente
    public function update(Request $request, $id)
    {
        try {
            $datos = $request->validate([
                'usuarioRegistrado_id' => 'sometimes|exists:usuarios_registrados,id',
                'factura_id' => 'nullable|exists:facturas,id'
            ]);

            $compra = $this->compraService->actualizar($id, $datos);
            return response()->json($compra);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Compra no encontrada'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Error de validación',
                'mensajes' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al actualizar la compra: ' . $e->getMessage()], 500);
        }
    }

    // Eliminar una compra
    public function destroy($id)
    {
        try {
            $this->compraService->eliminar($id);
            return response()->json(null, 204);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Compra no encontrada'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al eliminar la compra: ' . $e->getMessage()], 500);
        }
    }
}