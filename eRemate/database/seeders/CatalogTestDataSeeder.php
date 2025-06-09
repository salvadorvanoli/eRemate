<?php

namespace Database\Seeders;

use App\Enums\EstadoSubasta;
use App\Enums\TipoSubasta;
use App\Enums\EstadoArticulo;
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
        /////////////// CATEGORÍAS ///////////////
        $this->command->info('📂 Creando categorías...');
        
        $categorias = [];
        $nombresCategorias = [
            'Antigüedades', 'Arte', 'Automóviles', 'Coleccionables', 'Deportes', 
            'Electrónica', 'Fotografía', 'Hogar', 'Inmuebles', 'Instrumentos Musicales',
            'Joyería', 'Libros', 'Maquinaria', 'Moda', 'Monedas', 
            'Muebles', 'Relojes', 'Tecnología', 'Vinos', 'Otros'
        ];
        
        foreach ($nombresCategorias as $nombre) {
            $categoria = Categoria::create([
                'nombre' => $nombre
            ]);
            $categorias[] = $categoria;
        }

        $this->command->info('✅ Categorías creadas: ' . count($categorias));

        /////////////// CASAS DE REMATES ///////////////
        $this->command->info('🏢 Creando casas de remates...');
        
        $casasDeRemates = [];
        $datosCasas = [
            [
                'email' => 'casa1@eremate.com',
                'identificacionFiscal' => 'RUT12345678',
                'nombreLegal' => 'Casa de Remates Premium',
                'domicilio' => 'Av. Principal 123, Ciudad'
            ],
            [
                'email' => 'casa2@eremate.com',
                'identificacionFiscal' => 'RUT87654321',
                'nombreLegal' => 'Subastas Exclusivas S.A.',
                'domicilio' => 'Calle Comercial 456, Ciudad'
            ],
            [
                'email' => 'casa3@eremate.com',
                'identificacionFiscal' => 'RUT11223344',
                'nombreLegal' => 'Remates Internacional Ltda.',
                'domicilio' => 'Paseo Central 789, Ciudad'
            ]
        ];

        foreach ($datosCasas as $index => $datos) {
            $id = $index + 1;
            
            // Crear usuario para la casa
            $usuarioCasa = Usuario::create([
                'id' => $id,
                'tipo' => 'casa',
                'email' => $datos['email'],
                'contrasenia' => Hash::make('password'),
            ]);

            // Crear casa de remates
            $casaDeRemates = CasaDeRemates::create([
                'id' => $usuarioCasa->id,
                'identificacionFiscal' => $datos['identificacionFiscal'],
                'nombreLegal' => $datos['nombreLegal'],
                'domicilio' => $datos['domicilio'],
            ]);

            $casasDeRemates[] = $casaDeRemates;
        }

        $this->command->info('✅ Casas de remates creadas: ' . count($casasDeRemates));

        /////////////// REMATADORES ///////////////
        $this->command->info('🔨 Creando rematadores...');
        
        $rematadores = [];
        $datosRematadores = [
            [
                'email' => 'rematador1@eremate.com',
                'nombre' => 'Juan Carlos',
                'apellido' => 'Pérez González',
                'numeroMatricula' => 'RM0001',
                'direccionFiscal' => 'Av. Rematadores 100, Ciudad'
            ],
            [
                'email' => 'rematador2@eremate.com',
                'nombre' => 'Ana María',
                'apellido' => 'López Rodríguez',
                'numeroMatricula' => 'RM0002',
                'direccionFiscal' => 'Calle Martillo 200, Ciudad'
            ],
            [
                'email' => 'rematador3@eremate.com',
                'nombre' => 'Carlos Eduardo',
                'apellido' => 'Martínez Silva',
                'numeroMatricula' => 'RM0003',
                'direccionFiscal' => 'Plaza Subastas 300, Ciudad'
            ]
        ];

        foreach ($datosRematadores as $index => $datos) {
            $id = $index + 4; // IDs 4, 5, 6 (después de las casas)
            
            // Crear usuario para el rematador
            $usuarioRematador = Usuario::create([
                'id' => $id,
                'tipo' => 'rematador',
                'email' => $datos['email'],
                'contrasenia' => Hash::make('password'),
            ]);

            // Crear rematador
            $rematador = Rematador::create([
                'id' => $usuarioRematador->id,
                'nombre' => $datos['nombre'],
                'apellido' => $datos['apellido'],
                'numeroMatricula' => $datos['numeroMatricula'],
                'direccionFiscal' => $datos['direccionFiscal'],
                'imagen' => null,
            ]);

            $rematadores[] = $rematador;

            // Asociar cada rematador a una casa (uno por casa)
            $casasDeRemates[$index]->rematadores()->attach($rematador->id);
        }

        $this->command->info('✅ Rematadores creados: ' . count($rematadores));

        /////////////// USUARIOS REGISTRADOS ///////////////
        $this->command->info('👥 Creando usuarios registrados...');
        
        $usuariosRegistrados = [];
        $datosUsuarios = [
            [
                'email' => 'usuario1@ejemplo.com',
                'metodos_pago' => ['Tarjeta de Crédito', 'PayPal']
            ],
            [
                'email' => 'usuario2@ejemplo.com',
                'metodos_pago' => ['Tarjeta de Débito', 'Transferencia Bancaria']
            ],
            [
                'email' => 'usuario3@ejemplo.com',
                'metodos_pago' => ['Tarjeta de Crédito', 'PayPal', 'Transferencia Bancaria']
            ]
        ];

        foreach ($datosUsuarios as $index => $datos) {
            $id = $index + 7; // IDs 7, 8, 9 (después de rematadores)
            
            // Crear usuario registrado
            $usuarioRegistrado = Usuario::create([
                'id' => $id,
                'tipo' => 'registrado',
                'email' => $datos['email'],
                'contrasenia' => Hash::make('password'),
            ]);

            // Crear usuario registrado específico
            $userReg = UsuarioRegistrado::create([
                'id' => $usuarioRegistrado->id,
                'metodos_pago' => $datos['metodos_pago'],
            ]);

            $usuariosRegistrados[] = $userReg;
        }


        $this->command->info('✅ Usuarios registrados creados: ' . count($usuariosRegistrados));

        /////////////// SUBASTAS DE CASA 1 ///////////////
        $this->command->info('🔨 Creando subastas para Casa 1...');
        
        $casa1 = $casasDeRemates[0]; // Casa de Remates Premium
        $rematador1 = $rematadores[0]; // Juan Carlos

        // Obtener categorías por nombre para usarlas en los artículos
        $catElectronica = Categoria::where('nombre', 'Electrónica')->first();
        $catModa = Categoria::where('nombre', 'Moda')->first();
        $catHogar = Categoria::where('nombre', 'Hogar')->first();
        $catAntiguedades = Categoria::where('nombre', 'Antigüedades')->first();

        // ========== SUBASTA 1: Cosas viejas ==========
        $subasta1 = Subasta::create([
            'casaDeRemates_id' => $casa1->id,
            'rematador_id' => $rematador1->id,
            'mensajes' => [],
            'urlTransmision' => 'https://transmision.eremate.com/cosas-viejas',
            'tipoSubasta' => TipoSubasta::PRESENCIAL, // ← Usando enum
            'estado' => EstadoSubasta::PENDIENTE, // ← Usando enum
            'fechaInicio' => now()->addDays(2),
            'fechaCierre' => now()->addDays(3),
            'ubicacion' => 'Santa Lucía, Canelones',
        ]);

        // Lote 1: Teléfono
        $lote1_1 = Lote::create([
            'subasta_id' => $subasta1->id,
            'nombre' => 'Teléfono Vintage',
            'descripcion' => 'Teléfono vintage de los años 80 en excelente estado',
            'valorBase' => 1500.00,
            'pujaMinima' => 100.00,
            'oferta' => 0.00,
            'disponibilidad' => 'Disponible',
            'condicionesDeEntrega' => 'Entrega inmediata post-subasta',
            'vendedorExterno' => false
        ]);

        Articulo::create([
            'lote_id' => $lote1_1->id,
            'nombre' => 'Teléfono Rotativo Naranja',
            'imagenes' => [url('api/images/serve/articulos/telefonoNaranja.webp')],
            'especificacionesTecnicas' => 'Teléfono rotativo vintage, funcionamiento verificado, cable original incluido',
            'estado' => EstadoArticulo::MUY_BUENO, // ← Usando enum (antes: 'Muy bueno')
            'categoria_id' => $catElectronica->id,
        ]);

        // Lote 2: Ropa
        $lote1_2 = Lote::create([
            'subasta_id' => $subasta1->id,
            'nombre' => 'Accesorios Vintage',
            'descripcion' => 'Colección de accesorios y ropa vintage',
            'valorBase' => 800.00,
            'pujaMinima' => 50.00,
            'oferta' => 0.00,
            'disponibilidad' => 'Disponible',
            'condicionesDeEntrega' => 'Entrega inmediata post-subasta',
            'vendedorExterno' => false
        ]);

        Articulo::create([
            'lote_id' => $lote1_2->id,
            'nombre' => 'Gorro de Lana Vintage',
            'imagenes' => [url('api/images/serve/articulos/GorroLanaVintage.jpg')],
            'especificacionesTecnicas' => 'Gorro de lana tejido a mano, estilo vintage años 70',
            'estado' => EstadoArticulo::BUENO, // ← Usando enum
            'categoria_id' => $catModa->id,
        ]);

        Articulo::create([
            'lote_id' => $lote1_2->id,
            'nombre' => 'Camiseta Band Vintage',
            'imagenes' => [
                url('api/images/serve/articulos/CamisetaVintage1.jpeg'),
                url('api/images/serve/articulos/CamisetaVintage2.jpeg')
            ],
            'especificacionesTecnicas' => 'Camiseta original de banda de rock, años 80, talla M',
            'estado' => EstadoArticulo::BUENO, // ← Usando enum (antes: 'Usado - Bueno')
            'categoria_id' => $catModa->id,
        ]);

        // ========== SUBASTA 2: Celular ==========
        $subasta2 = Subasta::create([
            'casaDeRemates_id' => $casa1->id,
            'rematador_id' => $rematador1->id,
            'mensajes' => [],
            'urlTransmision' => 'https://transmision.eremate.com/celular',
            'tipoSubasta' => TipoSubasta::REMOTA, // ← Usando enum (antes: 'Celular')
            'estado' => EstadoSubasta::PENDIENTE, // ← Usando enum
            'fechaInicio' => now()->addDays(5),
            'fechaCierre' => now()->addDays(6),
            'ubicacion' => 'San José de Mayo, San José',
        ]);

        // Lote 1: Celular
        $lote2_1 = Lote::create([
            'subasta_id' => $subasta2->id,
            'nombre' => 'Smartphone Premium',
            'descripcion' => 'iPhone en excelente estado con todos sus accesorios',
            'valorBase' => 8000.00,
            'pujaMinima' => 500.00,
            'oferta' => 0.00,
            'disponibilidad' => 'Disponible',
            'condicionesDeEntrega' => 'Envío gratuito a domicilio',
            'vendedorExterno' => false
        ]);

        Articulo::create([
            'lote_id' => $lote2_1->id,
            'nombre' => 'iPhone 13 Pro',
            'imagenes' => [
                url('api/images/serve/articulos/iphone1.webp'),
                url('api/images/serve/articulos/iphone2.webp'),
                url('api/images/serve/articulos/iphone3.jpeg')
            ],
            'especificacionesTecnicas' => 'iPhone 13 Pro 256GB, color Azul Sierra, incluye cargador original y caja',
            'estado' => EstadoArticulo::MUY_BUENO, // ← Usando enum (antes: 'Excelente')
            'categoria_id' => $catElectronica->id,
        ]);

        // ========== SUBASTA 3: Ropa ==========
        $subasta3 = Subasta::create([
            'casaDeRemates_id' => $casa1->id,
            'rematador_id' => $rematador1->id,
            'mensajes' => [],
            'urlTransmision' => 'https://transmision.eremate.com/ropa',
            'tipoSubasta' => TipoSubasta::HIBRIDA, // ← Usando enum (antes: 'Ropa variada')
            'estado' => EstadoSubasta::ACEPTADA, // ← Usando enum
            'fechaInicio' => now()->addDays(7),
            'fechaCierre' => now()->addDays(8),
            'ubicacion' => 'Pocitos, Montevideo',
        ]);

        // Lote 1: Busos
        $lote3_1 = Lote::create([
            'subasta_id' => $subasta3->id,
            'nombre' => 'Colección de Busos',
            'descripcion' => 'Tres busos de diferentes colores en excelente estado',
            'valorBase' => 2500.00,
            'pujaMinima' => 200.00,
            'oferta' => 0.00,
            'disponibilidad' => 'Disponible',
            'condicionesDeEntrega' => 'Entrega en 2 días hábiles',
            'vendedorExterno' => false
        ]);

        Articulo::create([
            'lote_id' => $lote3_1->id,
            'nombre' => 'Buso Azul',
            'imagenes' => [
                url('api/images/serve/articulos/buzoAzul1.webp'),
                url('api/images/serve/articulos/buzoAzul2.webp')
            ],
            'especificacionesTecnicas' => 'Buso deportivo azul marino, talla L, 100% algodón',
            'estado' => EstadoArticulo::NUEVO, // ← Usando enum
            'categoria_id' => $catModa->id,
        ]);

        Articulo::create([
            'lote_id' => $lote3_1->id,
            'nombre' => 'Buso Rojo',
            'imagenes' => [
                url('api/images/serve/articulos/BuzoRojo1.jpeg'),
                url('api/images/serve/articulos/buzoRojo2.jpg')
            ],
            'especificacionesTecnicas' => 'Buso casual rojo, talla M, mezcla algodón-poliéster',
            'estado' => EstadoArticulo::NUEVO, // ← Usando enum
            'categoria_id' => $catModa->id,
        ]);

        Articulo::create([
            'lote_id' => $lote3_1->id,
            'nombre' => 'Buso Violeta',
            'imagenes' => [
                url('api/images/serve/articulos/buzoVioleta.jpeg')
            ],
            'especificacionesTecnicas' => 'Buso con capucha violeta, talla S, material premium',
            'estado' => EstadoArticulo::NUEVO, // ← Usando enum
            'categoria_id' => $catModa->id,
        ]);

        // Lote 2: Pantalones
        $lote3_2 = Lote::create([
            'subasta_id' => $subasta3->id,
            'nombre' => 'Jeans Premium',
            'descripcion' => 'Dos jeans de alta calidad en diferentes colores',
            'valorBase' => 1800.00,
            'pujaMinima' => 150.00,
            'oferta' => 0.00,
            'disponibilidad' => 'Disponible',
            'condicionesDeEntrega' => 'Entrega en 2 días hábiles',
            'vendedorExterno' => false
        ]);

        Articulo::create([
            'lote_id' => $lote3_2->id,
            'nombre' => 'Jean Azul Clásico',
            'imagenes' => [
                url('api/images/serve/articulos/jeanAzul.jpg')
            ],
            'especificacionesTecnicas' => 'Jean azul clásico, corte slim fit, talla 32, marca premium',
            'estado' => EstadoArticulo::NUEVO, // ← Usando enum
            'categoria_id' => $catModa->id,
        ]);

        Articulo::create([
            'lote_id' => $lote3_2->id,
            'nombre' => 'Jean Negro Elegante',
            'imagenes' => [
                url('api/images/serve/articulos/jeanNegro1.jpeg'),
                url('api/images/serve/articulos/jeanNegro2.jpg')
            ],
            'especificacionesTecnicas' => 'Jean negro elegante, corte regular, talla 34, mezclilla premium',
            'estado' => EstadoArticulo::NUEVO, // ← Usando enum
            'categoria_id' => $catModa->id,
        ]);

        // Lote 3: Cinturón
        $lote3_3 = Lote::create([
            'subasta_id' => $subasta3->id,
            'nombre' => 'Cinturón de Cuero',
            'descripcion' => 'Cinturón de cuero genuino con hebilla elegante',
            'valorBase' => 600.00,
            'pujaMinima' => 75.00,
            'oferta' => 0.00,
            'disponibilidad' => 'Disponible',
            'condicionesDeEntrega' => 'Entrega inmediata',
            'vendedorExterno' => false
        ]);

        Articulo::create([
            'lote_id' => $lote3_3->id,
            'nombre' => 'Cinturón Cuero Marrón',
            'imagenes' => [
                url('api/images/serve/articulos/cinturonCuero.jpg')
            ],
            'especificacionesTecnicas' => 'Cinturón de cuero genuino marrón, hebilla metálica, longitud ajustable',
            'estado' => EstadoArticulo::NUEVO, // ← Usando enum
            'categoria_id' => $catModa->id,
        ]);

        // ========== SUBASTA 4: Heladera ==========
        $subasta4 = Subasta::create([
            'casaDeRemates_id' => $casa1->id,
            'rematador_id' => $rematador1->id,
            'mensajes' => [],
            'urlTransmision' => 'https://transmision.eremate.com/electrodomesticos',
            'tipoSubasta' => TipoSubasta::PRESENCIAL, // ← Usando enum (antes: 'Electrodomésticos')
            'estado' => EstadoSubasta::INICIADA, // ← Usando enum
            'fechaInicio' => now()->addDays(10),
            'fechaCierre' => now()->addDays(11),
            'ubicacion' => 'Canelones, Canelones',
        ]);

        // Lote 1: Heladera
        $lote4_1 = Lote::create([
            'subasta_id' => $subasta4->id,
            'nombre' => 'Refrigerador Familiar',
            'descripcion' => 'Heladera de gran capacidad en excelente estado',
            'valorBase' => 12000.00,
            'pujaMinima' => 1000.00,
            'oferta' => 0.00,
            'disponibilidad' => 'Disponible',
            'condicionesDeEntrega' => 'Instalación incluida, entrega en 5 días',
            'vendedorExterno' => false
        ]);

        Articulo::create([
            'lote_id' => $lote4_1->id,
            'nombre' => 'Heladera Samsung 450L',
            'imagenes' => [
                url('api/images/serve/articulos/Heladera1.png'),
                url('api/images/serve/articulos/Heladera2.jpeg')
            ],
            'especificacionesTecnicas' => 'Refrigerador Samsung 450L, doble puerta, dispensador de agua, eficiencia energética A+',
            'estado' => EstadoArticulo::MUY_BUENO, // ← Usando enum (antes: 'Muy bueno')
            'categoria_id' => $catHogar->id,
        ]);

        // Lote 2: Freezer
        $lote4_2 = Lote::create([
            'subasta_id' => $subasta4->id,
            'nombre' => 'Congelador Horizontal',
            'descripcion' => 'Freezer horizontal de alta capacidad',
            'valorBase' => 8000.00,
            'pujaMinima' => 700.00,
            'oferta' => 0.00,
            'disponibilidad' => 'Disponible',
            'condicionesDeEntrega' => 'Instalación incluida, entrega en 5 días',
            'vendedorExterno' => false
        ]);

        Articulo::create([
            'lote_id' => $lote4_2->id,
            'nombre' => 'Freezer Horizontal 300L',
            'imagenes' => [
                url('api/images/serve/articulos/freezer.jpg')
            ],
            'especificacionesTecnicas' => 'Congelador horizontal 300L, control de temperatura digital, bajo consumo energético',
            'estado' => EstadoArticulo::MUY_BUENO, // ← Usando enum (antes: 'Excelente')
            'categoria_id' => $catHogar->id,
        ]);

        $this->command->info('✅ Subastas de Casa 1 creadas: 4 subastas, 8 lotes, 11 artículos');

        /////////////// RESUMEN ///////////////
        $this->command->info('🎉 ¡Datos de prueba creados correctamente!');
        $this->command->info('');
        $this->command->info('📊 RESUMEN:');
        $this->command->info('  📂 Categorías: ' . count($categorias));
        $this->command->info('  🏢 Casas de remates: ' . count($casasDeRemates));
        $this->command->info('  🔨 Rematadores: ' . count($rematadores));
        $this->command->info('  👥 Usuarios registrados: ' . count($usuariosRegistrados));
        $this->command->info('  🏛️ Subastas Casa 1: 4 subastas con 8 lotes y 11 artículos');
        $this->command->info('');
        $this->command->info('🔑 CREDENCIALES (todas usan password: "password"):');
        
        // Mostrar casas
        foreach ($casasDeRemates as $index => $casa) {
            $this->command->info("  🏢 {$casa->nombreLegal}: casa" . ($index + 1) . "@eremate.com");
        }
        
        // Mostrar rematadores
        foreach ($rematadores as $index => $rematador) {
            $this->command->info("  🔨 {$rematador->nombre} {$rematador->apellido}: rematador" . ($index + 1) . "@eremate.com");
        }
        
        // Mostrar usuarios
        foreach ($usuariosRegistrados as $index => $usuario) {
            $this->command->info("  👤 Usuario " . ($index + 1) . ": usuario" . ($index + 1) . "@ejemplo.com");

        }

        $this->command->info('');
        $this->command->info('📋 SUBASTAS CREADAS PARA CASA 1:');
        $this->command->info('  1. 🕰️  Cosas viejas (PRESENCIAL - PENDIENTE)');
        $this->command->info('  2. 📱 Celular (REMOTA - PENDIENTE)'); 
        $this->command->info('  3. 👕 Ropa (HIBRIDA - ACEPTADA)');
        $this->command->info('  4. ❄️  Heladera (PRESENCIAL - INICIADA)');
        $this->command->info('');
        $this->command->info('💡 Todos los campos ahora usan los enums correctos');
    }
}