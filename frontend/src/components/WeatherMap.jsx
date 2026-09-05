import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { INDIA_CENTER, INDIA_ZOOM, CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/constants';
import StatusBadge from './StatusBadge';
import { formatDistanceToNow } from 'date-fns';

// Fix Leaflet default icon path issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Create category-specific colored marker
function createMarkerIcon(category, status) {
  const color = CATEGORY_COLORS[category] || '#6b7280';
  const icon = CATEGORY_ICONS[category] || '🔆';

  // Status-based border color
  const borderColor =
    status === 'VERIFIED' ? '#10b981' :
    status === 'FLAGGED'  ? '#f97316' :
    status === 'SPAM'     ? '#ef4444' :
    '#f59e0b'; // PENDING

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.059 27.941 0 18 0z"
            fill="${color}" stroke="${borderColor}" stroke-width="2.5" filter="url(#shadow)"/>
      <circle cx="18" cy="18" r="11" fill="rgba(255,255,255,0.15)"/>
      <text x="18" y="23" text-anchor="middle" font-size="13">${icon}</text>
    </svg>
  `;

  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
}

// Temperature label marker for cities
function createTempMarker(temp, condition) {
  const html = `
    <div style="
      background: rgba(15,32,64,0.92);
      border: 1px solid rgba(14,165,233,0.4);
      border-radius: 8px;
      padding: 4px 8px;
      color: white;
      font-family: Inter, sans-serif;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      white-space: nowrap;
    ">
      <div style="color: #38bdf8; font-size: 13px;">${Math.round(temp)}°C</div>
      <div style="color: #94a3b8; font-weight: 400; font-size: 10px;">${condition || ''}</div>
    </div>
  `;
  return L.divIcon({ className: '', html, iconSize: [70, 40], iconAnchor: [35, 20] });
}

// Cluster support via MarkerClusterGroup
function ClusteredMarkers({ reports }) {
  const map = useMap();
  const groupRef = useRef(null);

  useEffect(() => {
    // Dynamic import for MarkerClusterGroup
    import('leaflet.markercluster').then(() => {
      if (groupRef.current) {
        map.removeLayer(groupRef.current);
      }

      const group = L.markerClusterGroup({
        maxClusterRadius: 60,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
      });

      reports.forEach(report => {
        if (!report.latitude || !report.longitude) return;

        const icon = createMarkerIcon(report.event_category, report.status);
        const marker = L.marker([report.latitude, report.longitude], { icon });

        const timeAgo = (() => {
          try { return formatDistanceToNow(new Date(report.created_at), { addSuffix: true }); }
          catch { return 'recently'; }
        })();

        const popupContent = `
          <div style="min-width: 200px; font-family: Inter, sans-serif;">
            <div style="font-weight: 700; color: #e2e8f0; margin-bottom: 6px; font-size: 14px;">
              ${CATEGORY_ICONS[report.event_category] || '🔆'} ${report.event_category || 'Weather Event'}
            </div>
            <div style="color: #94a3b8; font-size: 12px; margin-bottom: 6px;">
              📍 ${report.city || ''} ${report.state ? ', ' + report.state : ''}
            </div>
            <div style="color: #cbd5e1; font-size: 12px; line-height: 1.5; margin-bottom: 8px;">
              ${(report.description || '').slice(0, 150)}${report.description?.length > 150 ? '...' : ''}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; color: #64748b;">${timeAgo}</span>
              <span style="font-size: 11px; color: #0ea5e9; font-weight: 600;">${report.source?.toUpperCase() || 'CITIZEN'}</span>
            </div>
            ${report.confidence_score ? `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #334155;">
                <div style="font-size: 11px; color: #94a3b8;">
                  Confidence: <strong style="color: ${report.confidence_score >= 80 ? '#10b981' : report.confidence_score >= 60 ? '#f59e0b' : '#ef4444'}">
                    ${Math.round(report.confidence_score)}/100
                  </strong>
                </div>
              </div>
            ` : ''}
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 280 });
        group.addLayer(marker);
      });

      map.addLayer(group);
      groupRef.current = group;
    }).catch(err => {
      console.warn('MarkerCluster not available, using plain markers:', err);
      reports.forEach(report => {
        if (!report.latitude || !report.longitude) return;
        const icon = createMarkerIcon(report.event_category, report.status);
        L.marker([report.latitude, report.longitude], { icon }).addTo(map);
      });
    });

    return () => {
      if (groupRef.current) {
        map.removeLayer(groupRef.current);
      }
    };
  }, [reports, map]);

  return null;
}

function CityTemperatureMarkers({ cities }) {
  return cities
    .filter(c => c.temperature != null)
    .map(city => (
      <Marker
        key={city.city}
        position={[city.latitude, city.longitude]}
        icon={createTempMarker(city.temperature, city.weather_condition)}
        zIndexOffset={-100}
      >
        <Popup>
          <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '160px' }}>
            <strong style={{ color: '#e2e8f0', fontSize: '14px' }}>{city.city}</strong>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>{city.state}</div>
            <div style={{ color: '#38bdf8', fontSize: '18px', fontWeight: '800', margin: '6px 0' }}>
              {Math.round(city.temperature)}°C
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '12px' }}>
              💧 Humidity: {city.humidity}%<br />
              💨 Wind: {city.wind_speed} km/h<br />
              🌦️ {city.weather_condition}
            </div>
          </div>
        </Popup>
      </Marker>
    ));
}


/**
 * WeatherMap — India-focused Leaflet map with report markers and city weather.
 */
export default function WeatherMap({
  reports = [],
  cities = [],
  height = '500px',
  showCities = true,
  showReports = true,
  className = '',
}) {
  return (
    <div className={`rounded-xl overflow-hidden border border-slate-700 ${className}`} style={{ height }}>
      <MapContainer
        center={INDIA_CENTER}
        zoom={INDIA_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={18}
        />

        {/* City temperature labels */}
        {showCities && <CityTemperatureMarkers cities={cities} />}

        {/* Report markers with clustering */}
        {showReports && reports.length > 0 && (
          <ClusteredMarkers reports={reports} />
        )}
      </MapContainer>
    </div>
  );
}
