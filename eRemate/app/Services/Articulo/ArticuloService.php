<?php


namespace App\Services\Articulo;
use App\Models\Articulo;
use App\Models\CasaDeRemates;
use App\Models\Lote;
use App\Models\Rematador;
use App\Models\Usuario;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class ArticuloService implements ArticuloServiceInterface
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

        if (($rematador && $rematador->id !== $rematadorLote?->id) && 
            ($casaDeRemates && $casaDeRemates->id !== $casaDeRematesLote?->id)) {
            return response()->json(['error' => 'No tienes permiso para acceder a este artículo'], 403);
        }

        return $usuario;
    }
    
    public function crearArticulo(array $data): mixed
    {
        $usuario = $this->validarUsuario();
        
        if (!$usuario instanceof Usuario) {
            return $usuario;
        }

        /*
        $articulo = Articulo::where('lote_id', $data['lote_id'])
                    ->where('categoria_id', $data['categoria_id'])
                    ->first();
        if ($articulo) {
            return response()->json([
                'success' => false,
                'error' => 'Ya existe un artículo con la misma categoría en este lote'
            ], 404);
        }
        */

        return Articulo::create([
            'lote_id' => $data['lote_id'],
            'imagenes' => $data['imagenes'] ?? [],
            'especificacionesTecnicas' => $data['especificacionesTecnicas'] ?? [],
            'estado' => $data['estado'],
            'categoria_id' => $data['categoria_id'] ?? null
        ]);
    }
    
    public function obtenerArticulo(int $id) 
    {
        $articulo = Articulo::find($id)->first();

        if (!$articulo) {
            return response()->json([
                'success' => false,
                'message' => 'Artículo no encontrado'
            ], 404);
        }

        return $articulo;
    }
    
    public function actualizarArticulo(int $id, array $data): mixed
    {
        $usuario = $this->validarUsuario();
        if (!$usuario instanceof Usuario) {
            return $usuario;
        }

        $articulo = Articulo::find($id)->first();
        if (!$articulo) {
            return response()->json([
                'success' => false,
                'error' => 'Artículo no encontrado'
            ], 404);
        }

        $chequeo = $this->verificarUsuario($usuario, $articulo->lote);
        if ($chequeo instanceof JsonResponse) {
            return $chequeo;
        }

        if ($articulo->lote->compra_id) {
            return response()->json([
                'success' => false,
                'error' => 'No se puede modificar un artículo que pertenece a un lote con compra asociada'
            ], 400);
        }

        return $articulo->update($data);    
    }
    
    public function obtenerArticulos() 
    {
        $articulos = Articulo::all();

        if (!$articulos || $articulos->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay artículos disponibles'
            ], 404);
        }

        return $articulos;
    }
}
