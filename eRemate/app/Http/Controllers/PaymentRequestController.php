<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PaymentRequest;
use App\Models\Chat;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class PaymentRequestController extends Controller
{
    public function index()
    {
        $paymentRequests = PaymentRequest::all();
        return response()->json([
            'success' => true,
            'data' => $paymentRequests
        ]);
    }
    
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'monto' => 'required|numeric|min:0.01',
                'metodo_entrega' => 'required|string|in:domicilio,sucursal,punto_encuentro',
                'chat_id' => 'required|exists:chats,id'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Error de validación',
                    'details' => $validator->errors()
                ], 422);
            }
            
            // Verificar que el chat exista
            $chat = Chat::find($request->input('chat_id'));
            if (!$chat) {
                return response()->json([
                    'success' => false,
                    'error' => 'El chat no existe'
                ], 404);
            }
              // Verificar que el usuario autenticado tenga permisos para crear solicitudes en este chat
            $usuarioAutenticado = Auth::user();
            
            \Log::info('Creando solicitud de pago - Usuario autenticado: ' . $usuarioAutenticado->id . 
                      ' (tipo: ' . $usuarioAutenticado->tipo . ')' .
                      ', Chat usuario_registrado_id: ' . $chat->usuarioRegistrado_id . 
                      ', Chat casa_de_remate_id: ' . $chat->casa_de_remate_id);
            
            // Solo las casas de remate pueden crear solicitudes de pago
            if (!$usuarioAutenticado || $usuarioAutenticado->tipo !== 'casa' || 
                $usuarioAutenticado->id != $chat->casa_de_remate_id) {
                return response()->json([
                    'success' => false,
                    'error' => 'No tienes permiso para crear solicitudes de pago en este chat'
                ], 403);
            }
            
            // Crear la solicitud de pago
            $paymentRequest = PaymentRequest::create([
                'monto' => $request->input('monto'),
                'metodo_entrega' => $request->input('metodo_entrega'),
                'chat_id' => $request->input('chat_id'),
                'usuario_registrado_id' => $chat->usuarioRegistrado_id,
                'casa_de_remate_id' => $chat->casa_de_remate_id,
                'estado' => 'pendiente'
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $paymentRequest,
                'message' => 'Solicitud de pago creada exitosamente'
            ], 201);
            
        } catch (\Exception $e) {
            \Log::error('Error al crear solicitud de pago: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al crear la solicitud de pago',
                'details' => $e->getMessage()
            ], 500);
        }
    }
    
    public function show($id)
    {
        $paymentRequest = PaymentRequest::find($id);
        
        if (!$paymentRequest) {
            return response()->json([
                'success' => false,
                'error' => 'Solicitud de pago no encontrada'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $paymentRequest
        ]);
    }
    
    public function getByUser($userId)
    {
        $paymentRequests = PaymentRequest::where('usuario_registrado_id', $userId)
            ->where('estado', 'pendiente')
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $paymentRequests
        ]);
    }
    
    public function updateStatus(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'estado' => 'required|in:pendiente,pagado,cancelado',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Error de validación',
                    'details' => $validator->errors()
                ], 422);
            }
            
            $paymentRequest = PaymentRequest::find($id);
            
            if (!$paymentRequest) {
                return response()->json([
                    'success' => false,
                    'error' => 'Solicitud de pago no encontrada'
                ], 404);
            }
            
            $paymentRequest->estado = $request->input('estado');
            $paymentRequest->save();
            
            return response()->json([
                'success' => true,
                'data' => $paymentRequest,
                'message' => 'Estado de solicitud actualizado exitosamente'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error al actualizar estado de solicitud: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al actualizar el estado de la solicitud',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
