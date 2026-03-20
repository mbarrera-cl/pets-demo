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
        Schema::create('pets', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->enum('type', ['dog', 'cat']);
            $table->string('breed', 100)->nullable();
            $table->unsignedSmallInteger('age');
            $table->string('owner_name', 100);
            $table->string('owner_email', 150);
            $table->timestamps();

            $table->index('owner_email');
            $table->index(['type', 'owner_email']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pets');
    }
};
