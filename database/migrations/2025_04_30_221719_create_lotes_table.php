<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void {
        Schema::create('lotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subasta_id')->constrained('subastas')->onDelete('cascade');
            $table->foreignId('compra_id')->nullable()->constrained('compras')->nullOnDelete();
            $table->timestamps();
            $table->float('valorBase');
            $table->float('pujaMinima');
            $table->string('disponibilidad');
            $table->string('condicionesDeEntrega');
        });
    }

    public function down(): void {
        Schema::dropIfExists('lotes');
    }
};
