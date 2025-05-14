<?php


namespace App\Http\Controllers;

use App\Models\Subasta;
use App\Models\Puja;
use App\Models\Usuario;
use App\Models\UsuarioRegistrado;
use App\Models\Lote;
use App\Notifications\ComienzoSubastaNotification;
use App\Notifications\SubastaFinalizadaNotification;
use App\Notifications\NuevaPujaNotification;
use Illuminate\Http\Request;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
// use Illuminate\Notifications\BienvenidaUsuarioNotification; // Remove this line if it exists
use Illuminate\Support\Facades\Hash;
use App\Notifications\BienvenidaUsuarioNotification; // Correct namespace for the notification


class NotificationController extends Controller
{
    public function notificarInicioSubasta(Request $request)
    {
        try {
            $request->validate([
                'subasta_id' => 'required|exists:subastas,id'
            ]);

            $subasta = Subasta::with('lotes.usuariosInteresados.usuario')->findOrFail($request->subasta_id);
            
            $usuariosInteresados = $subasta->lotes
                ->flatMap(fn($lote) => $lote->usuariosInteresados)
                ->unique('id');

            foreach ($usuariosInteresados as $usuarioRegistrado) {
                $usuarioRegistrado->usuario->notify(new ComienzoSubastaNotification($subasta));
            }

            return response()->json([
                'message' => 'Notificaciones de inicio enviadas',
                'subasta_id' => $subasta->id
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al enviar notificaciones',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function notificarFinSubasta(Request $request)
    {
        try {
            $request->validate([
                'subasta_id' => 'required|exists:subastas,id'
            ]);

            $subasta = Subasta::with(['lotes.usuariosInteresados.usuario', 'lotes.pujas.usuarioRegistrado'])
                ->findOrFail($request->subasta_id);

            $lotes = $subasta->lotes->map(function($lote) {
                $pujaGanadora = $lote->pujas()
                    ->orderBy('monto', 'desc')
                    ->first();
                
                if ($pujaGanadora) {
                    $lote->update(['ganador_id' => $pujaGanadora->usuarioRegistrado_id]);
                }
                
                return $lote;
            });

            // notificar
            $usuariosInteresados = $subasta->lotes
                ->flatMap(fn($lote) => $lote->usuariosInteresados)
                ->unique('id');

            foreach ($usuariosInteresados as $usuarioRegistrado) {
                $usuarioRegistrado->usuario->notify(
                    new SubastaFinalizadaNotification($subasta, $lotes)
                );
            }

            return response()->json([
                'message' => 'Notificaciones de finalización enviadas',
                'subasta_id' => $subasta->id
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al enviar notificaciones',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function notificarNuevaPuja(Request $request)
    {
        try {
            $request->validate([
                'puja_id' => 'required|exists:pujas,id'
            ]);

            $puja = Puja::with([
                'lotes.usuariosInteresados.usuario',
                'usuarioRegistrado.usuario'
            ])->findOrFail($request->puja_id);

            $lote = $puja->lotes;
            
            // notificar (menos al q hizo la puja)
            foreach ($lote->usuariosInteresados as $usuarioRegistrado) {
                if ($usuarioRegistrado->id !== $puja->usuarioRegistrado_id) {
                    $usuarioRegistrado->usuario->notify(
                        new NuevaPujaNotification($lote->subasta, $puja, $lote)
                    );
                }
            }

            return response()->json([
                'message' => 'Notificaciones de nueva puja enviadas',
                'puja_id' => $puja->id,
                'lote_id' => $lote->id
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al enviar notificaciones',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    


public function testBienvenida(Request $request)
{
    try {
        $request->validate([
            'email' => 'required|email|unique:usuarios',
            'nombre' => 'required|string',
            'telefono' => 'required|string'
        ]);

        // Crear usuario de prueba
        $usuario = Usuario::create([
            'email' => $request->email,
            'contrasenia' => Hash::make('password123'), // contraseña por defecto
            'telefono' => $request->telefono,
            'tipo' => 'registrado'
        ]);

        // Crear usuario registrado
        $usuarioRegistrado = UsuarioRegistrado::create([
            'usuario_id' => $usuario->id,
            'nombre' => $request->nombre
        ]);

        // Enviar notificación
        $usuario->notify(new BienvenidaUsuarioNotification());

        return response()->json([
            'message' => 'Usuario creado y notificación enviada',
            'usuario' => $usuario,
            'usuario_registrado' => $usuarioRegistrado
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Error en el proceso',
            'error' => $e->getMessage()
        ], 500);
    }
}
}