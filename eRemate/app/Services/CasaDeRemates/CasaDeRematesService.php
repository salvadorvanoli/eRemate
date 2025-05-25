<?php


namespace App\Services\CasaDeRemates;
use App\Models\CasaDeRemates;
use App\Models\Usuario;
use App\Models\Rematador;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class CasaDeRematesService implements CasaDeRematesServiceInterface
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

        $casaDeRemates = CasaDeRemates::where('id', $casaAutenticada->id)->first();

        if (!$casaDeRemates) {
            return response()->json([
                'success' => false,
                'error' => 'Casa de remates no encontrada'
            ], 404);
        }

        return $casaDeRemates;
    }

    private function buscarCasaDeRematesPorId(int $id): mixed
    {
        $casaDeRemates = CasaDeRemates::find($id);

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

        if (isset($data['id'])) {
            unset($data['id']);
        }

        $casaDeRemates->update($data);

        return CasaDeRemates::find($id)->first();
    }

    public function obtenerRematadores(int $id): mixed
    {
        $casaDeRemates = $this->buscarCasaDeRematesPorId($id);
        if (!$casaDeRemates instanceof CasaDeRemates) {
            return $casaDeRemates;
        }

        if ($casaDeRemates->rematadores()->count() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'No hay rematadores asignados a esta casa de remates'
            ], 404);
        }

        return $casaDeRemates->rematadores()->get();
    }

    public function obtenerSubastas(int $id): mixed
    {
        $casaDeRemates = $this->buscarCasaDeRematesPorId($id);

        if ($casaDeRemates->subastas()->count() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'No hay subastas para esta casa de remates'
            ], 404);
        }

        return $casaDeRemates->subastas()->get();
    }

    public function asignarRematador(int $id, int $rematadorId): mixed
    {
        $casaDeRemates = $this->obtenerCasaDeRematesActual($id);

        if (!$casaDeRemates instanceof CasaDeRemates) {
            return $casaDeRemates;
        }

        $rematador = Rematador::find($rematadorId);
        if (!$rematador) {
            return response()->json([
                'success' => false,
                'message' => 'Rematador no encontrado'
            ], 404);
        }

        if ($casaDeRemates->rematadores()->where('rematador_id', $rematadorId)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'El rematador ya está asignado a esta casa de remates'
            ], 422);
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

        $rematador = Rematador::find($rematadorId);
        if (!$rematador) {
            return response()->json([
                'success' => false,
                'message' => 'Rematador no encontrado'
            ], 404);
        }

        if (!$casaDeRemates->rematadores()->where('rematador_id', $rematadorId)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'El rematador no está asignado a esta casa de remates'
            ], 422);
        }

        $casaDeRemates->rematadores()->detach($rematadorId);

        return response()->json([
            'success' => true,
            'message' => 'Rematador desasignado correctamente'
        ], 200);
    }

}
