<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Producto;

class ProductoController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric',
            'disponible' => 'required|boolean',
            'stock' => 'required|integer|min:0',
            'fecha_lanzamiento' => 'nullable|date',
        ]);

        $producto = Producto::create($validated);

        return response()->json(['message' => 'Producto creado', 'producto' => $producto], 201);
    }
}