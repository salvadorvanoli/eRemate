<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Nombre;

class TestController extends Controller
{
    public function index(Request $request)
    {
        $nombre = $request->query('nombre');

        if (!$nombre) {
            return response()->json(['error' => 'Falta el parametro nombre.'], 400);
        }

        // Guardar en base de datos
        $nuevoNombre = new Nombre();
        $nuevoNombre->nombre = $nombre;
        $nuevoNombre->save();

        return response()->json(['message' => "Hola $nombre, tu nombre fue guardado."]);
    }
}