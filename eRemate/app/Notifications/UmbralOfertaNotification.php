<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UmbralOfertaNotification extends Notification
{
    use Queueable;

    public $subasta;
    public $lote;
    public $multiplicador;
    public $ofertaActual;
    public $valorBase;

    public function __construct($subasta, $lote, $multiplicador, $ofertaActual, $valorBase)
    {
        $this->subasta = $subasta;
        $this->lote = $lote;
        $this->multiplicador = $multiplicador;
        $this->ofertaActual = $ofertaActual;
        $this->valorBase = $valorBase;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject("🚀 Umbral de Oferta Alcanzado - Subasta #{$this->subasta->id}")
            ->greeting("¡Hola {$notifiable->nombre}!")
            ->line("La oferta en uno de los lotes de su subasta ha alcanzado un umbral importante:")
            ->line("")
            ->line("📦 Lote: {$this->lote->nombre}")
            ->line("🎯 Umbral alcanzado: {$this->multiplicador}x el valor base")
            ->line("💰 Valor base: {$this->formatearMonto($this->valorBase)}")
            ->line("🔥 Oferta actual: {$this->formatearMonto($this->ofertaActual)}")
            ->line("📈 Incremento: {$this->formatearMonto($this->ofertaActual - $this->valorBase)}")
            ->line("")
            ->line("⏰ Cierre de subasta: {$this->subasta->fechaCierre->format('d/m/Y H:i')}")
            ->action('Ver Subasta', url("http://localhost:4200/subasta/{$this->subasta->id}"))
            ->line('¡Excelente desempeño en la subasta!');
    }

    protected function formatearMonto($monto)
    {
        return '$' . number_format($monto, 2, ',', '.');
    }
}
