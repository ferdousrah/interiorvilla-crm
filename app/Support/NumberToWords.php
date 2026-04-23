<?php

namespace App\Support;

/**
 * Convert a number to English words using the Indian/Bangladeshi
 * numbering system (Lakh, Crore).
 */
class NumberToWords
{
    private const ONES = [
        0 => '', 1 => 'One', 2 => 'Two', 3 => 'Three', 4 => 'Four',
        5 => 'Five', 6 => 'Six', 7 => 'Seven', 8 => 'Eight', 9 => 'Nine',
        10 => 'Ten', 11 => 'Eleven', 12 => 'Twelve', 13 => 'Thirteen',
        14 => 'Fourteen', 15 => 'Fifteen', 16 => 'Sixteen',
        17 => 'Seventeen', 18 => 'Eighteen', 19 => 'Nineteen',
    ];

    private const TENS = [
        2 => 'Twenty', 3 => 'Thirty', 4 => 'Forty', 5 => 'Fifty',
        6 => 'Sixty', 7 => 'Seventy', 8 => 'Eighty', 9 => 'Ninety',
    ];

    /** Format an amount as "Taka ... Only" or with Paisa where needed */
    public static function toBdt(float $amount): string
    {
        $amount = round($amount, 2);
        $taka   = (int) floor($amount);
        $paisa  = (int) round(($amount - $taka) * 100);

        $words = 'Taka ' . self::indianWords($taka);
        if ($paisa > 0) {
            $words .= ' and ' . self::indianWords($paisa) . ' Paisa';
        }
        return trim($words) . ' Only';
    }

    /** Convert an integer to Indian-system words (Crore, Lakh, Thousand) */
    public static function indianWords(int $n): string
    {
        if ($n === 0) return 'Zero';

        $parts = [];

        $crore = intdiv($n, 10000000);
        $n %= 10000000;
        if ($crore > 0) $parts[] = self::indianWords($crore) . ' Crore';

        $lakh = intdiv($n, 100000);
        $n %= 100000;
        if ($lakh > 0) $parts[] = self::indianWords($lakh) . ' Lakh';

        $thousand = intdiv($n, 1000);
        $n %= 1000;
        if ($thousand > 0) $parts[] = self::indianWords($thousand) . ' Thousand';

        $hundred = intdiv($n, 100);
        $n %= 100;
        if ($hundred > 0) $parts[] = self::ONES[$hundred] . ' Hundred';

        if ($n > 0) {
            if ($n < 20) {
                $parts[] = self::ONES[$n];
            } else {
                $t = intdiv($n, 10);
                $u = $n % 10;
                $parts[] = $u ? self::TENS[$t] . ' ' . self::ONES[$u] : self::TENS[$t];
            }
        }

        return implode(' ', $parts);
    }
}
