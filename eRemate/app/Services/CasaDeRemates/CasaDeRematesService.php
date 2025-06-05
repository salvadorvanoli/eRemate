<?php


namespace App\Services\CasaDeRemates;
use App\Models\CasaDeRemates;
use App\Models\Usuario;
use App\Models\Rematador;
use App\Models\Subasta; 
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Enums\EstadoSubasta;
use Carbon\Carbon;

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

        // Iniciar transacción
        \DB::beginTransaction();

        try {
            // Extraer datos de usuario (email y teléfono)
            $datosUsuario = [];
            if (isset($data['email'])) {
                $datosUsuario['email'] = $data['email'];
                unset($data['email']);
            }
            if (isset($data['telefono'])) {
                $datosUsuario['telefono'] = $data['telefono'];
                unset($data['telefono']);
            }

            // Actualizar la casa de remates
            $casaDeRemates->update($data);

            // Si hay datos de usuario para actualizar
            if (!empty($datosUsuario)) {
                $usuario = \App\Models\Usuario::find($casaDeRemates->id);
                if (!$usuario) {
                    throw new \Exception('No se encontró el usuario asociado a la casa de remates');
                }
                $usuario->update($datosUsuario);
            }

            \DB::commit();
            return CasaDeRemates::find($id);

        } catch (\Exception $e) {
            \DB::rollBack();
            Log::error('Error al actualizar casa de remates: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al actualizar casa de remates: ' . $e->getMessage()
            ], 500);
        }
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
        $casaDeRemates = $this->buscarCasaDeRematesPorId($id);

        if ($casaDeRemates->subastas()->count() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'No hay subastas para esta casa de remates'
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

    public function estadisticaVentas(int $id, int $year = null): mixed
    {
        // Si no se proporciona año, usar el año actual
        if (!$year) {
            $year = now()->year;
        }

        Log::info('Buscando estadísticas para casa: ' . $id . ', año: ' . $year);
        
        // DEBUG 1: Ver TODAS las subastas para esta casa
        $todasSubastas = \App\Models\Subasta::where('casaDeRemates_id', $id)->get();
        Log::info('TODAS las subastas para casa ' . $id . ':', $todasSubastas->toArray());
        
        // DEBUG 2: Ver solo las cerradas SIN filtro de año
        $cerradasSinAno = \App\Models\Subasta::where('casaDeRemates_id', $id)
            ->where('estado', 'cerrada')
            ->get();
        Log::info('Subastas cerradas SIN filtro de año:', $cerradasSinAno->toArray());
        
        // DEBUG 3: Ver las cerradas CON filtro de año
        $cerradasConAno = \App\Models\Subasta::where('casaDeRemates_id', $id)
            ->where('estado', 'cerrada')
            ->whereYear('fechaCierre', $year)
            ->get();
        Log::info('Subastas cerradas CON filtro de año ' . $year . ':', $cerradasConAno->toArray());

        // Query con debug del SQL
        $query = \App\Models\Subasta::where('casaDeRemates_id', $id)
            ->where('estado', 'cerrada')
            ->whereYear('fechaCierre', $year)
            ->selectRaw('MONTH(fechaCierre) as month, COUNT(*) as count')
            ->groupBy('month');
    
        Log::info('SQL Query: ' . $query->toSql());
        Log::info('Query bindings: ', $query->getBindings());
    
        $ventasPorMes = $query->pluck('count', 'month');
    
        Log::info('Resultado crudo de la consulta:', $ventasPorMes->toArray());

        // Crear array con todos los meses
        $mesesDelAno = [
            1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
            5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
            9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
        ];

        $estadisticas = [];
        
        foreach ($mesesDelAno as $numeroMes => $nombreMes) {
            $count = isset($ventasPorMes[$numeroMes]) ? (int)$ventasPorMes[$numeroMes] : 0;
            Log::info("Procesando mes {$numeroMes} ({$nombreMes}): valor en array = " . ($ventasPorMes[$numeroMes] ?? 'null') . ", count final = {$count}");
            
            $estadisticas[] = [
                'month' => $nombreMes,
                'count' => $count
            ];
        }

        return [
            'success' => true,
            'data' => [
                'year' => $year,
                'months' => $estadisticas
            ]
        ];
    }

    public function estadisticasPorCategoria(int $id, int $year = null): mixed
    {
        // Si no se proporciona año, usar el año actual
        if (!$year) {
            $year = now()->year;
        }

        Log::info('Buscando estadísticas por categoría para casa: ' . $id . ', año: ' . $year);
        
        try {
            // Consulta corregida usando la estructura real de la base de datos
            $estadisticas = \DB::table('subastas as s')
                ->join('lotes as l', 's.id', '=', 'l.subasta_id')
                ->join('articulos as a', 'l.id', '=', 'a.lote_id')
                ->join('categorias as c', 'a.categoria_id', '=', 'c.id')
                ->where('s.casaDeRemates_id', $id)
                ->where(\DB::raw('TRIM(REPLACE(REPLACE(s.estado, "\r", ""), "\n", ""))'), 'cerrada')
                ->whereYear('s.fechaCierre', $year)
                ->select('c.nombre as categoria', \DB::raw('COUNT(a.id) as cantidad_articulos'))
                ->groupBy('c.id', 'c.nombre')
                ->orderBy('cantidad_articulos', 'desc')
                ->get();

            Log::info('SQL ejecutado:', [
                'query' => 'subastas -> lotes -> articulos -> categorias',
                'casa_id' => $id,
                'year' => $year
            ]);
            
            Log::info('Estadísticas por categoría encontradas:', $estadisticas->toArray());

            // Formatear los resultados
            $resultados = $estadisticas->map(function ($item) {
                return [
                    'categoria' => $item->categoria,
                    'cantidad' => (int)$item->cantidad_articulos,
                    'label' => $item->categoria . ': ' . $item->cantidad_articulos
                ];
            });

            // Si no hay datos, devolver array vacío con mensaje informativo
            if ($resultados->isEmpty()) {
                Log::info('No se encontraron datos para las estadísticas por categoría');
                
                return [
                    'success' => true,
                    'data' => [
                        'year' => $year,
                        'categorias' => [],
                        'total_categorias' => 0,
                        'total_articulos' => 0,
                        'message' => 'No se encontraron subastas cerradas para el año especificado'
                    ]
                ];
            }

            // Calcular totales
            $totalArticulos = $resultados->sum('cantidad');

            Log::info('Estadísticas procesadas correctamente:', [
                'total_categorias' => $resultados->count(),
                'total_articulos' => $totalArticulos
            ]);

            return [
                'success' => true,
                'data' => [
                    'year' => $year,
                    'categorias' => $resultados->values()->toArray(),
                    'total_categorias' => $resultados->count(),
                    'total_articulos' => $totalArticulos
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Error en estadisticasPorCategoria: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return [
                'success' => false,
                'message' => 'Error al obtener estadísticas por categoría: ' . $e->getMessage()
            ];
        }
    }

    public function estadisticasPujas(int $id): mixed
    {
        Log::info('Buscando estadísticas de pujas para casa: ' . $id);
        
        try {
            // Obtener las últimas 6 subastas cerradas y sus pujas
            $estadisticas = \DB::select("
                SELECT s.id as subasta_id, COUNT(p.id) as total_pujas
                FROM subastas s
                LEFT JOIN lotes l ON s.id = l.subasta_id
                LEFT JOIN pujas p ON l.id = p.lote_id
                WHERE s.casaDeRemates_id = ? 
                AND TRIM(REPLACE(REPLACE(s.estado, '\r', ''), '\n', '')) = 'cerrada'
                AND s.fechaCierre IS NOT NULL
                GROUP BY s.id
                ORDER BY s.fechaCierre DESC
                LIMIT 6
            ", [$id]);

            // Formatear resultado simple
            $resultado = array_map(function($item) {
                return [
                    'subasta_id' => $item->subasta_id,
                    'total_pujas' => (int)$item->total_pujas
                ];
            }, $estadisticas);

            return [
                'success' => true,
                'data' => $resultado
            ];

        } catch (\Exception $e) {
            Log::error('Error en estadisticasPujas: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Error al obtener estadísticas de pujas: ' . $e->getMessage()
            ];
        }
    }

}
