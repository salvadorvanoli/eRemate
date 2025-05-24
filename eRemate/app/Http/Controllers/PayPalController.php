<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\PayPal\PayPalServiceInterface;
use Illuminate\Support\Facades\Validator;

class PayPalController extends Controller
{
    protected $paypalService;

    public function __construct(PayPalServiceInterface $paypalService)
    {
        $this->paypalService = $paypalService;
    }

    public function crearPago(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'monto' => 'required|numeric|min:0.01',
                'metodo_entrega' => 'required|string|max:255',
                'usuario_registrado_id' => 'required|exists:usuarios_registrados,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Error de validación',
                    'details' => $validator->errors()
                ], 422);
            }

            // Verificar que el usuario exista
            $usuarioRegistrado = \App\Models\UsuarioRegistrado::find($request->input('usuario_registrado_id'));
            if (!$usuarioRegistrado) {
                return response()->json([
                    'success' => false,
                    'error' => 'El usuario registrado no existe'
                ], 404);
            }

            $monto = $request->input('monto');
            $metodoEntrega = $request->input('metodo_entrega');
            $usuarioRegistradoId = $request->input('usuario_registrado_id');

            return $this->paypalService->crearPago($monto, $metodoEntrega, $usuarioRegistradoId);

        } catch (\Exception $e) {
            \Log::error('Error en crearPago: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al crear pago',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function ejecutarPago(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'payment_id' => 'required|string',
                'payer_id' => 'required|string',
                'usuario_registrado_id' => 'required|exists:usuarios_registrados,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Error de validación',
                    'details' => $validator->errors()
                ], 422);
            }

            $paymentId = $request->input('payment_id');
            $payerId = $request->input('payer_id');
            $usuarioRegistradoId = $request->input('usuario_registrado_id');

            return $this->paypalService->ejecutarPago($paymentId, $payerId, $usuarioRegistradoId);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al ejecutar pago',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function pagoExitoso(Request $request)
    {
        $paymentId = $request->query('paymentId');
        $payerId = $request->query('PayerID');

        // Redirigir al frontend con los parámetros
        $frontendUrl = config('app.frontend_url') . "/pago/exitoso?paymentId={$paymentId}&PayerID={$payerId}";
        
        return redirect($frontendUrl);
    }

    public function pagoCancelado(Request $request)
    {
        $paymentId = $request->query('paymentId');
        
        $this->paypalService->cancelarPago($paymentId);

        // Redirigir al frontend
        $frontendUrl = config('app.frontend_url') . "/pago/cancelado";
        
        return redirect($frontendUrl);
    }

    public function obtenerEstadoPago($paymentId)
    {
        try {
            return $this->paypalService->obtenerEstadoPago($paymentId);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al obtener estado del pago',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
