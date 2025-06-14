<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BienvenidaUsuarioNotification extends Notification
{
    use Queueable;

    public function __construct()
    {
        // Constructor vacío, no se necesitan datos adicionales
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('¡Bienvenido a eRemate! 🎉')
            ->greeting("¡Hola {$notifiable->nombre}!")
            ->line('Gracias por registrarte en eRemate.')
            ->line('Tu cuenta ha sido creada exitosamente.')
            ->line('Ya puedes empezar a participar en el mundo de las subastas virtuales.')
            ->action('Comenzar a Explorar', url('http://localhost:4200/inicio'))
            ->line('Si tienes alguna pregunta, no dudes en contactarnos.');
    }
}