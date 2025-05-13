<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lote_usuario_registrado', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lote_id')->constrained()->onDelete('cascade');
            $table->foreignId('usuario_registrado_id')->constrained('usuarios_registrados')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lote_usuario_registrado');
    }
};