<?php

namespace App\Console\Commands;

use App\Models\Subasta;
use App\Models\PujaAutomatica;
use App\Enums\EstadoSubasta;
use Illuminate\Console\Command;

class CancelarSubastasExpiradas extends Command
{
    protected $signature = 'subastas:cancelar-expiradas';
    protected $description = 'Cancela las subastas que han pasado más de 15 minutos desde su fecha de inicio sin ser iniciadas';

    public function handle()
    {
        $fechaLimite = now()->subMinutes(15);
        
        $subastasExpiradas = Subasta::whereIn('estado', [
                EstadoSubasta::PENDIENTE,
                EstadoSubasta::PENDIENTE_APROBACION,
                EstadoSubasta::ACEPTADA
            ])
            ->where('fechaInicio', '<', $fechaLimite)
            ->get();

        if ($subastasExpiradas->isEmpty()) {
            $this->info('No se encontraron subastas expiradas para cancelar.');
            return 0;
        }

        $contadorCanceladas = 0;
        $contadorPujasEliminadas = 0;

        foreach ($subastasExpiradas as $subasta) {
            try {
                $lotesIds = $subasta->lotes()->pluck('id')->toArray();
                
                $pujasEliminadas = PujaAutomatica::whereIn('lote_id', $lotesIds)->count();
                PujaAutomatica::whereIn('lote_id', $lotesIds)->delete();
                
                $subasta->update([
                    'estado' => EstadoSubasta::CANCELADA
                ]);
                
                $contadorCanceladas++;
                $contadorPujasEliminadas += $pujasEliminadas;
                
                $this->info("Subasta ID {$subasta->id} cancelada. Fecha de inicio: {$subasta->fechaInicio}. Pujas automáticas eliminadas: {$pujasEliminadas}");
                
            } catch (\Exception $e) {
                $this->error("Error al cancelar subasta ID {$subasta->id}: " . $e->getMessage());
            }
        }

        $this->info("Proceso completado. Total de subastas canceladas: {$contadorCanceladas}");
        $this->info("Total de pujas automáticas eliminadas: {$contadorPujasEliminadas}");
        
        return 0;
    }
}