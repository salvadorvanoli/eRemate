<?php

namespace Database\Seeders;

use App\Enums\EstadoSubasta;
use Illuminate\Database\Seeder;
use App\Models\Usuario;
use App\Models\CasaDeRemates;
use App\Models\Rematador;
use App\Models\UsuarioRegistrado;
use App\Models\Subasta;
use App\Models\Lote;
use App\Models\Articulo;
use App\Models\PujaAutomatica;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Crear un usuario tipo Casa De Remates
        $casaDeRematesUsuario = Usuario::create([
            'id' => 1,
            'tipo' => 'casa',
            'email' => 'casa@remates.com',
            'contrasenia' => bcrypt('contrasenia'),
        ]);

        $casaDeRemates = CasaDeRemates::create([
            'id' => $casaDeRematesUsuario->id,
            'identificacionFiscal' => '123456789',
            'nombreLegal' => 'Casa de Remates Ejemplo',
            'domicilio' => 'Calle Falsa 123',
        ]);

        // Crear un usuario tipo Rematador
        $rematadorUsuario = Usuario::create([
            'id' => 2,
            'tipo' => 'rematador',
            'email' => 'rematador@remates.com',
            'contrasenia' => bcrypt('contrasenia'),
        ]);

        $rematador = Rematador::create([
            'id' => $rematadorUsuario->id,
            'nombre' => 'Juan',
            'apellido' => 'Pérez',
            'numeroMatricula' => 'RM12345',
            'direccionFiscal' => 'Calle Verdadera 456',
            'imagen' => 'rematador.jpg',
        ]);

        // Asociar el rematador a la Casa De Remates
        $casaDeRemates->rematadores()->attach($rematador->id);

        // Crear un usuario tipo Usuario Registrado
        $usuarioRegistradoUsuario = Usuario::create([
            'id' => 3,
            'tipo' => 'registrado',
            'email' => 'usuario@remates.com',
            'contrasenia' => bcrypt('contrasenia'),
        ]);

        $usuarioRegistrado = UsuarioRegistrado::create([
            'id' => $usuarioRegistradoUsuario->id,
            'metodos_pago' => ['Tarjeta de Crédito', 'PayPal'],
        ]);
        
        // Crear un segundo usuario registrado para las pujas automáticas
        $usuarioRegistrado2Usuario = Usuario::create([
            'id' => 4,
            'tipo' => 'registrado',
            'email' => 'usuario2@remates.com',
            'contrasenia' => bcrypt('contrasenia'),
        ]);

        $usuarioRegistrado2 = UsuarioRegistrado::create([
            'id' => $usuarioRegistrado2Usuario->id,
            'metodos_pago' => ['Tarjeta de Crédito', 'Transferencia Bancaria'],
        ]);

        // Crear una subasta asociada a la Casa De Remates y al Rematador
        $subasta = Subasta::create([
            'casaDeRemates_id' => $casaDeRemates->id,
            'rematador_id' => $rematador->id, // Asociación del rematador a la subasta
            'mensajes' => [],
            'urlTransmision' => 'http://transmision.com/subasta',
            'tipoSubasta' => 'Online',
            'estado' => EstadoSubasta::PENDIENTE, // Cambio de INICIADA a PENDIENTE
            'fechaInicio' => now(),
            'fechaCierre' => now()->addDays(1),
            'ubicacion' => 'Plataforma Online',
        ]);

        // Crear un lote asociado a la subasta
        $lote = Lote::create([
            'subasta_id' => $subasta->id,
            'nombre' => 'Lote de Prueba',
            'descripcion' => 'Descripción del lote de prueba',
            'valorBase' => 1000.00,
            'pujaMinima' => 100.00,
            'oferta' => 0.00,
            'disponibilidad' => 'Disponible',
            'condicionesDeEntrega' => 'Entrega inmediata',
        ]);

        // Crear un artículo asociado al lote
        Articulo::create([
            'lote_id' => $lote->id,
            'nombre' => 'Artículo de Prueba',
            'imagenes' => [
                url('api/images/serve/articulos/telefonoNaranja.webp'), // ← Tu imagen local
                url('api/images/serve/articulos/telefonoNaranja.webp'), // Repetir si necesitas más
            ],
            'especificacionesTecnicas' => json_encode(['Peso: 1kg', 'Color: Azul']),
            'estado' => 'Nuevo',
            'categoria_id' => null,
        ]);

        $modificarSubasta = Subasta::find($subasta->id);
        $modificarSubasta->update([
            'loteActual_id' => $lote->id
        ]);
        
        $modificarSubasta->save();
        
        // Crear una puja automática para el usuario2 asociada al lote
        PujaAutomatica::create([
            'presupuesto' => 5000.00, // Presupuesto máximo para pujas automáticas
            'lote_id' => $lote->id,
            'usuarioRegistrado_id' => $usuarioRegistrado->id
        ]);
        
        $this->command->info('Datos de prueba cargados correctamente con puja automática.');
    }
}
