<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class CodeGeneratorService
{
    /**
     * Generate a unique code for a model.
     * Format: {PREFIX}-{YYYY}-{###} e.g. CL-2025-001
     * For no-year codes (ITM, EMP): {PREFIX}-{###}
     */
    public function generate(string $prefix, string $table, bool $withYear = true): string
    {
        return DB::transaction(function () use ($prefix, $table, $withYear) {
            $year = now()->format('Y');

            if ($withYear) {
                $pattern = $prefix . '-' . $year . '-%';
                $like = $prefix . '-' . $year . '-';
            } else {
                $pattern = $prefix . '-%';
                $like = $prefix . '-';
            }

            // Lock the row to prevent race conditions
            $latest = DB::table($table)
                ->where('code', 'like', $pattern)
                ->lockForUpdate()
                ->orderBy('code', 'desc')
                ->value('code');

            if ($latest) {
                $lastNumber = (int) substr($latest, strlen($like));
                $nextNumber = $lastNumber + 1;
            } else {
                $nextNumber = 1;
            }

            $paddedNumber = str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

            if ($withYear) {
                return $prefix . '-' . $year . '-' . $paddedNumber;
            }

            return $prefix . '-' . $paddedNumber;
        });
    }
}
