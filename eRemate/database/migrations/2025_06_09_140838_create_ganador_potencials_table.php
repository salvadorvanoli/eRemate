<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ganadores_potenciales', function (Blueprint $table) {  // ✅ CAMBIAR AQUÍ
            $table->id();
            $table->foreignId('lote_id')->constrained('lotes')->onDelete('cascade');
            $table->foreignId('usuario_registrado_id')->constrained('usuarios_registrados')->onDelete('cascade');
            $table->integer('posicion');
            $table->enum('estado', ['pendiente', 'aceptado', 'rechazado'])->default('pendiente');
            $table->timestamp('fecha_notificacion')->nullable();
            $table->timestamp('fecha_respuesta')->nullable();
            $table->boolean('es_ganador_actual')->default(false);
            $table->timestamps();

            $table->index(['lote_id', 'posicion']);
            $table->index(['usuario_registrado_id', 'estado']);
            $table->index(['lote_id', 'es_ganador_actual']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ganadores_potenciales');  // ✅ CAMBIAR AQUÍ TAMBIÉN
    }
};
