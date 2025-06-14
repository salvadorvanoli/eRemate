<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\PayPal\PayPalServiceInterface;
use Illuminate\Support\Facades\Validator;
use App\Models\Chat;
use Illuminate\Support\Facades\Log;

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

            $result = $this->paypalService->crearPago($monto, $metodoEntrega, $usuarioRegistradoId);
            
            if ($result['success']) {
                return response()->json($result, 200);
            } else {
                return response()->json($result, 400);
            }

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
                'usuario_registrado_id' => 'required',
                'chat_id' => 'nullable|exists:chats,id',
                'payment_request_id' => 'nullable|exists:payment_requests,id'
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
            
            // Verificar si este pago ya fue procesado anteriormente
            $facturaExistente = \App\Models\Factura::where('payment_id', $paymentId)->first();
            if ($facturaExistente) {
                \Log::info('Pago ya procesado anteriormente:', [
                    'payment_id' => $paymentId,
                    'factura_id' => $facturaExistente->id
                ]);
                
                // Retornar los datos de la factura existente
                $compra = \App\Models\Compra::where('factura_id', $facturaExistente->id)->first();
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'payment_id' => $paymentId,
                        'factura' => $facturaExistente,
                        'compra' => $compra,
                        'chat_id' => $request->input('chat_id')
                    ],
                    'message' => 'Pago ya procesado anteriormente'
                ], 200);
            }
            
            // Autenticar user
            $usuarioAutenticado = auth()->user();
            if (!$usuarioAutenticado) {
                return response()->json([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
                ], 401);
            }
            
            \Log::info('Datos recibidos en ejecutarPago:', [
                'payment_id' => $paymentId,
                'payer_id' => $payerId,
                'usuario_registrado_id' => $usuarioRegistradoId,
                'chat_id' => $request->input('chat_id'),
                'payment_request_id' => $request->input('payment_request_id'),
                'usuario_autenticado_id' => $usuarioAutenticado->id,
                'all_input' => $request->all()
            ]);
            
            // Si hay un chat_id, verificar permisos
            if ($request->has('chat_id')) {
                $chatId = $request->input('chat_id');
                $chat = \App\Models\Chat::find($chatId);
                
                if (!$chat) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Chat no encontrado'
                    ], 404);
                }
                
                \Log::info('Verificando permisos - Usuario autenticado: ' . $usuarioAutenticado->id . 
                          ', Chat usuario_registrado_id: ' . $chat->usuarioRegistrado_id . 
                          ', Chat casa_de_remate_id: ' . $chat->casa_de_remate_id);
                
                // Verificar permisos basado en el tipo de usuario
                $tienePermiso = false;
                
                if ($usuarioAutenticado->tipo === 'registrado') {
                    // Si es usuario registrad, debe coincidir con el usuario del chat
                    $tienePermiso = ($usuarioAutenticado->id == $chat->usuarioRegistrado_id);
                } elseif ($usuarioAutenticado->tipo === 'casa_de_remate') {
                    // si es casa de remate, debe coincidir con la casa del chat
                    $tienePermiso = ($usuarioAutenticado->id == $chat->casa_de_remate_id);
                }
                
                if (!$tienePermiso) {
                    \Log::warning('Usuario sin permisos para el chat. Tipo: ' . $usuarioAutenticado->tipo . 
                                 ', ID: ' . $usuarioAutenticado->id);
                    return response()->json([
                        'success' => false,
                        'error' => 'No tienes permiso para realizar pagos en este chat'
                    ], 403);
                }
                
                // Asignar el id del usuario registrado del chat (quien recibe el pago)
                $usuarioRegistradoId = $chat->usuarioRegistrado_id;
            }

            $result = $this->paypalService->ejecutarPago($paymentId, $payerId, $usuarioRegistradoId);
            
            // Verificar si el pago fue exitoso antes de continuar
            if (!$result['success']) {
                return response()->json($result, 400);
            }

            // Si hay un id de solicitud de pago, validar y actualizar estado
            if ($request->has('payment_request_id')) {
                $paymentRequestId = $request->input('payment_request_id');
                
                \Log::info('Intentando actualizar payment_request_id: ' . $paymentRequestId);
                
                // Buscar la solicitud de pago
                $paymentRequest = \App\Models\PaymentRequest::find($paymentRequestId);
                
                if ($paymentRequest) {
                    \Log::info('PaymentRequest encontrado, estado actual: ' . $paymentRequest->estado);
                    
                    // Verificar que el usuario autenticado sea el usuario registrado de la solicitud
                    if ($paymentRequest->usuario_registrado_id !== $usuarioAutenticado->id) {
                        \Log::warning('Intento de pago no autorizado - usuario no coincide', [
                            'payment_request_id' => $paymentRequestId,
                            'payment_request_usuario_id' => $paymentRequest->usuario_registrado_id,
                            'usuario_autenticado_id' => $usuarioAutenticado->id,
                            'usuario_autenticado_tipo' => $usuarioAutenticado->tipo
                        ]);
                        
                        return response()->json([
                            'success' => false,
                            'error' => 'No tienes autorización para pagar esta solicitud'
                        ], 403);
                    }
                    
                    // Verificar que la solicitud esté pendiente
                    if ($paymentRequest->estado !== 'pendiente') {
                        \Log::warning('Intento de pago de solicitud no pendiente', [
                            'payment_request_id' => $paymentRequestId,
                            'estado_actual' => $paymentRequest->estado
                        ]);
                        
                        return response()->json([
                            'success' => false,
                            'error' => 'Esta solicitud de pago ya no está disponible'
                        ], 400);
                    }
                    
                    // Actualizar el estado a 'pagado'
                    $paymentRequest->estado = 'pagado';
                    $saved = $paymentRequest->save();
                    
                    \Log::info('PaymentRequest guardado: ' . ($saved ? 'SI' : 'NO') . ', nuevo estado: ' . $paymentRequest->estado);
                    
                    // Si hay un chat asociado, enviar un mensaje de confirmación
                    if ($paymentRequest->chat_id) {
                        $mensaje = \App\Models\Mensaje::create([
                            'contenido' => '✅ El pago de $' . $paymentRequest->monto . ' ha sido procesado exitosamente.',
                            'chat_id' => $paymentRequest->chat_id,
                            'usuario_id' => $paymentRequest->usuario_registrado_id,
                            'tipo' => 'confirmacion_pago'
                        ]);
                        
                        \App\Events\NuevoMensajeEvent::dispatch($mensaje);
                        
                        \Log::info('Mensaje de confirmación enviado al chat: ' . $paymentRequest->chat_id);
                    }
                } else {
                    \Log::error('PaymentRequest no encontrado con ID: ' . $paymentRequestId);
                }
            }

            return response()->json($result, 200);

        } catch (\Exception $e) {
            \Log::error('Error en ejecutarPago: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al ejecutar pago',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function pagoExitoso(Request $request)
    {
        try {
            $paymentId = $request->query('paymentId');
            $payerId = $request->query('PayerID');
            $token = $request->query('token');

            if (!$paymentId || !$payerId) {
                Log::error('PayPal success callback missing parameters', [
                    'paymentId' => $paymentId,
                    'payerId' => $payerId,
                    'token' => $token
                ]);
            }

            // Redirigir al frontend con los parámetros
            $frontendUrl = config('app.frontend_url') . "/pago/exitoso";
            $redirectUrl = $frontendUrl . "?paymentId={$paymentId}&PayerID={$payerId}";
            
            Log::info('Redirecting to frontend after PayPal success', [
                'redirectUrl' => $redirectUrl
            ]);
            
            return redirect($redirectUrl);
        } catch (\Exception $e) {
            Log::error('Error in PayPal success callback: ' . $e->getMessage());
            return redirect(config('app.frontend_url') . "/pago/error");
        }
    }

    public function pagoCancelado(Request $request)
    {
        try {
            $paymentId = $request->query('paymentId');
            $token = $request->query('token');
            
            if ($paymentId) {
                $this->paypalService->cancelarPago($paymentId);
            }

            // Redirigir al frontend
            $frontendUrl = config('app.frontend_url') . "/pago/cancelado";
            
            Log::info('Redirecting to frontend after PayPal cancel', [
                'redirectUrl' => $frontendUrl
            ]);
            
            return redirect($frontendUrl);
        } catch (\Exception $e) {
            Log::error('Error in PayPal cancel callback: ' . $e->getMessage());
            return redirect(config('app.frontend_url') . "/pago/error");
        }
    }

    public function obtenerEstadoPago($paymentId)
    {
        try {
            $result = $this->paypalService->obtenerEstadoPago($paymentId);
            
            if ($result['success']) {
                return response()->json($result, 200);
            } else {
                return response()->json($result, 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al obtener estado del pago',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function crearPagoDesdeChatId(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'monto' => 'required|numeric|min:0.01',
                'metodo_entrega' => 'required|string|max:255',
                'chat_id' => 'required|exists:chats,id'
            ]);

            if ($validator->fails()) {
                \Log::warning('Validación fallida en crearPagoDesdeChatId', [
                    'errors' => $validator->errors()->toArray(),
                    'request' => $request->all()
                ]);
                
                return response()->json([
                    'success' => false,
                    'error' => 'Error de validación',
                    'details' => $validator->errors()
                ], 422);
            }

            // Verificar que el chat exista
            $chat = Chat::find($request->input('chat_id'));
            if (!$chat) {
                \Log::warning('Chat no encontrado', ['chat_id' => $request->input('chat_id')]);
                
                return response()->json([
                    'success' => false,
                    'error' => 'El chat no existe'
                ], 404);
            }

            // Verificar que el chat tenga un usuario registrado asociado
            if (!$chat->usuarioRegistrado_id) {
                \Log::warning('Chat sin usuario registrado asociado', ['chat_id' => $chat->id]);
                
                return response()->json([
                    'success' => false,
                    'error' => 'El chat no tiene un usuario registrado asociado'
                ], 400);
            }

            // Verificar que el usuario autenticado tenga permisos para crear pagos en este chat
            $usuarioAutenticado = auth()->user();
            if (!$usuarioAutenticado) {
                return response()->json([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
                ], 401);
            }
            
            // Los usuarios registrados pueden crear pagos para sus propias compras
            // Las casas de remate pueden crear pagos para sus chats
            $tienePermiso = false;
            
            if ($usuarioAutenticado->esUsuarioRegistrado()) {
                // Si es usuario registrado, debe ser el usuario del chat
                $tienePermiso = ($usuarioAutenticado->id == $chat->usuarioRegistrado_id);
            } elseif ($usuarioAutenticado->esCasaDeRemates()) {
                // Si es casa de remate, debe ser la casa del chat
                $tienePermiso = ($usuarioAutenticado->id == $chat->casa_de_remate_id);
            }
            
            if (!$tienePermiso) {
                \Log::warning('Usuario sin permisos para crear pago en chat', [
                    'usuario_id' => $usuarioAutenticado->id,
                    'usuario_tipo' => $usuarioAutenticado->tipo,
                    'chat_id' => $chat->id,
                    'chat_usuario_registrado_id' => $chat->usuarioRegistrado_id,
                    'chat_casa_de_remate_id' => $chat->casa_de_remate_id
                ]);
                
                return response()->json([
                    'success' => false,
                    'error' => 'No tienes permiso para crear pagos en este chat'
                ], 403);
            }

            $monto = $request->input('monto');
            $metodoEntrega = $request->input('metodo_entrega');
            $chatId = $request->input('chat_id');

            $result = $this->paypalService->crearPagoDesdeChatId($monto, $metodoEntrega, $chatId);
            
            if ($result['success']) {
                return response()->json($result, 200);
            } else {
                return response()->json($result, 400);
            }

        } catch (\Exception $e) {
            \Log::error('Error en crearPagoDesdeChatId: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Error al crear pago',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function verificarCredenciales()
    {
        try {
            $isValid = $this->paypalService->verificarCredenciales();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'credentialsValid' => $isValid,
                    'baseUrl' => config('paypal.base_url'),
                    'clientIdConfigured' => !empty(config('paypal.client_id')),
                    'clientSecretConfigured' => !empty(config('paypal.client_secret'))
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al verificar credenciales de PayPal: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al verificar credenciales de PayPal',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function verificarPagoProcesado($paymentId)
    {
        try {
            // Verificar que el usuario esté autenticado
            $usuarioAutenticado = auth()->user();
            if (!$usuarioAutenticado) {
                return response()->json([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
                ], 401);
            }

            $factura = \App\Models\Factura::where('payment_id', $paymentId)->first();
            
            if ($factura) {
                $compra = $factura->compra;
                
                // Verificar que el usuario autenticado sea el dueño de la factura
                if (!$compra || $compra->usuarioRegistrado_id !== $usuarioAutenticado->id) {
                    return response()->json([
                        'success' => false,
                        'error' => 'No tienes permiso para acceder a esta información de pago'
                    ], 403);
                }
                
                return response()->json([
                    'success' => true,
                    'processed' => true,
                    'data' => [
                        'payment_id' => $paymentId,
                        'factura' => $factura,
                        'compra' => $compra
                    ]
                ]);
            }
            
            return response()->json([
                'success' => true,
                'processed' => false
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error al verificar pago procesado: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al verificar estado del pago',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
