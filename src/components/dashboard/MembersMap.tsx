import React, { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';

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
  const withCoords = useMemo(
    () =>
      (members ?? []).filter(
        (m) => typeof m.latitude === 'number' && typeof m.longitude === 'number'
      ),
    [members]
  );
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
          <p className="text-sm font-semibold text-stone-700">Ajoutez la localisation à vos profils membres</p>
          <p className="mt-1 text-xs text-stone-500">Latitude / longitude manquants pour l’instant.</p>
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

