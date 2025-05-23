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

    public function asignarRematador(int $id, string $email): mixed
    {
        $casaDeRemates = $this->obtenerCasaDeRematesActual($id);

        if (!$casaDeRemates instanceof CasaDeRemates) {
            return $casaDeRemates;
        }

        // Buscar el usuario con ese email
        $usuario = Usuario::where('email', $email)->first();
        
        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontró ningún usuario con ese email'
            ], 404);
        }
        
        // Verificar que el usuario sea un rematador
        if (!$usuario->esRematador()) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario no es un rematador'
            ], 400);
        }
        
        // Buscar el rematador asociado a ese usuario
        $rematador = Rematador::where('usuario_id', $usuario->id)->first();
        
        if (!$rematador) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontró el perfil de rematador para este usuario'
            ], 404);
        }

        $casaDeRemates->rematadores()->attach($rematador->id);

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
