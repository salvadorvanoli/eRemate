<?php

namespace App\Services\Chat;

use App\Models\Chat;

class ChatService implements ChatServiceInterface
{
    public function obtenerTodos()
    {
        return Chat::all();
    }

    public function buscarPorId($id)
    {
        return Chat::findOrFail($id);
    }

    public function crear(array $datos)
    {
        return Chat::create($datos);
    }

    public function obtenerPorUsuario($usuarioId)
    {
        return Chat::where('usuarioRegistrado_id', $usuarioId)
            ->orWhere('casa_de_remate_id', $usuarioId)
            ->get();
    }

    public function obtenerMensajes($chatId)
    {
        return Chat::findOrFail($chatId)->mensajes()->orderBy('created_at', 'asc')->get();
    }

    public function eliminar($id)
    {
        return Chat::destroy($id);
    }
}