<?php


namespace App\Services\Lote;
use App\Models\CasaDeRemates;
use App\Models\Lote;
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

        $casaDeRemates = CasaDeRemates::where('id', $usuarioAutenticado->id)->first();

        if (!$casaDeRemates) {
            return response()->json(['error' => 'No tienes permiso para acceder a esta información'], 403);
        }

        return $usuario;
    }

    private function verificarUsuario($usuario, $subasta)
    {
        $casaDeRemates = CasaDeRemates::where('id', $usuario->id)->first();

        $casaDeRematesSubasta = $subasta->casaRemates ?? null;

        if ($casaDeRemates && $casaDeRemates->id !== $casaDeRematesSubasta->id) {
            return response()->json(['error' => 'No tienes permiso para acceder a este lote'], 403);
        }

        return response()->json($usuario);
    }

    public function crearLote(array $data): mixed
    {
        // Elimina la búsqueda por nombre
        // $lote = Lote::where('subasta_id', $data['subasta_id'])
        //     ->where('nombre', $data['nombre'])
        //     ->first();

        // if ($lote) {
        //     return response()->json(
        //         [
        //             'success' => false,
        //             'error' => 'Ya existe un lote con ese nombre dentro de la subasta especificada'
        //         ],
        //         404
        //     );
        // }

        return Lote::create([
            'subasta_id' => $data['subasta_id'],
            'compra_id' => null,
            'ganador_id' => null,
            // 'nombre' => $data['nombre'], // Elimina esta línea
            // 'descripcion' => $data['descripcion'], // Elimina esta línea
            'valorBase' => $data['valorBase'],
            'pujaMinima' => $data['pujaMinima'],
            'disponibilidad' => $data['disponibilidad'],
            'condicionesDeEntrega' => $data['condicionesDeEntrega']
        ]);
    }

    public function obtenerLote(int $id)
    {
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

        // $usuario = $this->validarUsuario();
        // if (!$usuario instanceof Usuario) {
        //     return $usuario;
        // }

        $lote = Lote::find($id)->first();
        if (!$lote) {
            return response()->json([
                'success' => false,
                'error' => 'Lote no encontrado'
            ], 404);
        }

        // $chequeo = $this->verificarUsuario($usuario, $lote->subasta);
        // if ($chequeo instanceof JsonResponse) {
        //     return $chequeo;
        // }

        if ($lote->compra_id) {
            return response()->json([
                'success' => false,
                'error' => 'No se puede modificar un lote que ya tiene una compra asociada'
            ], 400);
        }

        $lote->update($data);

        return Lote::find($id)->first();
    }

    public function obtenerArticulos(int $id): mixed
    {
        // Incorrecto: find() ya devuelve un único modelo, no una colección
        $lote = Lote::find($id)->first();
        
        // Debería ser:
        $lote = Lote::find($id);

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
        // $usuario = $this->validarUsuario();
        // if (!$usuario instanceof Usuario) {
        //     return $usuario;
        // }
        
        $lote = Lote::find($id)->first();

        if (!$lote) {
            return response()->json([
                'success' => false,
                'error' => 'Lote no encontrado'
            ], 404);
        }

        // $chequeo = $this->verificarUsuario($usuario, $lote->subasta);
        // if ($chequeo instanceof JsonResponse) {
        //     return $chequeo;
        // }

        $lote->articulos()->attach($articuloId);

        return response()->json([
            'success' => true,
            'message' => 'Artículo asignado correctamente'
        ], 200);
    }

    public function removerArticulo(int $id, int $articuloId): mixed
    {
        $lote = Lote::find($id);

        if (!$lote) {
            return response()->json([
                'success' => false,
                'error' => 'Lote no encontrado'
            ], 404);
        }

        // Buscamos el artículo que pertenece a este lote específico
        $articulo = \App\Models\Articulo::where('id', $articuloId)
                                       ->where('lote_id', $id)
                                       ->first();
        
        if (!$articulo) {
            return response()->json([
                'success' => false,
                'error' => 'Artículo no encontrado en este lote'
            ], 404);
        }
        
        // Eliminamos el artículo directamente
        $articulo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Artículo eliminado correctamente'
        ], 200);
    }

    public function obtenerLotesPorSubasta(int $subastaId)
    {
        $lotes = Lote::where('subasta_id', $subastaId)->get();

        if ($lotes->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay lotes para esta subasta'
            ], 404);
        }

        return $lotes;
    }

    public function eliminarLote(int $id)
    {
        $lote = Lote::find($id);
        if (!$lote) {
            return response()->json([
                'success' => false,
                'message' => 'Lote no encontrado'
            ], 404);
        }
        $lote->delete();
        return response()->json([
            'success' => true,
            'message' => 'Lote eliminado correctamente'
        ]);
    }

}
