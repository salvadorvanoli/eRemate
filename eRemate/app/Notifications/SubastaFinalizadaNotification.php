<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SubastaFinalizadaNotification extends Notification
{
    use Queueable;
    
    public $subasta;
    public $lotes;

    public function __construct($subasta, $lotes)
    {
        $this->subasta = $subasta;
        $this->lotes = $lotes;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $message = (new MailMessage)
            ->subject("🏆 Subasta #{$this->subasta->id} - Finalizada")
            ->greeting("¡Hola {$notifiable->nombre}!")
            ->line("La subasta ha finalizado.");

 
        return $message
            ->action('Ver Resultados', url("http://localhost:4200/subasta/{$this->subasta->id}"))
            ->line('¡Gracias por participar!');
    }
}