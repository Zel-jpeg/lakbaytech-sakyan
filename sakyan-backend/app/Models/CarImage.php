<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CarImage extends Model
{
    protected $table = 'car_images';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['car_id', 'image_url', 'is_primary', 'created_at'];

    protected $casts = ['is_primary' => 'boolean'];

    public function car()
    {
        return $this->belongsTo(Car::class, 'car_id');
    }
}
