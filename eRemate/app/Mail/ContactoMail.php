<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactoMail extends Mailable
{
    use Queueable, SerializesModels;

    public $datos;

    public function __construct($datos)
    {
        $this->datos = $datos;
    }

    public function build()
    {
        return $this->view('emails.contacto')
                    ->subject($this->datos['subject'])
                    ->with([
                        'to' => $this->datos['to'],
                        'from' => $this->datos['from'],
                        'body' => $this->datos['body'],
                        'subject' => $this->datos['subject'],
                    ]);
    }
}
