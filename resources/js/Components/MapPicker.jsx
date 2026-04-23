import { useCallback, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { MagnifyingGlassIcon, MapPinIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Dhaka fallback center
const DHAKA = { lat: 23.8103, lng: 90.4125 };
const LIBRARIES = ['places'];

export default function MapPicker({
    value,           // { lat, lng } | null
    onChange,        // ({ lat, lng }) => void
    readOnly = false,
    height = 300,
    address = '',
}) {
    const { integrations } = usePage().props;
    const apiKey = integrations?.google_maps_key;

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey || '',
        libraries: LIBRARIES,
        language: 'en',
        region: 'BD',
    });

    const lat = parseFloat(value?.lat);
    const lng = parseFloat(value?.lng);
    const hasPin = Number.isFinite(lat) && Number.isFinite(lng);
    const pinPos = hasPin ? { lat, lng } : null;
    const center = pinPos ?? DHAKA;

    const mapRef = useRef(null);
    const autocompleteRef = useRef(null);

    const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);
    const onAutocompleteLoad = useCallback((ac) => { autocompleteRef.current = ac; }, []);

    // Pan/zoom when pin changes externally
    useEffect(() => {
        if (mapRef.current && hasPin) {
            mapRef.current.panTo(pinPos);
            if ((mapRef.current.getZoom() ?? 12) < 15) mapRef.current.setZoom(16);
        }
    }, [lat, lng, hasPin]);

    function onMapClick(e) {
        if (readOnly) return;
        onChange?.({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }

    function onPlaceSelected() {
        const place = autocompleteRef.current?.getPlace();
        const loc = place?.geometry?.location;
        if (!loc) return;
        onChange?.({ lat: loc.lat(), lng: loc.lng() });
    }

    function clearPin() {
        onChange?.({ lat: null, lng: null });
    }

    function onMarkerDragEnd(e) {
        onChange?.({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }

    // No API key configured — helpful message instead of silent failure
    if (!apiKey) {
        return (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800">
                        <p className="font-semibold mb-1">Google Maps is not configured</p>
                        <p className="mb-2">
                            Add <code className="bg-amber-100 px-1 rounded">GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> file.
                            Get a key from <a className="underline" target="_blank" rel="noopener" href="https://console.cloud.google.com/apis/credentials">Google Cloud Console</a> and enable <strong>Maps JavaScript API</strong>, <strong>Places API</strong>, <strong>Geocoding API</strong>.
                        </p>
                        {hasPin && (
                            <p className="text-amber-700">
                                Saved location: <strong>{lat.toFixed(6)}, {lng.toFixed(6)}</strong> ·{' '}
                                <a className="underline" target="_blank" rel="noopener" href={`https://www.google.com/maps?q=${lat},${lng}`}>Open in Google Maps</a>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-xs text-red-700">
                Failed to load Google Maps. Verify the API key, billing, and that Maps JavaScript API is enabled.
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="border border-gray-200 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center text-xs text-gray-400"
                style={{ height: `${height}px` }}>
                Loading map…
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {!readOnly && (
                <div className="relative">
                    <Autocomplete
                        onLoad={onAutocompleteLoad}
                        onPlaceChanged={onPlaceSelected}
                        options={{
                            componentRestrictions: { country: 'bd' },
                            fields: ['geometry', 'formatted_address', 'name'],
                        }}
                    >
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                defaultValue={address}
                                placeholder="Search a place in Bangladesh (or click the map)"
                                className="form-input pl-9 text-sm w-full"
                            />
                        </div>
                    </Autocomplete>
                </div>
            )}

            <div className="relative rounded-lg overflow-hidden border border-gray-200" style={{ height: `${height}px` }}>
                <GoogleMap
                    mapContainerStyle={{ height: '100%', width: '100%' }}
                    center={center}
                    zoom={hasPin ? 16 : 12}
                    onLoad={onMapLoad}
                    onClick={onMapClick}
                    options={{
                        streetViewControl: !readOnly,
                        mapTypeControl: !readOnly,
                        fullscreenControl: !readOnly,
                        zoomControl: true,
                        gestureHandling: readOnly ? 'cooperative' : 'auto',
                    }}
                >
                    {pinPos && (
                        <Marker
                            position={pinPos}
                            draggable={!readOnly}
                            onDragEnd={onMarkerDragEnd}
                        />
                    )}
                </GoogleMap>

                {hasPin && !readOnly && (
                    <button type="button" onClick={clearPin}
                        className="absolute top-2 right-12 z-[10] bg-white/95 px-2 py-1 rounded-md text-xs border border-gray-200 shadow hover:bg-white flex items-center gap-1">
                        <XMarkIcon className="w-3 h-3" /> Clear pin
                    </button>
                )}
            </div>

            {hasPin ? (
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <MapPinIcon className="w-3.5 h-3.5 text-primary-500" />
                    <span>
                        <strong className="text-gray-700">{lat.toFixed(6)}, {lng.toFixed(6)}</strong>
                        {!readOnly && <> — drag marker or click elsewhere to move</>}
                    </span>
                </div>
            ) : !readOnly && (
                <p className="text-[11px] text-gray-400">
                    Search above, or click anywhere on the map to drop a pin.
                </p>
            )}
        </div>
    );
}
