<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void {
        Schema::create('subastas', function (Blueprint $table) {
            $table->id();
            $table->json('mensajes');
            $table->string('urlTransmision');
            $table->string('tipoSubasta');
            $table->dateTime('fechaInicio');
            $table->dateTime('fechaCierre');
            $table->string('ubicacion');
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('subastas');
    }
};