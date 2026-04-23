import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';

// All Tailwind color palettes as RGB triplets
const PALETTES = {
    indigo: {
        50: '238 242 255', 100: '224 231 255', 200: '199 210 254', 300: '165 180 252',
        400: '129 140 248', 500: '99 102 241',  600: '79 70 229',   700: '67 56 202',
        800: '55 48 163',   900: '49 46 129',
    },
    blue: {
        50: '239 246 255', 100: '219 234 254', 200: '191 219 254', 300: '147 197 253',
        400: '96 165 250',  500: '59 130 246',  600: '37 99 235',   700: '29 78 216',
        800: '30 64 175',   900: '30 58 138',
    },
    sky: {
        50: '240 249 255', 100: '224 242 254', 200: '186 230 253', 300: '125 211 252',
        400: '56 189 248',  500: '14 165 233',  600: '2 132 199',   700: '3 105 161',
        800: '7 89 133',    900: '12 74 110',
    },
    violet: {
        50: '245 243 255', 100: '237 233 254', 200: '221 214 254', 300: '196 181 253',
        400: '167 139 250', 500: '139 92 246',  600: '124 58 237',  700: '109 40 217',
        800: '91 33 182',   900: '76 29 149',
    },
    purple: {
        50: '250 245 255', 100: '243 232 255', 200: '233 213 255', 300: '216 180 254',
        400: '192 132 252', 500: '168 85 247',  600: '147 51 234',  700: '126 34 206',
        800: '107 33 168',  900: '88 28 135',
    },
    fuchsia: {
        50: '253 244 255', 100: '250 232 255', 200: '245 208 254', 300: '240 171 252',
        400: '232 121 249', 500: '217 70 239',  600: '192 38 211',  700: '162 28 175',
        800: '134 25 143',  900: '112 26 117',
    },
    pink: {
        50: '253 242 248', 100: '252 231 243', 200: '251 207 232', 300: '249 168 212',
        400: '244 114 182', 500: '236 72 153',  600: '219 39 119',  700: '190 24 93',
        800: '157 23 77',   900: '131 24 67',
    },
    rose: {
        50: '255 241 242', 100: '255 228 230', 200: '254 205 211', 300: '253 164 175',
        400: '251 113 133', 500: '244 63 94',   600: '225 29 72',   700: '190 18 60',
        800: '159 18 57',   900: '136 19 55',
    },
    red: {
        50: '254 242 242', 100: '254 226 226', 200: '254 202 202', 300: '252 165 165',
        400: '248 113 113', 500: '239 68 68',   600: '220 38 38',   700: '185 28 28',
        800: '153 27 27',   900: '127 29 29',
    },
    orange: {
        50: '255 247 237', 100: '255 237 213', 200: '254 215 170', 300: '253 186 116',
        400: '251 146 60',  500: '249 115 22',  600: '234 88 12',   700: '194 65 12',
        800: '154 52 18',   900: '124 45 18',
    },
    amber: {
        50: '255 251 235', 100: '254 243 199', 200: '253 230 138', 300: '252 211 77',
        400: '251 191 36',  500: '245 158 11',  600: '217 119 6',   700: '180 83 9',
        800: '146 64 14',   900: '120 53 15',
    },
    yellow: {
        50: '254 252 232', 100: '254 249 195', 200: '254 240 138', 300: '253 224 71',
        400: '250 204 21',  500: '234 179 8',   600: '202 138 4',   700: '161 98 7',
        800: '133 77 14',   900: '113 63 18',
    },
    lime: {
        50: '247 254 231', 100: '236 252 203', 200: '217 249 157', 300: '190 242 100',
        400: '163 230 53',  500: '132 204 22',  600: '101 163 13',  700: '77 124 15',
        800: '63 98 18',    900: '54 83 20',
    },
    green: {
        50: '240 253 244', 100: '220 252 231', 200: '187 247 208', 300: '134 239 172',
        400: '74 222 128',  500: '34 197 94',   600: '22 163 74',   700: '21 128 61',
        800: '22 101 52',   900: '20 83 45',
    },
    emerald: {
        50: '236 253 245', 100: '209 250 229', 200: '167 243 208', 300: '110 231 183',
        400: '52 211 153',  500: '16 185 129',  600: '5 150 105',   700: '4 120 87',
        800: '6 95 70',     900: '6 78 59',
    },
    teal: {
        50: '240 253 250', 100: '204 251 241', 200: '153 246 228', 300: '94 234 212',
        400: '45 212 191',  500: '20 184 166',  600: '13 148 136',  700: '15 118 110',
        800: '17 94 89',    900: '19 78 74',
    },
    cyan: {
        50: '236 254 255', 100: '207 250 254', 200: '165 243 252', 300: '103 232 249',
        400: '34 211 238',  500: '6 182 212',   600: '8 145 178',   700: '14 116 144',
        800: '21 94 117',   900: '22 78 99',
    },
    slate: {
        50: '248 250 252', 100: '241 245 249', 200: '226 232 240', 300: '203 213 225',
        400: '148 163 184', 500: '100 116 139', 600: '71 85 105',   700: '51 65 85',
        800: '30 41 59',    900: '15 23 42',
    },
    zinc: {
        50: '250 250 250', 100: '244 244 245', 200: '228 228 231', 300: '212 212 216',
        400: '161 161 170', 500: '113 113 122', 600: '82 82 91',    700: '63 63 70',
        800: '39 39 42',    900: '24 24 27',
    },
};

