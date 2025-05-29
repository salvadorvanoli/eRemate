<?php


namespace App\Services\Articulo;
use App\Models\Articulo;
use App\Models\CasaDeRemates;
use App\Models\Usuario;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class ArticuloService implements ArticuloServiceInterface
{

    private function validarUsuario()
    {
        // Comentamos toda la lógica de validación para pruebas
        // $usuarioAutenticado = Auth::user();

        // if (!$usuarioAutenticado) {
        //     return response()->json(['error' => 'Token no proporcionado o inválido'], 401);
        // }

        // $usuario = Usuario::find($usuarioAutenticado)->first();
        // if (!$usuario) {
        //     return response()->json(['error' => 'Usuario no encontrado'], 404);
        // }

        // $casaDeRemates = CasaDeRemates::where('id', $usuarioAutenticado->id)->first();

        // if (!$casaDeRemates) {
        //     return response()->json(['error' => 'No tienes permiso para acceder a esta información'], 403);
        // }

        // return $usuario;

        // Siempre retorna el primer usuario para pruebas
        return Usuario::first();
    }
    
    private function verificarUsuario($usuario, $subasta)
    {

        // REVISAR ESTA FUNCIÓN

        /*
        $casaDeRemates = CasaDeRemates::where('id', $usuario->id);

        $casaDeRematesSubasta = $subasta->casaDeRemates->$id ?? null;

        if (($casaDeRemates && $casaDeRemates->id !== $casaDeRematesSubasta?->id)) {
            return response()->json(['error' => 'No tienes permiso para acceder a este artículo'], 403);
        }
        */
        return $usuario;
    }

    private function buscarArticuloPorId(int $id)
    {
        $articulo = Articulo::find($id);
        
        if (!$articulo) {
            return response()->json([
                'success' => false,
                'message' => 'Artículo no encontrado'
            ], 404);
        }

        return $articulo;
    }
    
    public function crearArticulo(array $data): mixed
    {
        $usuario = $this->validarUsuario();
        
        if (!$usuario instanceof Usuario) {
            return $usuario;
        }

        return Articulo::create([
            'lote_id' => $data['lote_id'],
            'nombre' => $data['nombre'],
            'imagenes' => $data['imagenes'] ?? [],
            'especificacionesTecnicas' => $data['especificacionesTecnicas'] ?? '', // Cambiado de [] a ''
            'estado' => $data['estado'],
            'nombre' => $data['nombre'],
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

        $articulo = $this->buscarArticuloPorId($id);
        if (!$articulo instanceof Articulo) {
            return $articulo;
        }

        $chequeo = $this->verificarUsuario($usuario, $articulo->lote->subasta);
        if ($chequeo instanceof JsonResponse) {
            return $chequeo;
        }

        if ($articulo->lote->compra_id) {
            return response()->json([
                'success' => false,
                'error' => 'No se puede modificar un artículo que pertenece a un lote con compra asociada'
            ], 400);
        }

        if (isset($data['lote_id'])) {
            unset($data['lote_id']);
        }

        $articulo->update($data);
        
        return Articulo::find($id)->first();
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
