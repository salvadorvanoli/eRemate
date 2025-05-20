<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Contacto\ContactoService;

class ContactoController extends Controller
{
    protected $contactoService;

    public function __construct(ContactoService $contactoService)
    {
        $this->contactoService = $contactoService;
    }

    public function enviarFormulario(Request $request)
    {
        $request->validate([
            'to' => 'required|email',
            'from' => 'required|email',
            'subject' => 'required|string',
            'body' => 'required|string',
        ]);

        $datos = [
            'to' => $request->to,
            'from' => $request->from,
            'subject' => $request->subject,
            'body' => $request->body,
        ];

        $this->contactoService->enviarCorreo($datos);

        return response()->json(['message' => 'Correo enviado correctamente']);
    }
}
