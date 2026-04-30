<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Partner extends Model
{
    protected $table = 'partners';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'business_name', 'partner_type', 'business_address',
        'business_permit_url', 'government_id_url', 'contact_person',
        'contact_phone', 'commission_rate', 'status', 'rejection_reason',
        'approved_at', 'approved_by', 'created_at'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function cars()
    {
        return $this->hasMany(Car::class, 'partner_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'partner_id');
    }
}
