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
        Schema::create('casa_remates_rematador', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rematador_id')->constrained('rematadores')->onDelete('cascade');
            $table->foreignId('casaDeRemates_id')->constrained('casas_de_remates')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('casa_remates_rematador');
    }
};
