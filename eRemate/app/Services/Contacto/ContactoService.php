<?php

namespace App\Services\Contacto;

use Illuminate\Support\Facades\Mail;
use App\Mail\ContactoMail;

class ContactoService
{
    public function enviarCorreo($datos)
    {
        Mail::to($datos['to'])->send(new ContactoMail($datos));
    }
}
