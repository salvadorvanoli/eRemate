<?php


namespace App\Services\Articulo;
use App\Models\Articulo;
use App\Models\CasaDeRemates;
use App\Models\Rematador;
use App\Models\Usuario;
use App\Models\UsuarioRegistrado;
use App\Models\Subasta;
use App\Enums\EstadoSubasta;
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

        $usuario = Usuario::find($usuarioAutenticado->id);
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $usuarioEspecifico = null;

        if ($usuario->tipo === 'rematador') {
            $usuarioEspecifico = Rematador::where('id', $usuarioAutenticado->id)->first();
        } else if ($usuario->tipo === 'casa') {
            $usuarioEspecifico = CasaDeRemates::where('id', $usuarioAutenticado->id)->first();
        } else {
            $usuarioEspecifico = UsuarioRegistrado::where('id', $usuarioAutenticado->id)->first();
        }

        if (!$usuarioEspecifico) {
            return response()->json(['error' => 'No tienes permiso para acceder a esta información'], 403);
        }

        return $usuario;
    }
    
    private function verificarUsuario($usuario, $subasta)
    {
        $usuarioEspecifico = null;
        $subastaUsuario  = null;
        
        if ($usuario->tipo === 'rematador') {
            $usuarioEspecifico = Rematador::where('id', $usuario->id)->first();
            $subastaUsuario = $subasta->rematador ?? null;
        } else {
            $usuarioEspecifico = CasaDeRemates::where('id', $usuario->id)->first();
            $subastaUsuario = $subasta->casaRemates ?? null;
        }

        if (($usuarioEspecifico && $usuarioEspecifico->id !== $subastaUsuario?->id)) {
            return response()->json(['error' => 'No tienes permiso para acceder a esta subasta'], 403);
        }

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

        $casaDeRemates = CasaDeRemates::where('id', $usuario->id)->first();
        if (!$casaDeRemates) {
            return response()->json([
                'success' => false,
                'error' => 'La casa de remates especificada no existe.'
            ], 422);
        }

        return Articulo::create([
            'lote_id' => $data['lote_id'],
            'nombre' => $data['nombre'],
            'imagenes' => $data['imagenes'] ?? [],
            'especificacionesTecnicas' => $data['especificacionesTecnicas'] ?? '', // Cambiado de [] a ''
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

        $casaDeRemates = CasaDeRemates::where('id', $usuario->id)->first();
        if (!$casaDeRemates) {
            return response()->json([
                'success' => false,
                'error' => 'La casa de remates especificada no existe.'
            ], 422);
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

    public function obtenerArticulosOrdenados() 
    {
        $query = Articulo::query()
        ->join('lotes', 'articulos.lote_id', '=', 'lotes.id')
        ->join('subastas', 'lotes.subasta_id', '=', 'subastas.id')
        ->leftJoin('categorias', 'articulos.categoria_id', '=', 'categorias.id')
        ->whereNotIn('subastas.estado', [EstadoSubasta::CANCELADA, EstadoSubasta::CERRADA])
        ->select([
            'articulos.*', 
            'subastas.fechaInicio', 
            'subastas.fechaCierre'
        ])
        ->orderBy('subastas.fechaInicio', 'asc');

        $articulos = $query->get();
        
        if ($articulos->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay artículos disponibles'
            ], 404);
        }

        return $articulos;
    }

    public function obtenerArticulosFiltrados(array $data)
    {
        $query = Articulo::query()
        ->join('lotes', 'articulos.lote_id', '=', 'lotes.id')
        ->join('subastas', 'lotes.subasta_id', '=', 'subastas.id')
        ->leftJoin('categorias', 'articulos.categoria_id', '=', 'categorias.id')
        ->select([
            'articulos.*', 
            'subastas.fechaInicio', 
            'subastas.fechaCierre',
            'subastas.id as subasta_id',
            'subastas.nombre as subasta_nombre',
            'lotes.nombre as lote_nombre'
        ])
        ->orderBy('subastas.fechaInicio', 'asc');

        $cerrada = $data['cerrada'] ?? false;
        $categoria = $data['categoria'] ?? null;
        $ubicacion = $data['ubicacion'] ?? null;
        $fechaCierreLimite = $data['fechaCierreLimite'] ?? null;
        
        if ($cerrada) {
            $query->where('subastas.estado', EstadoSubasta::CERRADA);
        } else {
            $query->whereNotIn('subastas.estado', [EstadoSubasta::CANCELADA, EstadoSubasta::CERRADA]);
        }
        
        if ($categoria) {
            $query->where('articulos.categoria_id', $categoria);
        }
        
        if ($ubicacion) {
            $query->where('subastas.ubicacion', $ubicacion);
        }
        
        if ($fechaCierreLimite) {
            $query->where('subastas.fechaCierre', '<=', $fechaCierreLimite);
        }
        
        $articulos = $query->get();
        
        if ($articulos->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay artículos disponibles con los filtros aplicados'
            ], 404);
        }
        
        return $articulos;
    }
}
