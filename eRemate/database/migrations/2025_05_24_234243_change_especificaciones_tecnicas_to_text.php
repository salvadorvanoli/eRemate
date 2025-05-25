<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Primero respaldamos los datos existentes como texto
        $articulos = DB::table('articulos')->get();
        foreach ($articulos as $articulo) {
            $especificaciones = json_decode($articulo->especificacionesTecnicas);
            if ($especificaciones) {
                // Convertir a string si es un objeto/array
                if (is_array($especificaciones) || is_object($especificaciones)) {
                    $especificacionesString = json_encode($especificaciones);
                } else {
                    $especificacionesString = (string)$especificaciones;
                }
                DB::table('articulos')
                    ->where('id', $articulo->id)
                    ->update(['especificacionesTecnicas' => $especificacionesString]);
            }
        }

        // Luego cambiamos el tipo de columna
        Schema::table('articulos', function (Blueprint $table) {
            $table->text('especificacionesTecnicas')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articulos', function (Blueprint $table) {
            $table->json('especificacionesTecnicas')->change();
        });
    }
};
