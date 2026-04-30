<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $table = 'messages';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'booking_id', 'sender_id', 'receiver_id', 'content', 'is_read', 'created_at'
    ];

    protected $casts = ['is_read' => 'boolean'];

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
