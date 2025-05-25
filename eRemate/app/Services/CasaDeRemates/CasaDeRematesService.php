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
        // Solo busca la casa de remates por el id dado, sin chequear usuario autenticado ni permisos
        $casaDeRemates = CasaDeRemates::where('id', $id)->first();

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
        $casaDeRemates = CasaDeRemates::where('id', $id)->first();
        if (!$casaDeRemates) {
            return response()->json([
                'success' => false,
                'message' => 'Casa de remates no encontrada'
            ], 404);
        }

        $rematadores = $casaDeRemates->rematadores()->get();

        // Unir datos de rematador y usuario por id
        $result = $rematadores->map(function ($rematador) {
            $usuario = Usuario::find($rematador->id);
            return [
                'rematador' => $rematador,
                'usuario' => $usuario
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    public function obtenerSubastas(int $id): mixed
    {
        $casaDeRemates = CasaDeRemates::where('id', $id)->first();
        if (!$casaDeRemates) {
            return response()->json([
                'success' => false,
                'message' => 'Casa de remates no encontrada'
            ], 404);
        }

        return $casaDeRemates->subastas()->get();
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

    public function asignarRematador(int $id, string $email): mixed
    {
        $casaDeRemates = $this->obtenerCasaDeRematesActual($id);

        if (!$casaDeRemates instanceof CasaDeRemates) {
            return $casaDeRemates;
        }

        $usuario = Usuario::where('email', $email)->first();
        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        $rematador = Rematador::where('id', $usuario->id)->first();
        if (!$rematador) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario no es un rematador'
            ], 404);
        }

        if ($casaDeRemates->rematadores()->where('rematador_id', $rematador->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'El rematador ya está asignado a esta casa de remates'
            ], 422);
        }

        $casaDeRemates->rematadores()->attach($rematador->id);

        return response()->json([
            'success' => true,
            'message' => 'Rematador asignado correctamente'
        ], 200);
    }

}
