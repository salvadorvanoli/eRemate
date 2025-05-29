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
        $mail = $this->subject($this->datos['subject']);

        if (isset($this->datos['isHtml']) && $this->datos['isHtml']) {
            return $mail->html($this->datos['body']);
        }

        return $mail->view('emails.contacto')
                    ->with([
                        'to' => $this->datos['to'],
                        'from' => $this->datos['from'],
                        'body' => $this->datos['body'],
                        'subject' => $this->datos['subject'],
                    ]);
    }
}
