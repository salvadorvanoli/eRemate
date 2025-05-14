<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Factura\FacturaServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Enums\MetodoPago;
use Exception;

class FacturaController extends Controller
{
    protected $facturaService;

    public function __construct(FacturaServiceInterface $facturaService)
    {
        $this->facturaService = $facturaService;
    }

    // Obtener todas las facturas
    public function index()
    {
        try {
            return response()->json($this->facturaService->obtenerTodas());
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener las facturas: ' . $e->getMessage()], 500);
        }
    }

    // Obtener una factura específica
    public function show($id)
    {
        try {
            return response()->json($this->facturaService->buscarPorId($id));
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Factura no encontrada'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al mostrar la factura: ' . $e->getMessage()], 500);
        }
    }

    // Crear una nueva factura
    public function store(Request $request)
    {
        try {
            $datos = $request->validate([
                'monto' => 'required|numeric',
                'metodoEntrega' => 'required|string',
                'metodoPago' => 'required|string|in:' . implode(',', MetodoPago::values())
            ]);

            $factura = $this->facturaService->crear($datos);
            return response()->json($factura, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Error de validación',
                'mensajes' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al crear la factura: ' . $e->getMessage()], 500);
        }
    }

    // Eliminar una factura
    public function destroy($id)
    {
        try {
            $this->facturaService->eliminar($id);
            return response()->json(null, 204);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Factura no encontrada'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al eliminar la factura: ' . $e->getMessage()], 500);
        }
    }

    // Descargar el PDF de una factura
    public function descargarPdf($id)
    {
        try {
            return $this->facturaService->generarPdf($id);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Factura no encontrada'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al generar el PDF: ' . $e->getMessage()], 500);
        }
    }
}