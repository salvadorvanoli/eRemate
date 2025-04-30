<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void {
        Schema::create('articulos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lote_id')->constrained()->onDelete('cascade');
            $table->json('imagenes');
            $table->json('especificacionesTecnicas');
            $table->string('estado');
            $table->foreignId('categoria_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('articulos');
    }
};
