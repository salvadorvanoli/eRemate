<?php

namespace App\Services\PayPal;

use App\Models\Factura;
use App\Models\Compra;
use App\Models\UsuarioRegistrado;
use App\Models\Chat;
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
            // Verificar que las credenciales existan
            if (empty($this->clientId) || empty($this->clientSecret)) {
                Log::error('PayPal credentials missing', [
                    'clientIdExists' => !empty($this->clientId),
                    'clientSecretExists' => !empty($this->clientSecret)
                ]);
                throw new \Exception('Las credenciales de PayPal no están configuradas correctamente');
            }

            // Deshabilitar SSL
            $response = Http::withBasicAuth($this->clientId, $this->clientSecret)
                ->withOptions([
                    'verify' => false, 
                ])
                ->asForm()
                ->post($this->baseUrl . '/v1/oauth2/token', [
                    'grant_type' => 'client_credentials'
                ]);

            if ($response->successful()) {
                return $response->json()['access_token'];
            }

            Log::error('Error al obtener token de PayPal', [
                'statusCode' => $response->status(),
                'response' => $response->body()
            ]);
            throw new \Exception('Error al obtener token de PayPal: ' . $response->body());
        } catch (\Exception $e) {
            Log::error('Error obteniendo token PayPal: ' . $e->getMessage());
            throw $e;
        }
    }

    private function buildPaymentData($monto, $metodoEntrega, $usuarioRegistradoId, $chatId = null): array {
        return [
            'intent' => 'sale',
            'payer' => [
                'payment_method' => 'paypal'
            ],
            'transactions' => [
                [
                    'amount' => [
                        'total' => number_format($monto, 2, '.', ''),
                        'currency' => config('paypal.currency', 'USD')
                    ],
                    'description' => 'Pago de subasta - eRemate',
                    'custom' => json_encode([
                        'usuario_registrado_id' => $usuarioRegistradoId,
                        'metodo_entrega' => $metodoEntrega,
                        'chat_id' => $chatId
                    ])
                ]
            ],
            'redirect_urls' => [
                'return_url' => config('app.paypal_success_url', 'http://localhost:4200/pago/exitoso'),
                'cancel_url' => config('app.paypal_cancel_url', 'http://localhost:4200/pago/cancelado')
            ]
        ];
    }

    public function crearPago(float $monto, string $metodoEntrega, int $usuarioRegistradoId): mixed
    {
        try {
            $usuario = UsuarioRegistrado::find($usuarioRegistradoId);
            if (!$usuario) {
                return [
                    'success' => false,
                    'error' => 'Usuario registrado no encontrado'
                ];
            }

            $accessToken = $this->obtenerAccessToken();
            $paymentData = $this->buildPaymentData($monto, $metodoEntrega, $usuarioRegistradoId);

            $response = Http::withToken($accessToken)
                ->withOptions([
                    'verify' => false, 
                ])
                ->post($this->baseUrl . '/v1/payments/payment', $paymentData);

            if ($response->successful()) {
                $payment = $response->json();
                
                return [
                    'success' => true,
                    'data' => [
                        'payment_id' => $payment['id'],
                        'approval_url' => collect($payment['links'])->firstWhere('rel', 'approval_url')['href']
                    ]
                ];
            }

            throw new \Exception('Error al crear pago en PayPal: ' . $response->body());

        } catch (\Exception $e) {
            Log::error('Error creando pago PayPal: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Error al procesar el pago: ' . $e->getMessage()
            ];
        }
    }

    public function crearPagoDesdeChatId(float $monto, string $metodoEntrega, int $chatId): mixed
    {
        try {
            // Obtener el chat y el usuario registrado
            $chat = Chat::find($chatId);
            if (!$chat) {
                return [
                    'success' => false,
                    'error' => 'Chat no encontrado'
                ];
            }

            $usuarioRegistradoId = $chat->usuarioRegistrado_id;
            if (!$usuarioRegistradoId) {
                Log::error("Chat ID {$chatId} no tiene usuarioRegistrado_id");
                return [
                    'success' => false,
                    'error' => 'El chat no tiene un usuario registrado asociado'
                ];
            }
            
            // Verificar que el usuario exista
            $usuarioRegistrado = UsuarioRegistrado::find($usuarioRegistradoId);
            if (!$usuarioRegistrado) {
                return [
                    'success' => false,
                    'error' => 'Usuario registrado no encontrado'
                ];
            }

            $accessToken = $this->obtenerAccessToken();
            $paymentData = $this->buildPaymentData($monto, $metodoEntrega, $usuarioRegistradoId, $chatId);
            
            $response = Http::withToken($accessToken)
                ->withOptions([
                    'verify' => false, 
                ])
                ->post($this->baseUrl . '/v1/payments/payment', $paymentData);

            if ($response->successful()) {
                $payment = $response->json();
                
                // Verificar que approval_url existe
                $approvalLink = collect($payment['links'] ?? [])->firstWhere('rel', 'approval_url');
                
                if (!$approvalLink || !isset($approvalLink['href'])) {
                    Log::error('Missing approval_url in PayPal response', ['payment' => $payment]);
                    throw new \Exception('No se pudo obtener la URL de aprobación de PayPal');
                }
            } else {
                Log::error('PayPal API error response', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Error al crear pago en PayPal: ' . $response->body());
            }

            // Verificar si hay una solicitud de pago pendiente para este chat con el mismo monto
            $paymentRequest = \App\Models\PaymentRequest::where('chat_id', $chatId)
                ->where('monto', $monto)
                ->where('metodo_entrega', $metodoEntrega)
                ->where('estado', 'pendiente')
                ->first();
            
            return [
                'success' => true,
                'data' => [
                    'payment_id' => $payment['id'],
                    'approval_url' => $approvalLink['href'],
                    'chat_id' => $chatId,
                    'payment_request_id' => $paymentRequest ? $paymentRequest->id : null
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Error creando pago PayPal desde chat: ' . $e->getMessage(), [
                'exception' => $e->getTraceAsString(),
                'chat_id' => $chatId,
                'monto' => $monto,
                'metodo_entrega' => $metodoEntrega
            ]);
            
            return [
                'success' => false,
                'error' => 'Error al procesar el pago: ' . $e->getMessage()
            ];
        }
    }

    public function ejecutarPago(string $paymentId, string $payerId, int $usuarioRegistradoId): mixed
    {
        try {
            // Verificar si este pago ya fue procesado anteriormente
            $facturaExistente = Factura::where('payment_id', $paymentId)->first();
            if ($facturaExistente) {
                
                // Obtener la compra asociada
                $compra = $facturaExistente->compra;
                
                return [
                    'success' => true,
                    'data' => [
                        'payment_id' => $paymentId,
                        'factura' => $facturaExistente,
                        'compra' => $compra,
                        'chat_id' => null // No tenemos chat_id en facturas existentes
                    ],
                    'message' => 'Pago ya procesado anteriormente'
                ];
            }
            
            $accessToken = $this->obtenerAccessToken();

            // Ejecutar el pago en PayPal
            $response = Http::withToken($accessToken)
                ->withOptions([
                    'verify' => false, 
                ])
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
            $chatId = $customData['chat_id'] ?? null;

            // Si el ID de usuario no coincide con el del chat, priorizar el del chat
            if ($chatId) {
                $chat = Chat::find($chatId);
                if ($chat && $chat->usuarioRegistrado_id) {
                    $usuarioRegistradoId = $chat->usuarioRegistrado_id;
                }
            }

            // Crear factura con metodoPago PAYPAL y payment_id
            $factura = Factura::create([
                'monto' => $monto,
                'metodoEntrega' => $metodoEntrega,
                'metodoPago' => MetodoPago::PAYPAL,
                'payment_id' => $paymentId
            ]);

            // Crear compra asociada al usuario registrado
            $compra = Compra::create([
                'usuarioRegistrado_id' => $usuarioRegistradoId,
                'factura_id' => $factura->id
            ]);

            // Si el pago viene de un chat, enviar un mensaje de confirmación
            if ($chatId) {
                try {
                    $mensaje = \App\Models\Mensaje::create([
                        'contenido' => "💵 Se ha generado la factura #" . $factura->id . " por un monto de $" . $monto . ". Método de pago: PayPal. Método de entrega: " . $metodoEntrega,
                        'chat_id' => $chatId,
                        'usuario_id' => $usuarioRegistradoId,
                        'tipo' => 'factura'
                    ]);

                    \App\Events\NuevoMensajeEvent::dispatch($mensaje);
                } catch (\Exception $e) {
                    \Log::error("Error al enviar mensaje de confirmación: " . $e->getMessage());
                    // No detener el proceso por un error en el mensaje
                }
            }

            return [
                'success' => true,
                'data' => [
                    'payment_id' => $paymentId,
                    'factura' => $factura,
                    'compra' => $compra,
                    'chat_id' => $chatId
                ],
                'message' => 'Pago procesado exitosamente y factura generada'
            ];

        } catch (\Exception $e) {
            Log::error('Error ejecutando pago PayPal: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Error al ejecutar el pago: ' . $e->getMessage()
            ];
        }
    }

    public function cancelarPago(string $paymentId): mixed
    {
        try {            
            return [
                'success' => true,
                'message' => 'Pago cancelado correctamente'
            ];

        } catch (\Exception $e) {
            Log::error('Error cancelando pago PayPal: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Error al cancelar el pago: ' . $e->getMessage()
            ];
        }
    }

    public function obtenerEstadoPago(string $paymentId): mixed
    {
        try {
            $accessToken = $this->obtenerAccessToken();

            $response = Http::withToken($accessToken)
                ->withOptions([
                    'verify' => false, 
                ])
                ->get($this->baseUrl . "/v1/payments/payment/{$paymentId}");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()
                ];
            }

            throw new \Exception('Error al obtener estado del pago: ' . $response->body());

        } catch (\Exception $e) {
            Log::error('Error obteniendo estado de pago PayPal: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Error al obtener estado del pago: ' . $e->getMessage()
            ];
        }
    }

    public function verificarCredenciales(): bool
    {
        try {
            // Verificar que las credenciales estén configuradas
            if (empty($this->clientId) || empty($this->clientSecret)) {
                Log::error('Credenciales de PayPal no configuradas correctamente', [
                    'clientIdConfigured' => !empty($this->clientId),
                    'clientSecretConfigured' => !empty($this->clientSecret)
                ]);
                return false;
            }
            
            // Intentar obtener un token para verificar las credenciales
            $accessToken = $this->obtenerAccessToken();
            return !empty($accessToken);
        } catch (\Exception $e) {
            Log::error('Error verificando credenciales de PayPal: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }
}