// Sidebar background presets
const SIDEBAR_PRESETS = {
    slate_dark:   { label: 'Dark Slate',    from: '15 23 42',   via: '15 23 42',   to: '2 6 23',     preview: '#0f172a' },
    zinc_dark:    { label: 'Dark Zinc',     from: '24 24 27',   via: '24 24 27',   to: '9 9 11',     preview: '#18181b' },
    gray_dark:    { label: 'Dark Gray',     from: '31 41 55',   via: '31 41 55',   to: '17 24 39',   preview: '#1f2937' },
    neutral_dark: { label: 'Charcoal',      from: '38 38 38',   via: '38 38 38',   to: '23 23 23',   preview: '#262626' },
    stone_dark:   { label: 'Dark Stone',    from: '41 37 36',   via: '41 37 36',   to: '28 25 23',   preview: '#292524' },
    indigo_dark:  { label: 'Deep Indigo',   from: '30 27 75',   via: '30 27 75',   to: '15 13 50',   preview: '#1e1b4b' },
    violet_dark:  { label: 'Deep Violet',   from: '46 16 101',  via: '46 16 101',  to: '20 7 45',    preview: '#2e1065' },
    blue_dark:    { label: 'Deep Blue',     from: '23 37 84',   via: '23 37 84',   to: '10 15 40',   preview: '#172554' },
    emerald_dark: { label: 'Deep Emerald',  from: '6 78 59',    via: '6 78 59',    to: '2 40 30',    preview: '#064e3b' },
    rose_dark:    { label: 'Deep Rose',     from: '76 5 25',    via: '76 5 25',    to: '40 3 13',    preview: '#4c0519' },
    cyan_dark:    { label: 'Deep Cyan',     from: '22 78 99',   via: '22 78 99',   to: '8 40 55',    preview: '#164e63' },
    white:        { label: 'Light',         from: '255 255 255', via: '249 250 251', to: '243 244 246', preview: '#ffffff', light: true },
};

export function useThemeColor() {
    const { appSettings } = usePage().props;
    const color   = appSettings?.theme_color   || 'indigo';
    const sidebar = appSettings?.sidebar_color || 'slate_dark';

    useEffect(() => {
        const palette = PALETTES[color] ?? PALETTES.indigo;
        const root = document.documentElement;

        // Primary palette
        Object.entries(palette).forEach(([shade, rgb]) => {
            root.style.setProperty(`--primary-${shade}`, rgb);
        });

        // Sidebar colors
        const sb = SIDEBAR_PRESETS[sidebar] ?? SIDEBAR_PRESETS.slate_dark;
        root.style.setProperty('--sidebar-from', sb.from);
        root.style.setProperty('--sidebar-via',  sb.via);
        root.style.setProperty('--sidebar-to',   sb.to);
        root.style.setProperty('--sidebar-light', sb.light ? '1' : '0');
    }, [color, sidebar]);

    return { color, sidebar };
}

export { PALETTES, SIDEBAR_PRESETS };

export const THEME_OPTIONS = Object.keys(PALETTES);
export const THEME_LABELS = {
    indigo: 'Indigo', blue: 'Blue', sky: 'Sky', violet: 'Violet', purple: 'Purple',
    fuchsia: 'Fuchsia', pink: 'Pink', rose: 'Rose', red: 'Red', orange: 'Orange',
    amber: 'Amber', yellow: 'Yellow', lime: 'Lime', green: 'Green', emerald: 'Emerald',
    teal: 'Teal', cyan: 'Cyan', slate: 'Slate', zinc: 'Zinc',
};
export const THEME_PREVIEW = {
    indigo: '#6366f1', blue: '#3b82f6', sky: '#0ea5e9', violet: '#8b5cf6', purple: '#a855f7',
    fuchsia: '#d946ef', pink: '#ec4899', rose: '#f43f5e', red: '#ef4444', orange: '#f97316',
    amber: '#f59e0b', yellow: '#eab308', lime: '#84cc16', green: '#22c55e', emerald: '#10b981',
    teal: '#14b8a6', cyan: '#06b6d4', slate: '#64748b', zinc: '#71717a',
};

export const SIDEBAR_OPTIONS = Object.keys(SIDEBAR_PRESETS);
export const SIDEBAR_LABELS = Object.fromEntries(
    Object.entries(SIDEBAR_PRESETS).map(([k, v]) => [k, v.label])
);
export const SIDEBAR_PREVIEW = Object.fromEntries(
    Object.entries(SIDEBAR_PRESETS).map(([k, v]) => [k, v.preview])
);
export const SIDEBAR_IS_LIGHT = Object.fromEntries(
    Object.entries(SIDEBAR_PRESETS).map(([k, v]) => [k, !!v.light])
);
