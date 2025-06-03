<?php

namespace App\Services\Rematador;

use App\Models\Rematador;
use App\Models\Subasta;
use App\Enums\EstadoSubasta;
use Illuminate\Database\Eloquent\Collection;

class RematadorService implements RematadorServiceInterface
{


    public function crearRematador(array $data): Rematador
{
    // si ya existe
    $rematador = Rematador::where('numeroMatricula', $data['numeroMatricula'])->first();

    if ($rematador) {
        return $rematador;
    }

    // si no existe
    return Rematador::create([
        'id' => $data['id'],
        'nombre' => $data['nombre'],
        'apellido' => $data['apellido'],
        'numeroMatricula' => $data['numeroMatricula'],
        'direccionFiscal' => $data['direccionFiscal'],
        'imagen' => $data['imagen'] ?? null
    ]);
}

    public function obtenerRematadorPorId(int $id): ?Rematador
    {
        return Rematador::findOrFail($id);
    }

    /**
     * Actualiza los datos de un rematador y, opcionalmente, el email y teléfono en la tabla usuario
     * 
     * @param int $id ID del rematador
     * @param array $data Datos para actualizar
     * @return bool
     */
    public function actualizarRematador(int $id, array $data): bool
    {
        $rematador = $this->obtenerRematadorPorId($id);
        
        // Iniciar una transacción para asegurar que ambas actualizaciones se completen o ninguna
        \DB::beginTransaction();
        
        try {
            if (isset($data['imagen']) && $data['imagen'] !== null && $data['imagen'] !== $rematador->imagen) {
                $this->eliminarImagenAnterior($rematador->imagen);
            }
            
            $datosUsuario = [];
            if (isset($data['email'])) {
                $datosUsuario['email'] = $data['email'];
                unset($data['email']); // Quitar del array de datos del rematador
            }
            
            if (isset($data['telefono'])) {
                $datosUsuario['telefono'] = $data['telefono'];
                unset($data['telefono']); // Quitar del array de datos del rematador
            }
            
            $rematador->update($data);
            
            if (!empty($datosUsuario)) {
                $usuario = \App\Models\Usuario::find($id);
                if (!$usuario) {
                    throw new \Exception('No se encontró el usuario asociado al rematador');
                }
                $usuario->update($datosUsuario);
            }
            
            \DB::commit();
            return true;
            
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Error al actualizar rematador: ' . $e->getMessage());
            return false;
        }
    }

    public function obtenerSubastasPorRematador(int $id): Collection
    {
        $rematador = $this->obtenerRematadorPorId($id);
        return $rematador->subastas;
    }

    public function obtenerAgendaRematador(int $id): Collection
    {
        $rematador = $this->obtenerRematadorPorId($id);
        
        // Usar el valor del enum correctamente
        return Subasta::where('rematador_id', $id)
            ->where('estado', EstadoSubasta::ACEPTADA->value) // Cambiado
            ->orderBy('fechaInicio')
            ->get();
    }

    public function obtenerSubastasSolicitadas(int $id): Collection
    {
        $rematador = $this->obtenerRematadorPorId($id);
        
        // Usar el valor del enum correctamente
        return Subasta::where('rematador_id', $id)
            ->where('estado', EstadoSubasta::PENDIENTE_APROBACION->value) // Cambiado
            ->orderBy('fechaInicio')
            ->get();
    }

    public function aceptarSubasta(int $rematadorId, int $subastaId): Subasta
    {
        $rematador = $this->obtenerRematadorPorId($rematadorId);
        $subasta = Subasta::findOrFail($subastaId);
        
        if ($subasta->rematador_id != $rematadorId) {
            throw new \Exception('Esta subasta no está asignada a este rematador');
        }
        
        // Logs corregidos - acceder al valor del enum con ->value
        \Log::info('Estado actual de la subasta: ' . $subasta->estado->value);
        \Log::info('Valor esperado: ' . EstadoSubasta::PENDIENTE_APROBACION->value);
        
        // Comparar objetos enum directamente
        if ($subasta->estado !== EstadoSubasta::PENDIENTE_APROBACION) {
            throw new \Exception('La subasta no está en estado pendiente de aprobación (estado actual: ' . $subasta->estado->value . ')');
        }
        
        // Asignar el objeto enum, no el string
        $subasta->estado = EstadoSubasta::ACEPTADA;
        $subasta->save();
        
        return $subasta;
    }

    public function rechazarSubasta(int $rematadorId, int $subastaId): Subasta
    {
        $rematador = $this->obtenerRematadorPorId($rematadorId);
        $subasta = Subasta::findOrFail($subastaId);
        
        if ($subasta->rematador_id != $rematadorId) {
            throw new \Exception('Esta subasta no está asignada a este rematador');
        }
        
        // Log para depuración
        \Log::info('Estado actual de la subasta a cancelar: ' . $subasta->estado->value);
        
        // Comparar objetos enum directamente, no valores
        if (!in_array($subasta->estado, [
            EstadoSubasta::PENDIENTE_APROBACION, 
            EstadoSubasta::ACEPTADA
        ])) {
            throw new \Exception('La subasta no puede ser cancelada en su estado actual (estado actual: ' . $subasta->estado->value . ')');
        }
        
        // Asignar el objeto enum, no el string
        $subasta->estado = EstadoSubasta::CANCELADA;
        $subasta->save();
        
        return $subasta;
    }

    private function eliminarImagenAnterior(?string $imagenUrl): bool
    {
        if (empty($imagenUrl)) {
            return true;
        }

        try {
            $partesUrl = parse_url($imagenUrl);
            
            if (!$partesUrl || !isset($partesUrl['path'])) {
                \Log::warning('URL de imagen inválida para eliminar: ' . $imagenUrl);
                return false;
            }
            
            $path = $partesUrl['path'];
            
            if (preg_match('/\/api\/images\/serve\/([^\/]+)\/(.+)$/', $path, $matches)) {
                $folder = $matches[1];
                $filename = $matches[2];
                
                $imageController = new \App\Http\Controllers\ImageController();
                $response = $imageController->delete($folder, $filename);
                
                $responseData = json_decode($response->getContent(), true);
                if ($responseData && isset($responseData['success']) && $responseData['success']) {
                    \Log::info('Imagen anterior eliminada correctamente: ' . $imagenUrl);
                    return true;
                } else {
                    \Log::warning('No se pudo eliminar la imagen anterior: ' . $imagenUrl);
                    return false;
                }
            } else {
                \Log::warning('Formato de URL de imagen no reconocido: ' . $imagenUrl);
                return false;
            }
            
        } catch (\Exception $e) {
            \Log::error('Error al eliminar imagen anterior: ' . $e->getMessage() . ' - URL: ' . $imagenUrl);
            return false;
        }
    }
}