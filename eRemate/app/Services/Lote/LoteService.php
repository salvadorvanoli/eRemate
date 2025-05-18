<?php


namespace App\Services\Lote;
use App\Models\CasaDeRemates;
use App\Models\Lote;
use App\Models\Rematador;
use App\Models\Usuario;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class LoteService implements LoteServiceInterface
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

    private function verificarUsuario($usuario, $lote)
    {
        $casaDeRemates = CasaDeRemates::where('usuario_id', $usuario->id)->first();
        $rematador = Rematador::where('usuario_id', $usuario->id)->first();

        $rematadorLote = $lote->subasta->rematador ?? null;
        $casaDeRematesLote = $lote->subasta->casaDeRemates ?? null;

        if (($rematador && $rematador->id !== $rematadorLote->id) && ($casaDeRemates && $casaDeRemates->id !== $casaDeRematesLote->id)) {
            return response()->json(['error' => 'No tienes permiso para acceder a este lote'], 403);
        }

        return response()->json($usuario);
    }

    public function crearLote(array $data): mixed
    {
        $usuario = $this->validarUsuario();
        
        if (!$usuario instanceof Usuario) {
            return $usuario;
        }

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
            'compra_id' => null,
            'ganador_id' => null,
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'],
            'valorBase' => $data['valorBase'],
            'pujaMinima' => $data['pujaMinima'],
            'disponibilidad' => $data['disponibilidad'],
            'condicionesDeEntrega' => $data['condicionesDeEntrega']
        ]);
    }

    public function obtenerLote(int $id) {
        $lote = Lote::find($id)->first();

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

        $usuario = $this->validarUsuario();
        if (!$usuario instanceof Usuario) {
            return $usuario;
        }

        $lote = Lote::find($id)->first();
        if (!$lote) {
            return response()->json([
                'success' => false,
                'error' => 'Lote no encontrado'
            ], 404);
        }

        $chequeo = $this->verificarUsuario($usuario, $lote);
        if ($chequeo instanceof JsonResponse) {
            return $chequeo;
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
        $usuario = $this->validarUsuario();
        if (!$usuario instanceof Usuario) {
            return $usuario;
        }
        
        $lote = Lote::find($id)->first();

        if (!$lote) {
            return response()->json([
                'success' => false,
                'error' => 'Lote no encontrado'
            ], 404);
        }

        $chequeo = $this->verificarUsuario($usuario, $lote);
        if ($chequeo instanceof JsonResponse) {
            return $chequeo;
        }

        $lote->articulos()->attach($articuloId);

        return response()->json([
            'success' => true,
            'message' => 'Artículo asignado correctamente'
        ], 200);
    }

    public function removerArticulo(int $id, int $articuloId): mixed
    {
        $usuario = $this->validarUsuario();
        if (!$usuario instanceof Usuario) {
            return $usuario;
        }
        
        $lote = Lote::find($id)->first();

        if (!$lote) {
            return response()->json([
                'success' => false,
                'error' => 'Lote no encontrado'
            ], 404);
        }

        $chequeo = $this->verificarUsuario($usuario, $lote);
        if ($chequeo instanceof JsonResponse) {
            return $chequeo;
        }

        $lote->articulos()->detach($articuloId);

        return response()->json([
            'success' => true,
            'message' => 'Artículo removido correctamente'
        ], 200);
    }

}
