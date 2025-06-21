<?php


namespace App\Services\Articulo;
use App\Models\Articulo;
use App\Models\Categoria; 
use App\Models\CasaDeRemates;
use App\Models\Rematador;
use App\Models\Usuario;
use App\Models\UsuarioRegistrado;
use App\Models\Subasta;
use App\Models\Lote;
use App\Enums\EstadoSubasta;
use App\Enums\EstadoArticulo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

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

    private function buscarLotePorId(int $id)
    {
        $lote = Lote::find($id);
        
        if (!$lote) {
            return response()->json([
                'success' => false,
                'message' => 'Lote no encontrado'
            ], 404);
        }

        return $lote;
    }

    private function validarSubasta($subastaId)
    {
        $subasta = Subasta::find($subastaId);

        if (!$subasta) {
            return response()->json([
                'success' => false,
                'error' => 'Subasta no encontrada'
            ], 404);
        }

        if (in_array($subasta->estado, [
            EstadoSubasta::INICIADA,
            EstadoSubasta::CERRADA,
            EstadoSubasta::CANCELADA
        ])) {
            return response()->json([
                'success' => false,
                'error' => 'No se pueden operar artículos de una subasta que ya fue iniciada, cerrada o cancelada'
            ], 400);
        }

        return $subasta;
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

        $lote = $this->buscarLotePorId($data['lote_id']);
        if (!$lote instanceof Lote) {
            return $lote;
        }

        $subasta = $this->validarSubasta($lote->subasta_id);
        if (!$subasta instanceof Subasta) {
            return $subasta;
        }

        return Articulo::create([
            'lote_id' => $data['lote_id'],
            'nombre' => $data['nombre'],
            'imagenes' => $data['imagenes'] ?? [],
            'especificacionesTecnicas' => $data['especificacionesTecnicas'] ?? '',
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

        $lote = $this->buscarLotePorId($articulo->lote_id);
        if (!$lote instanceof Lote) {
            return $lote;
        }

        $subasta = $this->validarSubasta($lote->subasta_id);
        if (!$subasta instanceof Subasta) {
            return $subasta;
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

        // Si se están actualizando las imágenes, eliminar las anteriores
        if (isset($data['imagenes'])) {
            $this->eliminarImagenesAnteriores($articulo->imagenes);
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
                'subastas.id as subasta_id',
                'subastas.fechaInicio',
                'subastas.fechaCierre',
                'lotes.oferta',
                'lotes.id as lote_id',
                'lotes.ganador_id',
                'categorias.nombre as categoria_nombre'
            ])
            ->orderBy('subastas.fechaCierre', 'asc');

        $articulos = $query->get();
        
        if ($articulos->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay artículos disponibles'
            ], 404);
        }

        $catalogElements = $articulos->map(function ($articulo) {
            $primerImagen = null;
            if (!empty($articulo->imagenes)) {
                $imagenes = is_string($articulo->imagenes) ? json_decode($articulo->imagenes, true) : $articulo->imagenes;
                $primerImagen = is_array($imagenes) && !empty($imagenes) ? $imagenes[0] : null;
            }

            $texto3 = "No se está subastando";
            if ($articulo->oferta > 0) {
                if ($articulo->ganador_id) {
                    $texto3 = "Subastado por $" . number_format($articulo->oferta, 2);
                } else {
                    $texto3 = "Oferta actual: $" . number_format($articulo->oferta, 2);
                }
            }

            return [
                'id' => $articulo->id,
                'imagen' => $primerImagen,
                'lotes' => null,
                'lote_id' => $articulo->lote_id,
                'subasta_id' => $articulo->subasta_id,
                'etiqueta' => strtoupper($articulo->estado->label()),
                'texto1' => $articulo->categoria_nombre ?? 'Sin categoría',
                'texto2' => $articulo->nombre,
                'texto3' => $texto3,
                'fechaInicio' => $articulo->fechaInicio,
                'fechaCierre' => $articulo->fechaCierre
            ];
        });
        
        return $catalogElements;
    }

    public function obtenerArticulosFiltrados(array $data)
    {
        $query = Articulo::query()
            ->join('lotes', 'articulos.lote_id', '=', 'lotes.id')
            ->join('subastas', 'lotes.subasta_id', '=', 'subastas.id')
            ->leftJoin('categorias', 'articulos.categoria_id', '=', 'categorias.id')
            ->select([
                'articulos.*',
                'subastas.id as subasta_id',
                'subastas.fechaInicio',
                'subastas.fechaCierre',
                'lotes.oferta',
                'lotes.id as lote_id',
                'lotes.ganador_id',
                'categorias.nombre as categoria_nombre'
            ]);

        $textoBusqueda = (isset($data['textoBusqueda']) && $data['textoBusqueda'] !== null && $data['textoBusqueda'] !== "null") ? $data['textoBusqueda'] : null;
        $cerrada = (isset($data['cerrada']) && $data['cerrada'] !== null && is_bool($data['cerrada'])) ? $data['cerrada'] : false;
        $categoria = (isset($data['categoria']) && $data['categoria'] !== null && $data['categoria'] !== "null") ? $data['categoria'] : null;
        $ubicacion = (isset($data['ubicacion']) && $data['ubicacion'] !== null && $data['ubicacion'] !== "null") ? $data['ubicacion'] : null;
        $fechaCierreLimite = (isset($data['fechaCierreLimite']) && $data['fechaCierreLimite'] !== null && $data['fechaCierreLimite'] !== "null") ? $data['fechaCierreLimite'] : null;

        if ($textoBusqueda) {
            $query->where(function($q) use ($textoBusqueda) {
                $q->where('articulos.nombre', 'like', '%' . $textoBusqueda . '%')
                  ->orWhere('articulos.especificacionesTecnicas', 'like', '%' . $textoBusqueda . '%')
                  ->orWhereHas('categoria', function($q) use ($textoBusqueda) {
                      $q->where('categorias.nombre', 'like', '%' . $textoBusqueda . '%');
                  });
            });
        }

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
        
        $query->orderBy('subastas.fechaCierre', 'asc');
        
        $articulos = $query->get();
        
        if ($articulos->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay artículos disponibles con los filtros aplicados'
            ], 404);
        }
        
        $catalogElements = $articulos->map(function ($articulo) {
            $primerImagen = null;
            if (!empty($articulo->imagenes)) {
                $imagenes = is_string($articulo->imagenes) ? json_decode($articulo->imagenes, true) : $articulo->imagenes;
                $primerImagen = is_array($imagenes) && !empty($imagenes) ? $imagenes[0] : null;
            }

            $texto3 = "No se está subastando";
            if ($articulo->oferta > 0) {
                if ($articulo->ganador_id) {
                    $texto3 = "Subastado por $" . number_format($articulo->oferta, 2);
                } else {
                    $texto3 = "Oferta actual: $" . number_format($articulo->oferta, 2);
                }
            }

            return [
                'id' => $articulo->id,
                'imagen' => $primerImagen,
                'lotes' => null,
                'lote_id' => $articulo->lote_id,
                'subasta_id' => $articulo->subasta_id,
                'etiqueta' => strtoupper($articulo->estado->label()),
                'texto1' => $articulo->categoria_nombre ?? 'Sin categoría',
                'texto2' => $articulo->nombre,
                'texto3' => $texto3,
                'fechaInicio' => $articulo->fechaInicio,
                'fechaCierre' => $articulo->fechaCierre
            ];
        });
        
        return $catalogElements;
    }

    public function obtenerCategorias()
    {
        $categorias = Categoria::select('id', 'nombre')
        ->whereIn('id', function($query) {
            $query->select('categoria_id')
                ->from('articulos')
                ->whereNotNull('categoria_id')
                ->distinct();
        })
        ->orderBy('nombre', 'asc')
        ->get();
        
        if ($categorias->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay categorías disponibles'
            ], 404);
        }


        return $categorias;
    }

    private function eliminarImagenesAnteriores(?array $imagenesAnteriores): bool
    {
        if (!$imagenesAnteriores || empty($imagenesAnteriores)) {
            return true;
        }

        $exitoGeneral = true;

        foreach ($imagenesAnteriores as $imagenUrl) {
            if (empty($imagenUrl)) {
                continue;
            }

            try {
                // Extraer información de la URL de la imagen
                $partesUrl = parse_url($imagenUrl);
                
                if (!$partesUrl || !isset($partesUrl['path'])) {
                    \Log::warning('URL de imagen inválida para eliminar: ' . $imagenUrl);
                    $exitoGeneral = false;
                    continue;
                }
                
                $path = $partesUrl['path'];
                
                // Buscar patrón: /api/images/serve/carpeta/archivo
                if (preg_match('/\/api\/images\/serve\/([^\/]+)\/(.+)$/', $path, $matches)) {
                    $folder = $matches[1];
                    $filename = $matches[2];
                    
                    // Usar el ImageController para eliminar la imagen
                    $imageController = new \App\Http\Controllers\ImageController();
                    $response = $imageController->delete($folder, $filename);
                    
                    $responseData = json_decode($response->getContent(), true);
                    if ($responseData && isset($responseData['success']) && $responseData['success']) {
                        \Log::info('Imagen anterior eliminada correctamente: ' . $imagenUrl);
                    } else {
                        \Log::warning('No se pudo eliminar la imagen anterior: ' . $imagenUrl);
                        $exitoGeneral = false;
                    }
                } else {
                    \Log::warning('Formato de URL de imagen no reconocido: ' . $imagenUrl);
                    $exitoGeneral = false;
                }
                
            } catch (\Exception $e) {
                \Log::error('Error al eliminar imagen anterior: ' . $e->getMessage() . ' - URL: ' . $imagenUrl);
                $exitoGeneral = false;
            }
        }

        return $exitoGeneral;
    }

    public function obtenerAllCategorias()
    {
        $categorias = Categoria::all();

        if (!$categorias || $categorias->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay categorías disponibles'
            ], 404);
        }

        return $categorias;
    }
     

}
