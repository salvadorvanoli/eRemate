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
        Schema::create('payment_requests', function (Blueprint $table) {
            $table->id();
            $table->decimal('monto', 10, 2);
            $table->string('metodo_entrega');
            $table->foreignId('chat_id')->constrained('chats');
            $table->foreignId('usuario_registrado_id')->constrained('usuarios_registrados');
            $table->foreignId('casa_de_remate_id')->constrained('casas_de_remates');
            $table->enum('estado', ['pendiente', 'pagado', 'cancelado'])->default('pendiente');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_requests');
    }
};
