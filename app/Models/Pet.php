<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

#[Fillable(['name', 'type', 'breed', 'age', 'owner_name', 'owner_email'])]
class Pet extends Model
{
    public function scopeByOwner($query, string $email)
    {
        return $query->where('owner_email', $email);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeOlderThan($query, int $age)
    {
        return $query->where('age', '>=', $age);
    }

    protected function name(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => trim(strip_tags($value)),
        );
    }

    protected function ownerName(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => trim(strip_tags($value)),
        );
    }

    protected function ownerEmail(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => strtolower(trim($value)),
        );
    }
}
