import React, { useEffect } from 'react';
import type { Airport, Runway } from '../types/airport';
import { 
  X, 
  ExternalLink, 
  Map as MapIcon, 
  BookOpen, 
  Circle, 
  Globe, 
  MapPin, 
  Compass, 
  Mountain, 
  Navigation, 
  Users,
  Star
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icons in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Props {
  airport: Airport;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const AirportModal: React.FC<Props> = ({ airport, onClose, isFavorite, onToggleFavorite }) => {
  // Prevent scrolling on body when modal is open and handle Escape key
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const formatPassengers = (num?: number) => {
    if (!num) return 'N/A';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return new Intl.NumberFormat('es-MX').format(num);
  };

  const formatType = (type?: string, size?: string) => {
    const rawValue = type || size;
    if (!rawValue) return null;
    return rawValue
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  const formatElevation = (m?: number, ft?: number) => {
    if (m !== undefined && m !== null) return `${Math.round(m)} m`;
    if (ft !== undefined && ft !== null) return `${Math.round(ft * 0.3048)} m`;
    return 'N/A';
  };

  const isClosed = airport.is_closed === true;

  const renderRunways = () => {
    if (!airport.runways || airport.runways.length === 0) return null;
    return (
      <div className="modal-runways-section">
        <h4 className="modal-section-title">Pistas ({airport.runways.length})</h4>
        <div className="modal-runways-list">
          {airport.runways.map((runway: Runway, idx: number) => (
            <div key={idx} className="modal-runway-item">
              <div className={`modal-runway-visual ${runway.has_lights ? 'has-lights' : ''}`}></div>
              <div className="modal-runway-info">
                <span className="runway-ident font-mono">{runway.le_ident}/{runway.he_ident}</span>
                <span className="runway-separator">|</span>
                <span className="runway-surface">{runway.surface}</span>
                <span className="runway-separator">|</span>
                <span className="runway-length">{runway.length} ft</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-container" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div className="modal-header-top">
            <h2 id="modal-title" className="modal-title">{airport.name}</h2>
            <div className="modal-header-actions">
              <button 
                type="button"
                className={`modal-favorite-btn-inline ${isFavorite ? 'active' : ''}`} 
                onClick={onToggleFavorite}
                title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                <Star size={20} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
              </button>

              <button className="modal-close-btn-inline" onClick={onClose} aria-label="Cerrar modal">
                <X size={24} aria-hidden="true" />
              </button>
            </div>
          </div>
          {airport.city && (
            <p className="modal-subtitle">
              <MapPin size={16} /> {airport.city}
            </p>
          )}
          
          <div className="modal-badges">
             {airport.iata && <span className="badge badge-primary">{airport.iata}</span>}
             {airport.icao && <span className="badge badge-secondary">{airport.icao}</span>}
          </div>
          
          <div className="modal-status-row">
            <div className={`status-pill ${isClosed ? 'closed' : 'open'}`}>
              <Circle size={8} fill="currentColor" aria-hidden="true" />
              <span>{isClosed ? 'Cerrado' : 'Operando'}</span>
            </div>
            {(airport.type || airport.size) && (
              <span className="type-pill">{formatType(airport.type, airport.size)}</span>
            )}
          </div>
        </div>

        <div className="modal-content">
          <div className="modal-body-split">
            {/* Left Column: Data & Runways */}
            <div className="modal-split-left">
              <div className="modal-info-grid">
                <div className="info-card">
                  <Globe className="info-card-icon" size={18} aria-hidden="true" />
                  <span className="info-label">País</span>
                  <span className="info-value">{airport.country_name}</span>
                </div>
                
                <div className="info-card">
                  <MapPin className="info-card-icon" size={18} aria-hidden="true" />
                  <span className="info-label">Región</span>
                  <span className="info-value">{airport.region?.replace(' (state)', '') || 'N/A'}</span>
                </div>
                
                <div className="info-card">
                  <Compass className="info-card-icon" size={18} aria-hidden="true" />
                  <span className="info-label">Continente</span>
                  <span className="info-value">{airport.continent || 'N/A'}</span>
                </div>
                
                <div className="info-card">
                  <Mountain className="info-card-icon" size={18} aria-hidden="true" />
                  <span className="info-label">Elevación</span>
                  <span className="info-value">{formatElevation(airport.elevation_m, airport.elevation_ft)}</span>
                </div>
                
                <div className="info-card">
                  <Navigation className="info-card-icon" size={18} aria-hidden="true" />
                  <span className="info-label">Coordenadas</span>
                  <span className="info-value" style={{ fontSize: '0.85rem' }}>
                    {airport.latitude.toFixed(4)}, {airport.longitude.toFixed(4)}
                  </span>
                </div>
                
                <div className="info-card passenger-card">
                  <Users className="info-card-icon" size={18} aria-hidden="true" />
                  <span className="info-label">Pasajeros</span>
                  <span className="info-value text-accent">{formatPassengers(airport.estimated_annual_passengers)}</span>
                </div>
              </div>
              
              {renderRunways()}
            </div>

            {/* Right Column: Map */}
            <div className="modal-split-right">
              <div className="modal-map-section">
                <h4 className="modal-section-title map-title">Ubicación Geográfica</h4>
                <div className="map-wrapper">
                  <MapContainer 
                    center={[airport.latitude, airport.longitude]} 
                    zoom={13} 
                    scrollWheelZoom={false}
                    className="modal-map-container"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater center={[airport.latitude, airport.longitude]} />
                    <Marker position={[airport.latitude, airport.longitude]}>
                      <Popup>{airport.name}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${airport.latitude},${airport.longitude}`} 
            target="_blank" 
            rel="noreferrer"
            className="btn btn-secondary action-btn"
          >
            <MapIcon size={18} aria-hidden="true" /> Ver en Mapa
          </a>
          
          {airport.wikipedia_link && (
            <a 
              href={airport.wikipedia_link} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-secondary action-btn"
            >
              <BookOpen size={18} aria-hidden="true" /> Wikipedia
            </a>
          )}
          
          {airport.home_link && (
            <a 
              href={airport.home_link} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-primary action-btn"
            >
              <ExternalLink size={18} aria-hidden="true" /> Sitio Web
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default AirportModal;
