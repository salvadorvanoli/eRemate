<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Subasta;
use Illuminate\Support\Facades\Mail;
use App\Mail\AuctionReminderMail;
use Carbon\Carbon;

class Reminder extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'auctions:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envía correos recordatorios para subastas próximas a sus rematadores.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando proceso de envío de recordatorios de subastas...');

        $ahora = Carbon::now();
        $limiteSuperior = Carbon::now()->addHour();

        $this->info('Zona horaria de Carbon: ' . $ahora->timezoneName);
        $this->info('Hora actual: ' . $ahora->toDateTimeString());
        $this->info('Límite superior: ' . $limiteSuperior->toDateTimeString());

        $subastasParaRecordar = Subasta::where('estado', 'aceptada')
                                    ->whereBetween('fechaInicio', [$ahora, $limiteSuperior])
                                    ->with('rematador.usuario')
                                    ->get();

        $this->info('IDs de subastas encontradas: ' . $subastasParaRecordar->pluck('id')->join(', '));

        if ($subastasParaRecordar->isEmpty()) {
            $this->info('No hay subastas próximas para enviar recordatorios en este momento.');
            return 0;
        }

        $this->info("Se encontraron {$subastasParaRecordar->count()} subastas para recordar.");

        foreach ($subastasParaRecordar as $subasta) {
            $this->info("Procesando subasta ID: {$subasta->id}");
            if ($subasta->rematador) {
                $this->info("  Rematador ID: {$subasta->rematador->id}, Nombre: {$subasta->rematador->nombre}");
                if ($subasta->rematador->usuario) {
                    $this->info("    Usuario ID: {$subasta->rematador->usuario->id}, Email: {$subasta->rematador->usuario->email}");
                } else {
                    $this->warn("    Rematador sin usuario asociado.");
                }
            } else {
                $this->warn("  Subasta sin rematador asignado.");
            }

            if ($subasta->rematador && $subasta->rematador->usuario && $subasta->rematador->usuario->email) {
                $destinatarioEmail = $subasta->rematador->usuario->email;
                $nombreRematador = $subasta->rematador->nombre ?? 'Rematador';
                if ($subasta->rematador->apellido) {
                    $nombreRematador .= ' ' . $subasta->rematador->apellido;
                }

                try {
                    $this->info("Intentando enviar mail a: {$destinatarioEmail}");
                    Mail::to($destinatarioEmail)->send(new AuctionReminderMail($subasta, $nombreRematador));
                    $this->info("Recordatorio enviado a {$destinatarioEmail} para la subasta ID: {$subasta->id} que inicia a las {$subasta->fechaInicio}");
                } catch (\Exception $e) {
                    $this->error("Error al enviar recordatorio para subasta ID {$subasta->id} a {$destinatarioEmail}: " . $e->getMessage());
                }
            } else {
                $warnMessage = "No se pudo obtener la información completa del rematador o su email para la subasta ID: {$subasta->id}.";
                if (!$subasta->rematador) {
                    $warnMessage .= " (Subasta sin rematador asignado)";
                } elseif (!$subasta->rematador->usuario) {
                    $warnMessage .= " (Rematador ID: {$subasta->rematador->id} sin usuario asociado)";
                } elseif (!$subasta->rematador->usuario->email) {
                    $warnMessage .= " (Usuario asociado al rematador ID: {$subasta->rematador->id} sin email)";
                }
                $this->warn($warnMessage);
            }
        }

        $this->info('Proceso de envío de recordatorios finalizado.');
        return 0;
    }
}
