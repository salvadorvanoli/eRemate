<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Mensaje\MensajeServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;

class MensajeController extends Controller
{
    protected $mensajeService;

    public function __construct(MensajeServiceInterface $mensajeService)
    {
        $this->mensajeService = $mensajeService;
    }

    // Obtener todos los mensajes
    public function index()
    {
        try {
            return response()->json($this->mensajeService->obtenerTodos());
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener los mensajes: ' . $e->getMessage()], 500);
        }
    }

    // Obtener un mensaje por ID
    public function show($id)
    {
        try {
            return response()->json($this->mensajeService->buscarPorId($id));
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Mensaje no encontrado'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al mostrar el mensaje: ' . $e->getMessage()], 500);
        }
    }

    // Crear un nuevo mensaje
    public function store(Request $request)
    {
        try {
            $datos = $request->validate([
                'chat_id' => 'required|exists:chats,id',
                'contenido' => 'required|string',
                'usuario_id' => 'required|exists:usuarios,id'  
            ]);

            $mensaje = $this->mensajeService->crear($datos);
            return response()->json($mensaje, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Error de validación',
                'mensajes' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al crear el mensaje: ' . $e->getMessage()], 500);
        }
    }

    // Eliminar un mensaje
    public function destroy($id)
    {
        try {
            $this->mensajeService->eliminar($id);
            return response()->json(null, 204);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Mensaje no encontrado'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al eliminar el mensaje: ' . $e->getMessage()], 500);
        }
    }

}