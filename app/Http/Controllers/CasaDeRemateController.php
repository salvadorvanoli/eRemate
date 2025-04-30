<?php

namespace App\Http\Controllers;

use App\Models\CasaDeRemate;
use Illuminate\Http\Request;

class CasaDeRemateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $casasDeRemate = CasaDeRemate::all();
        return response()->json($casasDeRemate);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'identificacionFiscal' => 'required|unique:casa_de_remates',
            'nombreLegal' => 'required',
            'email' => 'required|email|unique:casa_de_remates'
        ]);

        $casaDeRemate = CasaDeRemate::create($validated);
        return response()->json($casaDeRemate, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(CasaDeRemate $casaDeRemate)
    {
        return response()->json($casaDeRemate);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, CasaDeRemate $casaDeRemate)
    {
        $validated = $request->validate([
            'nombreLegal' => 'required',
            'email' => 'required|email|unique:casa_de_remates,email,' . $casaDeRemate->id
        ]);

        $casaDeRemate->update($validated);
        return response()->json($casaDeRemate);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CasaDeRemate $casaDeRemate)
    {
        $casaDeRemate->delete();
        return response()->json(null, 204);
    }
}