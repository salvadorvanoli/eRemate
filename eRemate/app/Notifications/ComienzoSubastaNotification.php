<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ComienzoSubastaNotification extends Notification
{
    use Queueable;

    public $subasta;

   
    public function __construct($subasta)
    {
        $this->subasta = $subasta;
    }

    
    public function via($notifiable)
    {
        return ['mail'];
    }

   public function toMail($notifiable)
    {
        $fechaInicio = $this->subasta->fechaInicio->format('d/m/Y H:i');
        
        return (new MailMessage)
            ->subject("🔔 Subasta #{$this->subasta->id} - Comienza Pronto")
            ->greeting("¡Hola {$notifiable->nombre}!")
            ->line("Una subasta que te interesa está por comenzar:")
            ->line("📅 Fecha de inicio: {$fechaInicio}")
            ->line("📍 Ubicación: {$this->subasta->ubicacion}")
            ->line("🎥 Transmisión: {$this->subasta->urlTransmision}")
            ->action('Ver Subasta', url("http://localhost:4200/subasta/{$this->subasta->id}"))
            ->line('¡No te la pierdas!');
    }

    
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
