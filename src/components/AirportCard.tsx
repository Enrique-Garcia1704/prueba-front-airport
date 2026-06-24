import React from 'react';
import type { Airport } from '../types/airport';
import { Circle, ChevronRight, Star } from 'lucide-react';

interface Props {
  airport: Airport;
  onClick: (airport: Airport) => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const AirportCard: React.FC<Props> = ({ airport, onClick, isFavorite, onToggleFavorite }) => {
  const isClosed = airport.is_closed === true;

  return (
    <div 
      className="airport-card glass-panel" 
      onClick={() => onClick(airport)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(airport);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Ver detalles del aeropuerto ${airport.name}`}
    >
      <div className="airport-card-main">
        <div className="airport-card-left">
          <h3 className="airport-name">{airport.name}</h3>
          <p className="airport-subtitle">
            {airport.city ? `${airport.city}, ` : ''}{airport.country_name || airport.country || ''}
          </p>
        </div>

        <div className="airport-card-right">
          <button
            type="button"
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(e);
            }}
            aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <Star size={18} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
          </button>

          <div className="card-badges">
            {airport.iata && <span className="badge badge-primary">{airport.iata}</span>}
            {airport.icao && <span className="badge badge-secondary">{airport.icao}</span>}
          </div>
          <div className={`status-indicator ${isClosed ? 'status-closed' : 'status-open'}`}>
            <Circle size={8} fill="currentColor" aria-hidden="true" />
            <span>{isClosed ? 'Cerrado' : 'Operando'}</span>
          </div>
          <ChevronRight size={18} className="airport-card-arrow" aria-hidden="true" />
        </div>
      </div>

      <div className="airport-card-details">
        <div className="detail-item">
          <span className="detail-label">Región:</span>
          <span className="detail-value" title={airport.region}>
            {airport.region ? airport.region.replace(' (state)', '') : 'N/A'}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Continente:</span>
          <span className="detail-value">{airport.continent || 'N/A'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Latitud:</span>
          <span className="detail-value">{airport.latitude ? airport.latitude.toFixed(4) : 'N/A'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Longitud:</span>
          <span className="detail-value">{airport.longitude ? airport.longitude.toFixed(4) : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default AirportCard;
