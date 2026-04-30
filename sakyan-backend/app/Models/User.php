<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $table = 'users';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'full_name', 'email', 'phone', 'role', 'avatar_url',
        'created_at', 'updated_at'
    ];

    protected $hidden = [];

    public function partner()
    {
        return $this->hasOne(Partner::class, 'user_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'customer_id');
    }

    public function customerProfile()
    {
        return $this->hasOne(CustomerProfile::class, 'user_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'user_id');
    }
}
