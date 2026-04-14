import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { geocodeAddress } from '@/utils/geocoding';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SECTOR_COLORS: Record<string, string> = {
  Technologie: '#6366f1',
  'F&B': '#10b981',
  Conseil: '#f59e0b',
  Industrie: '#ef4444',
  Services: '#3b82f6',
  default: '#8b5cf6',
};

export type MapMember = {
  id: string;
  nom: string;
  entreprise?: string;
  secteur?: string;
  latitude?: number;
  longitude?: number;
  neighborhood?: string;
  district?: string;
  city?: string;
};

function sectorColor(secteur?: string) {
  const s = String(secteur ?? '').trim();
  return (s && SECTOR_COLORS[s]) || SECTOR_COLORS.default;
}

function markerIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.25)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function MembersMap({ members }: { members: MapMember[] }) {
  const [computed, setComputed] = useState<Record<string, { lat: number; lng: number }>>({});
  const [computing, setComputing] = useState(false);
  const canGeocode = Boolean(String((import.meta as any)?.env?.VITE_GOOGLE_MAPS_API_KEY ?? '').trim());

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!canGeocode) return;
      const list = (members ?? []).filter((m) => {
        const hasLat = typeof m.latitude === 'number';
        const hasLng = typeof m.longitude === 'number';
        if (hasLat && hasLng) return false;
        if (computed[m.id]) return false;
        const district = String(m.district ?? '').trim();
        const neighborhood = String(m.neighborhood ?? '').trim();
        const city = String(m.city ?? '').trim();
        return Boolean(district || neighborhood || city);
      });

      if (list.length === 0) return;

      // On ne géocode pas tout d’un coup (quota/latence).
      const LIMIT = 24;
      const slice = list.slice(0, LIMIT);
      setComputing(true);
      try {
        const next: Record<string, { lat: number; lng: number }> = {};
        for (const m of slice) {
          const district = String(m.district ?? '').trim();
          const neighborhood = String(m.neighborhood ?? '').trim();
          const city = String(m.city ?? '').trim() || 'Guadalajara';
          const approx = [neighborhood || district, city].filter(Boolean).join(', ');
          if (!approx) continue;
          const coords = await geocodeAddress(approx, city);
          if (!coords) continue;
          next[m.id] = coords;
          if (cancelled) return;
        }
        if (!cancelled && Object.keys(next).length > 0) {
          setComputed((prev) => ({ ...prev, ...next }));
        }
      } finally {
        if (!cancelled) setComputing(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [members, canGeocode, computed]);

  const withCoords = useMemo(() => {
    return (members ?? [])
      .map((m) => {
        const lat = typeof m.latitude === 'number' ? m.latitude : computed[m.id]?.lat;
        const lng = typeof m.longitude === 'number' ? m.longitude : computed[m.id]?.lng;
        return { ...m, latitude: lat, longitude: lng };
      })
      .filter((m) => typeof m.latitude === 'number' && typeof m.longitude === 'number');
  }, [members, computed]);

  const withoutCount = Math.max(0, (members?.length ?? 0) - withCoords.length);

  const sectors = useMemo(() => {
    const m = new Map<string, string>();
    (members ?? []).forEach((mm) => {
      const s = String(mm.secteur ?? '').trim();
      if (!s) return;
      if (!m.has(s)) m.set(s, sectorColor(s));
    });
    return Array.from(m.entries()).slice(0, 10);
  }, [members]);

  if (withCoords.length === 0) {
    return (
      <div className="relative flex h-[380px] w-full items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
        <div className="text-center">
          <p className="text-sm font-semibold text-stone-700">Localisation par district</p>
          <p className="mt-1 text-xs text-stone-500">
            {canGeocode
              ? computing
                ? 'Géocodage des districts…'
                : 'Aucune coordonnée trouvée (district/quartier manquant).'
              : 'Clé Google Geocoding manquante (VITE_GOOGLE_MAPS_API_KEY).'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="h-[380px] w-full">
        <MapContainer center={[20.6597, -103.3496]} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {withCoords.map((m) => {
            const color = sectorColor(m.secteur);
            return (
              <Marker
                key={m.id}
                position={[m.latitude as number, m.longitude as number]}
                icon={markerIcon(color)}
              >
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold">{m.nom}</p>
                    {m.entreprise ? <p className="text-xs text-stone-600">{m.entreprise}</p> : null}
                    {m.district || m.neighborhood || m.city ? (
                      <p className="text-xs text-stone-500">
                        {String(m.neighborhood ?? m.district ?? '').trim()}
                        {String(m.city ?? '').trim() ? ` • ${String(m.city ?? '').trim()}` : ''}
                      </p>
                    ) : null}
                    {m.secteur ? (
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                        style={{ background: color }}
                      >
                        {m.secteur}
                      </span>
                    ) : null}
                    <div className="pt-2">
                      <Link
                        to={`/membres/${encodeURIComponent(m.id)}`}
                        className="inline-flex items-center justify-center rounded-md bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white"
                      >
                        Voir profil
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {sectors.length > 0 ? (
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg border border-stone-200 bg-white/90 px-3 py-2 text-xs text-stone-700 shadow-sm backdrop-blur">
          <p className="mb-1 font-semibold text-stone-900">Légende</p>
          <div className="space-y-1">
            {sectors.map(([name, color]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                <span className="max-w-[9rem] truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {withoutCount > 0 ? (
        <p className="border-t border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">
          ⚠️ {withoutCount} membres sans coordonnées — complétez leurs profils
        </p>
      ) : null}
    </div>
  );
}

