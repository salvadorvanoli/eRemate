<?php

namespace App\Services\PayPal;

use App\Models\Factura;
use App\Models\Compra;
use App\Models\UsuarioRegistrado;
use App\Enums\MetodoPago;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayPalService implements PayPalServiceInterface
{
    private $clientId;
    private $clientSecret;
    private $baseUrl;

    public function __construct()
    {
        $this->clientId = config('paypal.client_id');
        $this->clientSecret = config('paypal.client_secret');
        $this->baseUrl = config('paypal.base_url');
    }

    private function obtenerAccessToken()
    {
        try {
            $response = Http::withBasicAuth($this->clientId, $this->clientSecret)
                ->asForm()
                ->post($this->baseUrl . '/v1/oauth2/token', [
                    'grant_type' => 'client_credentials'
                ]);

            if ($response->successful()) {
                return $response->json()['access_token'];
            }

            throw new \Exception('Error al obtener token de PayPal: ' . $response->body());
        } catch (\Exception $e) {
            Log::error('Error obteniendo token PayPal: ' . $e->getMessage());
            throw $e;
        }
    }

    public function crearPago(float $monto, string $metodoEntrega, int $usuarioRegistradoId): mixed
    {
        try {
            $usuario = UsuarioRegistrado::find($usuarioRegistradoId);
            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'error' => 'Usuario registrado no encontrado'
                ], 404);
            }

            $accessToken = $this->obtenerAccessToken();

            $paymentData = [
                'intent' => 'sale',
                'payer' => [
                    'payment_method' => 'paypal'
                ],
                'transactions' => [
                    [
                        'amount' => [
                            'total' => number_format($monto, 2, '.', ''),
                            'currency' => 'USD'
                        ],
                        'description' => 'Pago de subasta - eRemate',
                        'custom' => json_encode([
                            'usuario_registrado_id' => $usuarioRegistradoId,
                            'metodo_entrega' => $metodoEntrega
                        ])
                    ]
                ],
                'redirect_urls' => [
                    'return_url' => config('app.url') . '/api/paypal/success',
                    'cancel_url' => config('app.url') . '/api/paypal/cancel'
                ]
            ];

            $response = Http::withToken($accessToken)
                ->post($this->baseUrl . '/v1/payments/payment', $paymentData);

            if ($response->successful()) {
                $payment = $response->json();
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'payment_id' => $payment['id'],
                        'approval_url' => collect($payment['links'])->firstWhere('rel', 'approval_url')['href']
                    ]
                ], 200);
            }

            throw new \Exception('Error al crear pago en PayPal: ' . $response->body());

        } catch (\Exception $e) {
            Log::error('Error creando pago PayPal: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al procesar el pago: ' . $e->getMessage()
            ], 500);
        }
    }

    public function ejecutarPago(string $paymentId, string $payerId, int $usuarioRegistradoId): mixed
    {
        try {
            $accessToken = $this->obtenerAccessToken();

            // Ejecutar el pago en PayPal
            $response = Http::withToken($accessToken)
                ->post($this->baseUrl . "/v1/payments/payment/{$paymentId}/execute", [
                    'payer_id' => $payerId
                ]);

            if (!$response->successful()) {
                throw new \Exception('Error al ejecutar pago en PayPal: ' . $response->body());
            }

            $paymentData = $response->json();
            
            // Obtener información del pago
            $transaction = $paymentData['transactions'][0];
            $monto = floatval($transaction['amount']['total']);
            $customData = json_decode($transaction['custom'], true);
            $metodoEntrega = $customData['metodo_entrega'];

            // Crear factura
            $factura = Factura::create([
                'monto' => $monto,
                'metodoEntrega' => $metodoEntrega,
                'metodoPago' => MetodoPago::PAYPAL
            ]);

            // Crear compra
            $compra = Compra::create([
                'usuarioRegistrado_id' => $usuarioRegistradoId,
                'factura_id' => $factura->id
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'payment_id' => $paymentId,
                    'factura' => $factura,
                    'compra' => $compra
                ],
                'message' => 'Pago procesado exitosamente'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error ejecutando pago PayPal: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al ejecutar el pago: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cancelarPago(string $paymentId): mixed
    {
        try {
            Log::info("Pago cancelado: {$paymentId}");
            
            return response()->json([
                'success' => true,
                'message' => 'Pago cancelado correctamente'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error cancelando pago PayPal: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al cancelar el pago: ' . $e->getMessage()
            ], 500);
        }
    }

    public function obtenerEstadoPago(string $paymentId): mixed
    {
        try {
            $accessToken = $this->obtenerAccessToken();

            $response = Http::withToken($accessToken)
                ->get($this->baseUrl . "/v1/payments/payment/{$paymentId}");

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'data' => $response->json()
                ], 200);
            }

            throw new \Exception('Error al obtener estado del pago: ' . $response->body());

        } catch (\Exception $e) {
            Log::error('Error obteniendo estado de pago PayPal: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al obtener estado del pago: ' . $e->getMessage()
            ], 500);
        }
    }
}
