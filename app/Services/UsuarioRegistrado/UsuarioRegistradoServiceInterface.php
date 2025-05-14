<?php

namespace App\Services\UsuarioRegistrado;

interface UsuarioRegistradoServiceInterface
{
    public function obtenerMetodosPago($id);
    public function agregarMetodoPago($id, string $metodoPago);
    public function obtenerHistorialCompras($id);
    public function agregarLoteFavorito($usuarioId, $loteId);
    public function quitarLoteFavorito($usuarioId, $loteId);
    public function obtenerLotesFavoritos($usuarioId);
    
}