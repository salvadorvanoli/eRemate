<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateArticulosTable extends Migration
{
    public function up(): void
    {
        Schema::create('articulos', function (Blueprint $table) {
            $table->id();
            $table->json('imagenes');
            $table->json('especificacionesTecnicas');
            $table->decimal('valorBase', 10, 2);
            $table->decimal('pujaMinima', 10, 2);
            $table->string('disponibilidad');
            $table->text('condicionesDeEntrega');
            $table->foreignId('casa_de_remate_id')->constrained('casa_de_remates')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articulos');
    }
}