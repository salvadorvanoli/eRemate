<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Chat\ChatServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Exception;

class ChatController extends Controller
{
    protected $chatService;

    public function __construct(ChatServiceInterface $chatService)
    {
        $this->chatService = $chatService;
    }

    // Obtener todos
    public function index()
    {
        try {
            return response()->json($this->chatService->obtenerTodos());
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener los chats: ' . $e->getMessage()], 500);
        }
    }

    // Obtener uno por ID
    public function show($id)
    {
        try {
            $chat = $this->chatService->buscarPorId($id);
            return response()->json([
                'success' => true,
                'data' => $chat
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Chat no encontrado'
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al mostrar el chat: ' . $e->getMessage()
            ], 500);
        }
    }

    // Crear nuevo
    public function store(Request $request)
    {
        try {
            $datos = $request->validate([
                'usuarioRegistrado_id' => 'required|exists:usuarios_registrados,id',
                'casa_de_remate_id' => 'required|exists:casas_de_remates,id'
            ]);

            $chat = $this->chatService->crear($datos);
            return response()->json($chat, 201);
        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Error de validación',
                'mensajes' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al crear el chat',
                'mensaje' => $e->getMessage(),
                'datos_recibidos' => $request->all()
            ], 500);
        }
    }

    // Obtener chats de un usuario
    public function getUserChats($usuarioId)
    {
        try {
            return response()->json($this->chatService->obtenerPorUsuario($usuarioId));
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener los chats del usuario: ' . $e->getMessage()], 500);
        }
    }

    // Obtener mensajes de un chat
    public function getChatMessages($chatId)
    {
        try {
            return response()->json($this->chatService->obtenerMensajes($chatId));
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Chat no encontrado'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener los mensajes: ' . $e->getMessage()], 500);
        }
    }

    // Eliminar
    public function destroy($id)
    {
        try {
            $this->chatService->eliminar($id);
            return response()->json(null, 204);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Chat no encontrado'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al eliminar el chat: ' . $e->getMessage()], 500);
        }
    }
}
