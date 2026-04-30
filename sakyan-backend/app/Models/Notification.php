<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notifications';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'title', 'message', 'type', 'is_read', 'reference_id', 'created_at'
    ];

    protected $casts = ['is_read' => 'boolean'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
