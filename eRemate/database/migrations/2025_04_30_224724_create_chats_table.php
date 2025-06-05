<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('chats', function (Blueprint $table) {
            $table->unsignedBigInteger('id');
            $table->primary('id');
            $table->foreign('id')->references('id')->on('lotes');
            $table->foreignId('usuarioRegistrado_id')->constrained('usuarios_registrados')->onDelete('cascade');
            $table->foreignId('casa_de_remate_id')->constrained('casas_de_remates')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chats');
    }
};
