<?php


namespace App\Http\Services;
use App\Models\CasaDeRemates;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class CasaDeRematesService
{

    private function obtenerCasaDeRematesActual(int $id): mixed
    {
        $casaAutenticada = Auth::user();

        if (!$casaAutenticada) {
            return response()->json([
                'success' => false,
                'error' => 'Token no proporcionado o inválido'
            ], 401);
        }

        if ($casaAutenticada->id !== (int) $id) {
            return response()->json([
                'success' => false,
                'error' => 'No tienes permiso para acceder a esta información'
            ], 403);
        }

        $casaDeRemates = CasaDeRemates::where('usuario_id', $id)->first();

        if (!$casaDeRemates) {
            return response()->json([
                'success' => false,
                'error' => 'Casa de remates no encontrada'
            ], 404);
        }

        return $casaDeRemates;
    }
    
    public function actualizarCasaDeRemates(int $id, array $data): mixed
    {
        $casaDeRemates = $this->obtenerCasaDeRematesActual($id);

        if (!$casaDeRemates instanceof CasaDeRemates) {
            return $casaDeRemates;
        }

        return $casaDeRemates->update($data);
        
    }

    public function obtenerRematadores(int $id): mixed
    {
        $casaDeRemates = $this->obtenerCasaDeRematesActual($id);

        if (!$casaDeRemates instanceof CasaDeRemates) {
            return $casaDeRemates;
        }

        return $casaDeRemates->rematadores()->get();
    }

    public function asignarRematador(int $id, int $rematadorId): mixed
    {
        $casaDeRemates = $this->obtenerCasaDeRematesActual($id);

        if (!$casaDeRemates instanceof CasaDeRemates) {
            return $casaDeRemates;
        }

        $casaDeRemates->rematadores()->attach($rematadorId);

        return response()->json([
            'success' => true,
            'message' => 'Rematador asignado correctamente'
        ], 200);
    }

    public function desasignarRematador(int $id, int $rematadorId): mixed
    {
        $casaDeRemates = $this->obtenerCasaDeRematesActual($id);

        if (!$casaDeRemates instanceof CasaDeRemates) {
            return $casaDeRemates;
        }

        $casaDeRemates->rematadores()->detach($rematadorId);

        return response()->json([
            'success' => true,
            'message' => 'Rematador desasignado correctamente'
        ], 200);
    }

}
