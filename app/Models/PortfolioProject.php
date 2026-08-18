<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PortfolioProject extends Model
{
    use HasUuids, SoftDeletes, Auditable;

    protected $fillable = [
        'title', 'type', 'location', 'area_sqft', 'year',
        'description', 'photos', 'website_url', 'is_featured', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'photos'      => 'array',
            'is_featured' => 'boolean',
            'area_sqft'   => 'decimal:2',
        ];
    }
}
