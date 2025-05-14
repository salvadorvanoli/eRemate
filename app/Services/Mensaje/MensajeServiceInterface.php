<?php

namespace App\Services\Mensaje;

interface MensajeServiceInterface
{
    public function obtenerTodos();
    public function buscarPorId($id);
    public function crear(array $datos);
    public function eliminar($id);
}