<?php


namespace App\Http\Services;
use App\Models\CasaDeRemates;
use App\Models\Lote;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class LoteService
{
    public function crearLote(array $data): Lote
    {
        $lote = Lote::where('subasta_id', $data['subasta_id'])
                    ->where('nombre', $data['nombre'])
                    ->first();

        if ($lote) {
            return response()->json([
                'success' => false,
                'error' => 'Ya existe un lote con ese nombre dentro de la subasta especificada'], 404
            );
        }

        return Lote::create([
            'subasta_id' => $data['subasta_id'],
            'compra_id' => $data['compra_id'] ?? null,
            'ganador_id' => $data['ganador_id'] ?? null,
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'],
            'valorBase' => $data['valorBase'],
            'pujaMinima' => $data['pujaMinima'],
            'disponibilidad' => $data['disponibilidad'],
            'condicionesDeEntrega' => $data['condicionesDeEntrega']
        ]);
    }

    public function obtenerLote(int $id) {
        $lote = Lote::find($id);

        if (!$lote) {
            return response()->json([
                'success' => false,
                'message' => 'Lote no encontrado'
            ], 404);
        }

        return $lote;
    }
    
    public function actualizarLote(int $id, array $data): mixed
    {
        $lote = Lote::find($id);
        if (!$lote) {
            return response()->json([
                'success' => false,
                'error' => 'Lote no encontrado'
            ], 404);
        }

        if ($lote->compra_id) {
            return response()->json([
                'success' => false,
                'error' => 'No se puede modificar un lote que ya tiene una compra asociada'
            ], 400);
        }

        return $lote->update($data);    
    }

    public function obtenerArticulos(int $id): mixed
    {
        $lote = Lote::find($id)->first();

        if (!$lote) {
            return response()->json([
                'success' => false,
                'error' => 'Lote no encontrado'
            ], 404);
        }

        return $lote->articulos()->get();
    }

    public function agregarArticulo(int $id, int $articuloId): mixed
    {
        $lote = Lote::find($id)->first();

        if (!$lote) {
            return response()->json([
                'success' => false,
                'error' => 'Lote no encontrado'
            ], 404);
        }

        $lote->articulos()->attach($articuloId);

        return response()->json([
            'success' => true,
            'message' => 'Artículo asignado correctamente'
        ], 200);
    }

    public function removerArticulo(int $id, int $articuloId): mixed
    {
        $lote = Lote::find($id)->first();

        if (!$lote) {
            return response()->json([
                'success' => false,
                'error' => 'Lote no encontrado'
            ], 404);
        }

        $lote->articulos()->detach($articuloId);

        return response()->json([
            'success' => true,
            'message' => 'Artículo removido correctamente'
        ], 200);
    }

}
