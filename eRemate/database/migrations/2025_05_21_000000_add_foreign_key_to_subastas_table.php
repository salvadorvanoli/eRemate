<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subastas', function (Blueprint $table) {
            // Añadimos la restricción de clave foránea para loteActual_id ahora que la tabla lotes ya existe
            $table->foreign('loteActual_id')->references('id')->on('lotes')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('subastas', function (Blueprint $table) {
            $table->dropForeign(['loteActual_id']);
        });
    }
};
