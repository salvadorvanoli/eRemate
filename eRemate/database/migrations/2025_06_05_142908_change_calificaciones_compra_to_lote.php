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
        Schema::table('calificaciones', function (Blueprint $table) {
           
            if (Schema::hasColumn('calificaciones', 'compra_id')) {
                $table->dropForeign(['compra_id']);
                $table->dropColumn('compra_id');
            }
            
            
            if (!Schema::hasColumn('calificaciones', 'lote_id')) {
                $table->unsignedBigInteger('lote_id')->after('usuarioRegistrado_id');
                $table->foreign('lote_id')->references('id')->on('lotes');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('calificaciones', function (Blueprint $table) {
            // Revertir cambios
            $table->dropForeign(['lote_id']);
            $table->dropColumn('lote_id');
            
            $table->unsignedBigInteger('compra_id');
            $table->foreign('compra_id')->references('id')->on('compras');
        });
    }
};
