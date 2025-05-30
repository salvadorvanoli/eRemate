<?php

namespace App\Jobs;

use App\Models\Lote;
use App\Models\PujaAutomatica;
use App\Models\Subasta;
use App\Services\Subasta\SubastaServiceInterface;
use App\Enums\EstadoSubasta;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Http\JsonResponse;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcesarPujasAutomaticas implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $subasta;
    protected $lote;
    protected $pujasAutomaticas;
    protected $indiceActual;
    protected $subastaService;

    public function __construct(Subasta $subasta, Lote $lote, array $pujasAutomaticas = [], int $indiceActual = 0)
    {
        $this->subasta = $subasta;
        $this->lote = $lote;
        $this->pujasAutomaticas = $pujasAutomaticas;
        $this->indiceActual = $indiceActual;
    }

    public function handle(SubastaServiceInterface $subastaService): void
    {
        if (empty($this->pujasAutomaticas) || $this->subasta->estado !== EstadoSubasta::INICIADA) {
            return;
        }

        $subastaActualizada = Subasta::find($this->subasta->id);
        if (!$subastaActualizada || $subastaActualizada->loteActual_id !== $this->lote->id) {
            return;
        }
        
        $loteActualizado = Lote::find($this->lote->id);
        if (!$loteActualizado) {
            return;
        }
        
        $pujasAutomaticasActualizadas = [];
        foreach ($this->pujasAutomaticas as $pa) {
            $pujaAutomatica = PujaAutomatica::find($pa['id']);
            if ($pujaAutomatica) {
                $pujasAutomaticasActualizadas[] = [
                    'id' => $pujaAutomatica->id,
                    'presupuesto' => $pujaAutomatica->presupuesto,
                    'lote_id' => $pujaAutomatica->lote_id,
                    'usuarioRegistrado_id' => $pujaAutomatica->usuarioRegistrado_id
                ];
            }
        }
        $this->pujasAutomaticas = $pujasAutomaticasActualizadas;
        
        if (empty($this->pujasAutomaticas)) {
            return;
        }
        
        if ($this->indiceActual >= count($this->pujasAutomaticas)) {
            $this->indiceActual = 0;
        }
        
        $pujaAutomaticaActual = $this->pujasAutomaticas[$this->indiceActual];
        
        $pujaMinima = $loteActualizado->pujaMinima;
        $montoNecesario = null;

        if ($loteActualizado->oferta == 0) {
            $montoNecesario = $loteActualizado->precioBase + $pujaMinima;
        } else {
            $montoNecesario = $loteActualizado->oferta + $pujaMinima;
        }
        
        if ($pujaAutomaticaActual['presupuesto'] >= $montoNecesario) {
            $respuesta = $subastaService->realizarPujaInterna([
                'monto' => $pujaMinima,
                'lote_id' => $loteActualizado->id
            ], $this->subasta->id, $pujaAutomaticaActual['usuarioRegistrado_id']);
            
            if (!$respuesta instanceof JsonResponse) {
                Log::info("Puja automática realizada: Lote #{$loteActualizado->id}, Usuario #{$pujaAutomaticaActual['usuarioRegistrado_id']}, Monto: $montoNecesario");
            } else {
                Log::warning("Error en puja automática: " . $respuesta->getData()->message ?? 'Error desconocido');
            }
        } else {
            PujaAutomatica::find($pujaAutomaticaActual['id'])->delete();
            array_splice($this->pujasAutomaticas, $this->indiceActual, 1);
            
            Log::info("Puja automática eliminada por falta de presupuesto: #{$pujaAutomaticaActual['id']}");
            
            if ($this->indiceActual >= count($this->pujasAutomaticas)) {
                $this->indiceActual = 0;
            }
        }
        
        $tiempoEspera = rand(3, 7);
        
        if (!empty($this->pujasAutomaticas)) {
            $siguienteIndice = ($this->indiceActual + 1) % count($this->pujasAutomaticas);
            ProcesarPujasAutomaticas::dispatch($this->subasta, $loteActualizado, $this->pujasAutomaticas, $siguienteIndice)
                ->delay(now()->addSeconds($tiempoEspera));
        }
    }
}
