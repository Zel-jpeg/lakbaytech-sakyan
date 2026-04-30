<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $table = 'bookings';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'booking_code', 'car_id', 'customer_id', 'partner_id',
        'start_date', 'end_date', 'pickup_location', 'return_location',
        'total_days', 'price_per_day', 'subtotal', 'booking_fee',
        'commission_amount', 'total_amount', 'partner_net',
        'payment_method', 'payment_status', 'gcash_reference',
        'booking_status', 'special_requests', 'admin_notes',
        'created_at', 'updated_at'
    ];

    protected $casts = [
        'price_per_day'     => 'decimal:2',
        'subtotal'          => 'decimal:2',
        'booking_fee'       => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'total_amount'      => 'decimal:2',
        'partner_net'       => 'decimal:2',
    ];

    public function car()
    {
        return $this->belongsTo(Car::class, 'car_id');
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'booking_id');
    }
}
