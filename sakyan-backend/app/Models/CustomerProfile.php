<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerProfile extends Model
{
    protected $table = 'customer_profiles';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'birthday', 'address', 'drivers_license_number',
        'drivers_license_url', 'license_expiry', 'valid_id_type',
        'valid_id_url', 'selfie_url', 'is_verified', 'created_at', 'updated_at'
    ];

    protected $casts = ['is_verified' => 'boolean'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
