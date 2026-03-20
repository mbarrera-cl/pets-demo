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
        // Solo quitar el unique si existe (puede no existir dependiendo de cuándo se instaló)
        $exists = DB::select(
            "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='pets' AND name='pets_owner_email_unique'"
        );

        if (!empty($exists)) {
            Schema::table('pets', function (Blueprint $table) {
                $table->dropUnique(['owner_email']);
            });
        }
    }

    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->unique('owner_email');
        });
    }
};
