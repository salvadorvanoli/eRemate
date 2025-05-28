<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('puja_automaticas', function (Blueprint $table) {
            $table->id();
            $table->float('presupuesto');
            $table->foreignId('lote_id')->constrained('lotes')->onDelete('cascade');
            $table->foreignId('usuarioRegistrado_id')->constrained('usuarios_registrados')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('puja_automaticas');
    }

};
