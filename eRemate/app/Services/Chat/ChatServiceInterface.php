<?php

namespace App\Services\Chat;

interface ChatServiceInterface
{
    public function obtenerTodos();
    public function buscarPorId($id);
    public function crear(array $datos);
    public function obtenerPorUsuario($usuarioId);
    public function obtenerMensajes($chatId);
    public function eliminar($id);
}