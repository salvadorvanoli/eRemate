<?php

namespace App\Services\Articulo;

interface ArticuloServiceInterface
{
    public function crearArticulo(array $data);
    public function obtenerArticulo(int $id);
    public function actualizarArticulo(int $id, array $data);
    public function obtenerArticulos();
    public function obtenerCategorias(); 
    public function obtenerArticulosOrdenados();
    public function obtenerArticulosFiltrados(array $data);
    public function obtenerAllCategorias();

}