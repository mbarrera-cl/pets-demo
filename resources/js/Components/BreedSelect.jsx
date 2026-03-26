import { useState, useRef, useEffect } from 'react';

function ChevronIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );
}

export default function BreedSelect({ type, value, onChange, disabled, hasError, t, breeds = [] }) {
    const [open, setOpen]   = useState(false);
    const [query, setQuery] = useState('');
    const containerRef      = useRef(null);
    const searchRef         = useRef(null);

    const noType      = !type;
    const typeBreeds  = type ? breeds.filter((b) => b.type === type).map((b) => b.name) : [];
    const filtered    = query
        ? typeBreeds.filter((b) => b.toLowerCase().includes(query.toLowerCase()))
        : typeBreeds;

    // Close on outside click
    useEffect(() => {
        function handler(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                setQuery('');
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (open && searchRef.current) {
            searchRef.current.focus();
        }
    }, [open]);

    function handleToggle() {
        if (disabled || noType) return;
        setOpen((prev) => !prev);
        if (open) setQuery('');
    }

    function handleSelect(breed) {
        onChange(breed);
        setOpen(false);
        setQuery('');
    }

    function handleClear(e) {
        e.stopPropagation();
        onChange('');
        setOpen(false);
        setQuery('');
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            setOpen(false);
            setQuery('');
        }
    }

    const placeholder = noType
        ? t('pets.create.breed_select_type_first')
        : t('pets.create.breed_placeholder');

    const isDisabled = disabled || noType;

    return (
        <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
            {/* Trigger */}
            <button
                type="button"
                disabled={isDisabled}
                onClick={handleToggle}
                className={`w-full flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm text-left transition
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                    ${hasError
                        ? 'border-red-400 bg-red-50'
                        : open
                        ? 'border-indigo-400 ring-2 ring-indigo-500/20'
                        : 'border-gray-300 hover:border-gray-400'
                    }
                    ${isDisabled ? 'text-gray-400' : value ? 'text-gray-900' : 'text-gray-400'}
                `}
            >
                <span className="truncate">{value || placeholder}</span>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    {value && !disabled && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={handleClear}
                            onKeyDown={(e) => e.key === 'Enter' && handleClear(e)}
                            className="text-gray-400 hover:text-gray-600 transition text-xs px-1 rounded"
                        >
                            ✕
                        </span>
                    )}
                    <ChevronIcon className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-gray-100">
                        <input
                            ref={searchRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('pets.create.breed_search')}
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                        />
                    </div>

                    {/* Options */}
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-gray-400 text-center">
                                {t('pets.create.breed_no_results')}
                            </p>
                        ) : (
                            filtered.map((breed) => (
                                <button
                                    key={breed}
                                    type="button"
                                    onClick={() => handleSelect(breed)}
                                    className={`w-full text-left px-4 py-2 text-sm transition ${
                                        value === breed
                                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                                            : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
                                    }`}
                                >
                                    {breed}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
