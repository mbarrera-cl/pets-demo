<?php

namespace Database\Seeders;

use App\Models\Breed;
use Illuminate\Database\Seeder;

class BreedSeeder extends Seeder
{
    public function run(): void
    {
        $dogs = [
            'Labrador Retriever',
            'German Shepherd',
            'Golden Retriever',
            'French Bulldog',
            'Bulldog',
            'Beagle',
            'Poodle',
            'Rottweiler',
            'Yorkshire Terrier',
            'Boxer',
            'Dachshund',
            'Shih Tzu',
            'Siberian Husky',
            'Doberman Pinscher',
            'Great Dane',
            'Border Collie',
            'Australian Shepherd',
            'Chihuahua',
            'Cavalier King Charles Spaniel',
            'Maltese',
        ];

        $cats = [
            'Persian',
            'Maine Coon',
            'Siamese',
            'British Shorthair',
            'Ragdoll',
            'Bengal',
            'Sphynx',
            'American Shorthair',
            'Scottish Fold',
            'Abyssinian',
            'Russian Blue',
            'Birman',
            'Norwegian Forest Cat',
            'Burmese',
            'Turkish Angora',
            'Exotic Shorthair',
            'Devon Rex',
            'Himalayan',
            'Tonkinese',
            'Cornish Rex',
        ];

        foreach ($dogs as $i => $name) {
            Breed::firstOrCreate(
                ['name' => $name, 'type' => 'dog'],
                ['is_active' => true, 'sort_order' => $i]
            );
        }

        foreach ($cats as $i => $name) {
            Breed::firstOrCreate(
                ['name' => $name, 'type' => 'cat'],
                ['is_active' => true, 'sort_order' => $i]
            );
        }
    }
}
