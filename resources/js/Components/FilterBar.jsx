import { router } from '@inertiajs/react';
import { useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Filter row for list pages. Selects and dates apply as soon as they change;
 * the search box applies on Enter. Filters owned by the page itself (e.g. a
 * status picked from cards) are passed through `filters` and left untouched.
 *
 * fields: [{ type: 'search' | 'select' | 'date', name, placeholder?, label?, options?: [{ value, label }] }]
 */
export default function FilterBar({ routeName, filters = {}, fields = [] }) {
    const names = fields.map(f => f.name);
    const [values, setValues] = useState(() => Object.fromEntries(names.map(n => [n, filters[n] ?? ''])));

    function apply(next) {
        const params = { ...filters, ...next };
        Object.keys(params).forEach(k => { if (params[k] === '' || params[k] == null) delete params[k]; });
        router.get(route(routeName), params, { preserveState: true, preserveScroll: true, replace: true });
    }

    function change(name, value, applyNow) {
        const next = { ...values, [name]: value };
        setValues(next);
        if (applyNow) apply(next);
    }

    function reset() {
        const cleared = Object.fromEntries(names.map(n => [n, '']));
        setValues(cleared);
        apply(cleared);
    }

    const active = names.some(n => values[n] !== '' || (filters[n] ?? '') !== '');

    return (
        <form onSubmit={e => { e.preventDefault(); apply(values); }} className="card p-3 flex flex-wrap items-end gap-2">
            {fields.map(f => {
                if (f.type === 'search') {
                    return (
                        <div key={f.name} className="relative">
                            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                            <input type="search" className="form-input pl-8 text-sm py-2 w-56" placeholder={f.placeholder ?? 'Search…'}
                                value={values[f.name]} onChange={e => change(f.name, e.target.value, e.target.value === '')} />
                        </div>
                    );
                }
                if (f.type === 'select') {
                    return (
                        <select key={f.name} className="form-input text-sm py-2 w-auto max-w-[14rem]" value={values[f.name]}
                            onChange={e => change(f.name, e.target.value, true)}>
                            <option value="">{f.placeholder ?? 'All'}</option>
                            {(f.options ?? []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    );
                }
                return (
                    <label key={f.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                        {f.label}
                        <input type="date" className="form-input text-sm py-2 w-auto" value={values[f.name]}
                            onChange={e => change(f.name, e.target.value, true)} />
                    </label>
                );
            })}
            <button type="submit" className="btn btn-secondary text-sm">Search</button>
            {active && (
                <button type="button" onClick={reset} className="btn text-sm flex items-center gap-1 text-gray-500">
                    <XMarkIcon className="w-4 h-4" /> Clear
                </button>
            )}
        </form>
    );
}
