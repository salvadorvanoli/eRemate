<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\UsuarioRegistrado\UsuarioRegistradoServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;

class UsuarioRegistradoController extends Controller
{
    protected $usuarioRegistradoService;

    public function __construct(UsuarioRegistradoServiceInterface $usuarioRegistradoService)
    {
        $this->usuarioRegistradoService = $usuarioRegistradoService;
    }

    // Obtener métodos de pago registrados
    public function getMetodosPago($id)
    {
        try {
            return response()->json($this->usuarioRegistradoService->obtenerMetodosPago($id));
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener los métodos de pago: ' . $e->getMessage()], 500);
        }
    }

    // Agregar un método de pago
    public function addMetodoPago(Request $request, $id)
    {
        try {
            $request->validate([
                'metodo_pago' => 'required|string'
            ]);
            $metodos = $this->usuarioRegistradoService->agregarMetodoPago($id, $request->metodo_pago);
            return response()->json($metodos);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Error de validación',
                'mensajes' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al agregar el método de pago: ' . $e->getMessage()], 500);
        }
    }

    // Obtener historial de compras
    public function getHistorialCompras($id)
    {
        try {
            return response()->json($this->usuarioRegistradoService->obtenerHistorialCompras($id));
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener el historial de compras: ' . $e->getMessage()], 500);
        }
    }
}