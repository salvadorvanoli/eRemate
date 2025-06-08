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
use App\Models\Categoria;
use Illuminate\Support\Facades\Hash;

class CatalogTestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Crear 20 categorías
        $this->command->info('Creando categorías...');
        $categorias = [];
        $nombresCategorias = [
            'Antigüedades', 'Arte', 'Automóviles', 'Coleccionables', 'Deportes', 
            'Electrónica', 'Fotografía', 'Hogar', 'Inmuebles', 'Instrumentos Musicales',
            'Joyería', 'Libros', 'Maquinaria', 'Moda', 'Monedas', 
            'Muebles', 'Relojes', 'Tecnología', 'Vinos', 'Otros'
        ];
        
         foreach ($nombresCategorias as $index => $nombre) {
            $categoria = Categoria::create([
                'nombre' => $nombre
            ]);
            $categorias[] = $categoria;
        }

        $this->command->info('¡Categorías creadas correctamente!');

        /*
        // Crear 3 casas de remates
        $this->command->info('Creando casas de remates...');
        $casasDeRemates = [];
        
        $nombresCasas = [
            'Remates Premium', 'Subastas Exclusivas', 'Casa de Remates Internacional'
        ];
        
        foreach ($nombresCasas as $index => $nombre) {
            $id = $index + 1;
            $usuarioCasa = Usuario::create([
                'id' => $id,
                'tipo' => 'casa',
                'email' => "casa{$id}@eremate.com",
                'contrasenia' => Hash::make('password'),
            ]);
            
            $casaDeRemates = CasaDeRemates::create([
                'id' => $usuarioCasa->id,
                'identificacionFiscal' => "RUT" . str_pad($id, 8, "0", STR_PAD_LEFT),
                'nombreLegal' => $nombre,
                'domicilio' => "Calle Principal {$id}00, Ciudad",
            ]);
            
            $casasDeRemates[] = $casaDeRemates;
        }

        // Crear 6 rematadores
        $this->command->info('Creando rematadores...');
        $rematadores = [];
        
        $nombresRematadores = [
            ['nombre' => 'Juan', 'apellido' => 'Pérez'],
            ['nombre' => 'Ana', 'apellido' => 'González'],
            ['nombre' => 'Carlos', 'apellido' => 'Rodríguez'],
            ['nombre' => 'María', 'apellido' => 'López'],
            ['nombre' => 'Pedro', 'apellido' => 'Martínez'],
            ['nombre' => 'Laura', 'apellido' => 'Sánchez']
        ];
        
        foreach ($nombresRematadores as $index => $nombreData) {
            $id = $index + 4; // Comenzar después de las casas de remates
            $usuarioRematador = Usuario::create([
                'id' => $id,
                'tipo' => 'rematador',
                'email' => "rematador{$index}@eremate.com",
                'contrasenia' => Hash::make('password'),
            ]);
            
            $rematador = Rematador::create([
                'id' => $usuarioRematador->id,
                'nombre' => $nombreData['nombre'],
                'apellido' => $nombreData['apellido'],
                'numeroMatricula' => "RM" . str_pad($index + 1, 4, "0", STR_PAD_LEFT),
                'direccionFiscal' => "Av. Rematadores " . ($index + 1) . "00, Ciudad",
                'imagen' => "rematador" . ($index + 1) . ".jpg",
            ]);
            
            $rematadores[] = $rematador;
            
            // Asignar rematadores a casas (2 por casa)
            $casaIndex = intdiv($index, 2);
            $casasDeRemates[$casaIndex]->rematadores()->attach($rematador->id);
        }

        // Crear 10 usuarios registrados para pujas
        $this->command->info('Creando usuarios registrados...');
        $usuariosRegistrados = [];
        
        for ($i = 0; $i < 10; $i++) {
            $id = $i + 10; // Comenzar después de rematadores
            $usuarioRegistrado = Usuario::create([
                'id' => $id,
                'tipo' => 'registrado',
                'email' => "usuario{$i}@ejemplo.com",
                'contrasenia' => Hash::make('password'),
            ]);
            
            $userReg = UsuarioRegistrado::create([
                'id' => $usuarioRegistrado->id,
                'metodos_pago' => ['Tarjeta de Crédito', 'PayPal', 'Transferencia'],
            ]);
            
            $usuariosRegistrados[] = $userReg;
        }

        // Crear 10 subastas con 4 lotes cada una
        $this->command->info('Creando subastas y lotes...');
        $tiposSubasta = ['Online', 'Presencial', 'Híbrida'];
        $estados = [
            EstadoSubasta::PENDIENTE,
            EstadoSubasta::PENDIENTE_APROBACION,
            EstadoSubasta::ACEPTADA,
            EstadoSubasta::CANCELADA,
            EstadoSubasta::INICIADA,
            EstadoSubasta::CERRADA
        ];
        
        for ($i = 0; $i < 10; $i++) {
            // Distribuir subastas entre casas de remates
            $casaDeRematesIndex = $i % 3;
            // Distribuir subastas entre rematadores
            $rematadorIndex = $i % 6;
            
            $fechaInicio = now()->addDays(rand(-5, 30));
            $fechaCierre = clone $fechaInicio;
            $fechaCierre->addHours(rand(1, 24));
            
            $estado = $estados[$i % 6]; // Alternar estados
            
            $subasta = Subasta::create([
                'casaDeRemates_id' => $casasDeRemates[$casaDeRematesIndex]->id,
                'rematador_id' => $rematadores[$rematadorIndex]->id,
                'mensajes' => [],
                'urlTransmision' => "https://transmision.eremate.com/subasta{$i}",
                'tipoSubasta' => $tiposSubasta[$i % 3],
                'estado' => $estado,
                'fechaInicio' => $fechaInicio,
                'fechaCierre' => $fechaCierre,
                'ubicacion' => $tiposSubasta[$i % 3] === 'Online' ? 'Plataforma Online' : "Salón {$i}, Centro de Convenciones",
            ]);
            
            $lotes = [];
            
            // Crear 4 lotes por subasta
            for ($j = 0; $j < 4; $j++) {
                $valorBase = rand(10000, 100000) / 10;
                
                $lote = Lote::create([
                    'subasta_id' => $subasta->id,
                    'nombre' => "Lote " . ($j + 1) . " de Subasta " . ($i + 1),
                    'descripcion' => "Este es el lote " . ($j + 1) . " de la subasta " . ($i + 1) . ", con artículos seleccionados.",
                    'valorBase' => $valorBase,
                    'pujaMinima' => $valorBase * 0.05, // 5% del valor base
                    'oferta' => $estado === EstadoSubasta::INICIADA ? $valorBase + rand(0, 5000) : 0.00,
                    'disponibilidad' => 'Disponible',
                    'condicionesDeEntrega' => 'Entrega en 5 días hábiles después del pago',
                ]);
                
                $lotes[] = $lote;
                
                // Crear 5 artículos por lote
                for ($k = 0; $k < 5; $k++) {
                    $categoriaIndex = rand(0, 19); // Seleccionar una categoría al azar
                    
                    $estadosArticulo = ['Nuevo', 'Usado - Como nuevo', 'Usado - Buen estado', 'Usado - Aceptable'];
                    
                    Articulo::create([
                        'lote_id' => $lote->id,
                        'nombre' => 'Artículo ' . ($k + 1) . ' del Lote ' . ($j + 1),
                        'imagenes' => json_encode(["img_{$i}_{$j}_{$k}_1.jpg", "img_{$i}_{$j}_{$k}_2.jpg"]),
                        'especificacionesTecnicas' => json_encode([
                            'Dimensiones' => rand(10, 100) . "x" . rand(10, 100) . "x" . rand(5, 30) . " cm",
                            'Peso' => rand(1, 20) . " kg",
                            'Material' => ['Madera', 'Metal', 'Plástico', 'Vidrio', 'Cerámica'][rand(0, 4)],
                            'Año' => rand(1950, 2023)
                        ]),
                        'estado' => $estadosArticulo[rand(0, 3)],
                        'categoria_id' => $categorias[$categoriaIndex]->id,
                    ]);
                }
            }
            
            // Si la subasta está iniciada, establecer un lote actual
            if ($estado === EstadoSubasta::INICIADA) {
                $subasta->update([
                    'loteActual_id' => $lotes[0]->id
                ]);
            }
        }

        $this->command->info('¡Datos de prueba cargados correctamente!');
        */
    }
}