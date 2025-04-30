<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCasaDeRematesTable extends Migration
{
    public function up(): void
    {
        Schema::create('casa_de_remates', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('identificacionFiscal')->unique();
            $table->string('nombreLegal');
            $table->string('email')->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('casa_de_remates');
    }
}