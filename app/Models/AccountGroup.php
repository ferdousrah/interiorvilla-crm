<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AccountGroup extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'type'];

    public function accountHeads(): HasMany
    {
        return $this->hasMany(AccountHead::class, 'group_id');
    }
}
