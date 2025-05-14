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
        Schema::create('lote_usuario_registrado_favorito', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('usuario_registrado_id');
            $table->unsignedBigInteger('lote_id');
            $table->timestamps();

            $table->foreign('usuario_registrado_id')->references('id')->on('usuarios_registrados')->onDelete('cascade');
            $table->foreign('lote_id')->references('id')->on('lotes')->onDelete('cascade');
            $table->unique(['usuario_registrado_id', 'lote_id'], 'usuario_lote_fav_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lote_usuario_registrado_favorito');
    }
};
