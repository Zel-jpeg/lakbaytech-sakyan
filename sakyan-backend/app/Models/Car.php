<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Car extends Model
{
    protected $table = 'cars';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'partner_id', 'name', 'brand', 'model', 'year', 'plate_number',
        'transmission', 'fuel_type', 'seats', 'color', 'price_per_day',
        'location', 'description', 'features', 'status', 'is_available',
        'created_at', 'updated_at'
    ];

    protected $casts = [
        'features'     => 'array',
        'is_available' => 'boolean',
        'price_per_day' => 'decimal:2',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    public function images()
    {
        return $this->hasMany(CarImage::class, 'car_id');
    }

    public function primaryImage()
    {
        return $this->hasOne(CarImage::class, 'car_id')->where('is_primary', true);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'car_id');
    }
}
