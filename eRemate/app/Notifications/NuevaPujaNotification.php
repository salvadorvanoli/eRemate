<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NuevaPujaNotification extends Notification
{
    use Queueable;

    public $subasta;
    public $puja;
    public $lote;

    public function __construct($subasta, $puja, $lote)
    {
        $this->subasta = $subasta;
        $this->puja = $puja;
        $this->lote = $lote;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject("💰 Nueva Puja - Subasta #{$this->subasta->id}")
            ->greeting("¡Hola {$notifiable->nombre}!")
            ->line("Se ha realizado una nueva oferta en el lote que te interesa:")
            ->line("")
            ->line("📦 Lote #{$this->lote->id}")
            ->line("💵 Nueva puja: {$this->formatearMonto($this->puja->monto)}")
            ->line("⏰ Cierre: {$this->subasta->fechaCierre->format('d/m/Y H:i')}")
            ->action('Hacer Contraoferta', url("http://localhost:4200/subasta/{$this->subasta->id}"))
            ->line('¡No dejes que te lo ganen!');
    }

    protected function formatearMonto($monto)
    {
        return '$' . number_format($monto, 2, ',', '.');
    }
}