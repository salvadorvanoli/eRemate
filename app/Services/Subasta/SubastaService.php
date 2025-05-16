<?php


namespace App\Services\Subasta;
use App\Models\Subasta;
use App\Models\CasaDeRemates;
use App\Models\Rematador;
use App\Models\Usuario;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class SubastaService implements SubastaServiceInterface
{

    private function validarUsuario()
    {
        $usuarioAutenticado = Auth::user();

        if (!$usuarioAutenticado) {
            return response()->json(['error' => 'Token no proporcionado o inválido'], 401);
        }

        $usuario = Usuario::find($usuarioAutenticado)->first();
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $casaDeRemates = CasaDeRemates::where('usuario_id', $usuarioAutenticado->id)->first();
        $rematador = Rematador::where('usuario_id', $usuarioAutenticado->id)->first();

        if (!$rematador && !$casaDeRemates) {
            return response()->json(['error' => 'No tienes permiso para acceder a esta información'], 403);
        }

        return $usuario;
    }
    
    private function verificarUsuario($usuario, $subasta)
    {
        $casaDeRemates = CasaDeRemates::where('usuario_id', $usuario->id)->first();
        $rematador = Rematador::where('usuario_id', $usuario->id)->first();
        
        $rematadorSubasta = $subasta->rematador ?? null;
        $casaDeRematesSubasta = $subasta->casaDeRemates ?? null;

        if (($rematador && $rematador->id !== $rematadorSubasta?->id) && 
            ($casaDeRemates && $casaDeRemates->id !== $casaDeRematesSubasta?->id)) {
            return response()->json(['error' => 'No tienes permiso para acceder a esta subasta'], 403);
        }

        return $usuario;
    }
    
    public function crearSubasta(array $data): mixed
    {
        $usuario = $this->validarUsuario();
        
        if (!$usuario instanceof Usuario) {
            return $usuario;
        }

        return Subasta::create([
            'casaDeRemates_id' => $data['casaDeRemates_id'] ?? null,
            'rematador_id' => $data['rematador_id'] ?? null,
            'mensajes' => $data['mensajes'] ?? [],
            'urlTransmision' => $data['urlTransmision'],
            'tipoSubasta' => $data['tipoSubasta'],
            'fechaInicio' => $data['fechaInicio'],
            'fechaCierre' => $data['fechaCierre'],
            'ubicacion' => $data['ubicacion']
        ]);
    }
    
    public function obtenerSubasta(int $id) 
    {
        $subasta = Subasta::find($id);

        if (!$subasta) {
            return response()->json([
                'success' => false,
                'message' => 'Subasta no encontrada'
            ], 404);
        }

        return $subasta;
    }
    
    public function actualizarSubasta(int $id, array $data): mixed
    {
        $usuario = $this->validarUsuario();
        if (!$usuario instanceof Usuario) {
            return $usuario;
        }
        
        $subasta = Subasta::find($id);
        if (!$subasta) {
            return response()->json([
                'success' => false,
                'error' => 'Subasta no encontrada'
            ], 404);
        }

        $chequeo = $this->verificarUsuario($usuario, $subasta);
        if ($chequeo instanceof JsonResponse) {
            return $chequeo;
        }

        /* Falta chequear si la subasta ya ha finalizado (u otras condiciones) para no modificarla
        if ($subasta) {
            return response()->json([
                'success' => false,
                'error' => 'No se puede modificar una subasta que ya haya finalizado'
            ], 400);
        }
        */

        return $subasta->update($data);    
    }
    
    public function obtenerSubastas() 
    {
        $subastas = Subasta::all();

        if (!$subastas || $subastas->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay subastas disponibles'
            ], 404);
        }

        return $subastas;
    }
}
