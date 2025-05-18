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
        //
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
            ->line('Ya puedes empezar a participar en subastas y hacer pujas.')
            ->action('Comenzar a Explorar', url('/'))
            ->line('Si tienes alguna pregunta, no dudes en contactarnos.');
    }
}