import { useState } from 'react';
import {
    Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions,
} from '@headlessui/react';
import { ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Searchable material picker for BOQ rows.
 *
 * Props:
 *   materials  – array of { id, name, unit, default_rate, description, category }
 *   value      – currently selected material id (string) or empty string
 *   onChange   – called with new material id (string) or '' when cleared
 *   disabled   – disable input when true
 *   placeholders – { disabled, empty, active }
 */
export default function MaterialPicker({ materials = [], value, onChange, disabled, placeholders = {} }) {
    const [query, setQuery] = useState('');
    const selected = materials.find(m => m.id === value) || null;

    const filtered = !query
        ? materials
        : materials.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));

    const inputPlaceholder = disabled
        ? (placeholders.disabled || 'Disabled')
        : materials.length === 0
            ? (placeholders.empty || 'No items')
            : (placeholders.active || 'Search…');

    function clear(e) {
        e.preventDefault();
        e.stopPropagation();
        setQuery('');
        onChange('');
    }

    return (
        <Combobox value={selected} onChange={(mat) => onChange(mat?.id || '')} disabled={disabled}>
            <div className="relative">
                <ComboboxInput
                    className="form-input text-xs w-full pr-12"
                    displayValue={(m) => m?.name || ''}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={inputPlaceholder}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-1 gap-0.5">
                    {selected && !disabled && (
                        <button
                            type="button"
                            onClick={clear}
                            className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                            title="Clear"
                        >
                            <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <ComboboxButton className="p-0.5 rounded hover:bg-gray-100 text-gray-400">
                        <ChevronUpDownIcon className="h-3.5 w-3.5" />
                    </ComboboxButton>
                </div>

                <ComboboxOptions
                    anchor={{ to: 'bottom start', gap: 4 }}
                    className="z-50 max-h-60 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black/10 focus:outline-none"
                    style={{ width: 'var(--input-width)', minWidth: '14rem' }}
                >
                    {filtered.length === 0 ? (
                        <div className="px-3 py-2 text-gray-400 italic">
                            {query ? `No matches for "${query}"` : 'No items'}
                        </div>
                    ) : (
                        filtered.map((m) => (
                            <ComboboxOption
                                key={m.id}
                                value={m}
                                className={({ focus }) =>
                                    `cursor-pointer select-none px-3 py-1.5 ${focus ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}`
                                }
                            >
                                {({ selected: isSel }) => (
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`truncate ${isSel ? 'font-semibold' : ''}`}>{m.name}</span>
                                        {m.unit && <span className="text-[10px] text-gray-400 flex-shrink-0">{m.unit}</span>}
                                    </div>
                                )}
                            </ComboboxOption>
                        ))
                    )}
                </ComboboxOptions>
            </div>
        </Combobox>
    );
}
