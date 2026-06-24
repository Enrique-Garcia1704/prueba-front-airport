import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Star, ListFilter, Sparkles, Plane, History, Trash2, BarChart3 } from 'lucide-react';

// Import Data and Components
import countryData from '../../data/country.json';
import continentData from '../../data/continent.json';
import iataData from '../../data/iata.json';
import icaoData from '../../data/icao.json';
import { countriesList, majorAirportsList } from '../../data/allCountries';

import type { Airport } from '../../types/airport';
import AirportCard from '../../components/AirportCard';
import SearchBar from '../../components/SearchBar';
import AirportModal from '../../components/AirportModal';
import StatsDashboard from '../../components/StatsDashboard';
import heroImage from '../../assets/imagesavion.jpg';

const MapExplorer: React.FC = () => {
  // Combine all local data sources for initial rendering and Region fallback
  const allAirports = useMemo(() => {
    const rawList = [
      ...(countryData as Airport[]),
      ...(continentData as Airport[]),
      ...(iataData as Airport[]),
      ...(icaoData as Airport[]),
      ...(majorAirportsList as unknown as Airport[])
    ];
    
    const uniqueMap = new Map<string, Airport>();
    rawList.forEach(a => {
      if (a && a.icao && !uniqueMap.has(a.icao)) {
        uniqueMap.set(a.icao, a);
      }
    });
    
    return Array.from(uniqueMap.values());
  }, []);

  // Initialize search as completely empty on load
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('IATA');
  const [hasSearched, setHasSearched] = useState(false);
  const lastFetchedRef = useRef<{ query: string; type: string }>({ query: '', type: '' });

  interface SearchHistoryItem {
    type: string;
    value: string;
  }

  const [history, setHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('search_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  const [favorites, setFavorites] = useState<Airport[]>(() => {
    try {
      const saved = localStorage.getItem('favorite_airports');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  const toggleFavorite = (airport: Airport) => {
    setFavorites(prev => {
      const isFav = prev.some(a => a.icao === airport.icao);
      let updated;
      if (isFav) {
        updated = prev.filter(a => a.icao !== airport.icao);
      } else {
        updated = [...prev, airport];
      }
      localStorage.setItem('favorite_airports', JSON.stringify(updated));
      return updated;
    });
  };

  const addToHistory = (type: string, value: string) => {
    const trimmedVal = value.trim();
    if (!trimmedVal) return;
    const lowerType = type.toLowerCase();
    
    setHistory(prev => {
      const filtered = prev.filter(item => !(item.type === lowerType && item.value.toLowerCase() === trimmedVal.toLowerCase()));
      const updated = [{ type: lowerType, value: trimmedVal }, ...filtered].slice(0, 10);
      localStorage.setItem('search_history', JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('search_history');
  };

  const handleHistoryClick = (item: SearchHistoryItem) => {
    const typeUpper = item.type.toUpperCase();
    setSearchType(typeUpper);
    setSearchQuery(item.value);
    setHasSearched(true);
    fetchAirports(item.value, typeUpper);
  };

  const [filteredAirports, setFilteredAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState<'connection' | 'api' | 'empty' | null>(null);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Local Filters State
  const [localFilterCountry, setLocalFilterCountry] = useState<string>('');
  const [localFilterRegion, setLocalFilterRegion] = useState<string>('');
  const [localFilterContinent, setLocalFilterContinent] = useState<string>('');

  // Sort State
  const [sortField, setSortField] = useState<'name' | 'iata' | 'country_name' | 'region' | 'continent' | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Extract unique options for local filters based on current API results
  const uniqueCountries = useMemo(() => {
    return Array.from(new Set(filteredAirports.map(a => a.country_name).filter(Boolean))).sort();
  }, [filteredAirports]);

  const uniqueRegions = useMemo(() => {
    return Array.from(new Set(filteredAirports.map(a => {
      if (!a.region) return '';
      return a.region.replace(' (state)', '');
    }).filter(Boolean))).sort();
  }, [filteredAirports]);

  const uniqueContinents = useMemo(() => {
    return Array.from(new Set(filteredAirports.map(a => a.continent).filter(Boolean))).sort();
  }, [filteredAirports]);

  // Apply local filters and sorting to current API results
  const displayedAirports = useMemo(() => {
    const filtered = filteredAirports.filter(airport => {
      const matchCountry = !localFilterCountry || airport.country_name === localFilterCountry;
      const matchRegion = !localFilterRegion || (airport.region && airport.region.replace(' (state)', '') === localFilterRegion);
      const matchContinent = !localFilterContinent || airport.continent === localFilterContinent;
      return matchCountry && matchRegion && matchContinent;
    });

    if (!sortField) return filtered;

    return [...filtered].sort((a, b) => {
      let valA = a[sortField as keyof Airport] || '';
      let valB = b[sortField as keyof Airport] || '';
      
      // Clean up string values for reliable sorting
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAirports, localFilterCountry, localFilterRegion, localFilterContinent, sortField, sortOrder]);

  // Compute unique suggestions for the active search criteria (tabs)
  const searchOptions = useMemo(() => {
    switch (searchType) {
      case 'CONTINENT':
        return ['AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA'];
      case 'COUNTRY':
        return countriesList.map(c => c.name).sort((a, b) => a.localeCompare(b));
      case 'IATA': {
        const optionsSet = new Set<string>();
        allAirports.forEach(airport => {
          if (airport.iata) {
            optionsSet.add(`${airport.iata.toUpperCase()} - ${airport.name} (${airport.city})`);
          }
        });
        return Array.from(optionsSet).sort();
      }
      case 'ICAO': {
        const optionsSet = new Set<string>();
        allAirports.forEach(airport => {
          if (airport.icao) {
            optionsSet.add(`${airport.icao.toUpperCase()} - ${airport.name} (${airport.city})`);
          }
        });
        return Array.from(optionsSet).sort();
      }
      case 'REGION': {
        const optionsSet = new Set<string>();
        allAirports.forEach(airport => {
          if (airport.region) {
            const cleanRegion = airport.region.replace(' (state)', '');
            optionsSet.add(cleanRegion);
          }
        });
        return Array.from(optionsSet).sort();
      }
      default:
        return [];
    }
  }, [allAirports, searchType]);

  // Helper to map country names to 2-letter codes
  const getCountryCode = (input: string) => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed.length === 2) return trimmed.toUpperCase();
    
    const found = countryData.find(
      (a: any) => a.country_name && a.country_name.toLowerCase() === trimmed
    );
    if (found && found.country) return found.country.toUpperCase();
    
    const common: Record<string, string> = {
      'mexico': 'MX', 'méxico': 'MX',
      'estados unidos': 'US', 'united states': 'US', 'usa': 'US', 'eeuu': 'US', 'ee.uu.': 'US',
      'españa': 'ES', 'spain': 'ES',
      'colombia': 'CO', 'argentina': 'AR', 'chile': 'CL', 'peru': 'PE', 'perú': 'PE',
      'canada': 'CA', 'canadá': 'CA', 'brazil': 'BR', 'brasil': 'BR'
    };
    return common[trimmed] || trimmed.toUpperCase();
  };

  // Helper to map continent names to 2-letter codes
  const getContinentCode = (input: string) => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed.length === 2) return trimmed.toUpperCase();
    
    const common: Record<string, string> = {
      'norteamerica': 'NA', 'norteamérica': 'NA', 'north america': 'NA',
      'sudamerica': 'SA', 'sudamérica': 'SA', 'south america': 'SA',
      'europa': 'EU', 'europe': 'EU',
      'asia': 'AS',
      'africa': 'AF', 'áfrica': 'AF',
      'oceania': 'OC', 'oceanía': 'OC',
      'antartida': 'AN', 'antártida': 'AN', 'antarctica': 'AN'
    };
    return common[trimmed] || trimmed.toUpperCase();
  };

  const fetchAirports = async (query: string, type: string) => {
    const q = query.trim();
    if (!q) {
      setFilteredAirports([]);
      setErrorType(null);
      setHasSearched(false);
      lastFetchedRef.current = { query: '', type: '' };
      return;
    }

    if (lastFetchedRef.current.query === q && lastFetchedRef.current.type === type) {
      return; // Evitar llamadas innecesarias a la API
    }
    
    lastFetchedRef.current = { query: q, type: type };
    setHasSearched(true);
    setLoading(true);
    setErrorType(null);
    addToHistory(type, q);
    
    // Reset local filters on new search
    setLocalFilterCountry('');
    setLocalFilterRegion('');
    setLocalFilterContinent('');
    
    try {
      const apiKey = import.meta.env.VITE_API_KEY;
      if (!apiKey) {
        throw new Error('API Key missing');
      }
      
      let url = '';
      
      switch (type) {
        case 'IATA':
          url = `https://api.api-ninjas.com/v1/airports?iata=${encodeURIComponent(q)}&limit=50`;
          break;
        case 'ICAO':
          url = `https://api.api-ninjas.com/v1/airports?icao=${encodeURIComponent(q)}&limit=50`;
          break;
        case 'COUNTRY': {
          const countryCode = getCountryCode(q);
          url = `https://api.api-ninjas.com/v1/airports?country=${encodeURIComponent(countryCode)}&limit=50`;
          break;
        }
        case 'CONTINENT': {
          const continentCode = getContinentCode(q);
          url = `https://api.api-ninjas.com/v1/airports?continent=${encodeURIComponent(continentCode)}&limit=50`;
          break;
        }
        case 'REGION': {
          // Region is filtered locally to prevent premium API error
          const cleanQ = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const matched = allAirports.filter(a => {
            if (!a.region) return false;
            const cleanReg = a.region.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return cleanReg.includes(cleanQ);
          });
          setFilteredAirports(matched);
          if (matched.length === 0) {
            setErrorType('empty');
          }
          setLoading(false);
          return;
        }
        default:
          break;
      }
      
      if (url) {
        const response = await fetch(url, {
          headers: {
            'X-Api-Key': apiKey
          }
        });
        
        if (!response.ok) {
          setErrorType('api');
          setFilteredAirports([]);
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setFilteredAirports(data);
          if (data.length === 0) {
            setErrorType('empty');
          }
        } else {
          setFilteredAirports([]);
          setErrorType('empty');
        }
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorType('connection');
      setFilteredAirports([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced effect to fetch airports automatically as the user types
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setFilteredAirports([]);
      setErrorType(null);
      setHasSearched(false);
      lastFetchedRef.current = { query: '', type: '' };
      return;
    }

    // No realizar búsquedas con menos de 2 caracteres para País, Región o Continente
    if ((searchType === 'COUNTRY' || searchType === 'REGION' || searchType === 'CONTINENT') && q.length < 2) {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchAirports(q, searchType);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchType]);

  return (
    <div className="cards-only-mode">
      
      {/* Hero Section */}
      <header className="hero-section" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Explorador de Aeropuertos</h1>
          <p className="hero-subtitle">Encuentra información detallada de terminales aéreas en todo el mundo</p>
          <div className="hero-search-wrapper">
            <SearchBar 
              value={searchQuery} 
              onChange={setSearchQuery} 
              searchType={searchType}
              onSearchTypeChange={setSearchType}
              options={searchOptions}
              onSearch={(val) => fetchAirports(val, searchType)}
            />
          </div>
        </div>
      </header>

      {/* Cards Panel or Welcome Screen */}
      {hasSearched ? (
        <section className="full-screen-panel">
          <div className="panel-header" style={{ padding: '2rem 2rem 1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Resultados de Búsqueda</h2>
              {!loading && !errorType && (
                <p>{displayedAirports.length} aeropuertos mostrados de {filteredAirports.length} encontrados</p>
              )}
            </div>
            {!loading && !errorType && displayedAirports.length > 0 && (
              <button className="btn btn-primary" onClick={() => setIsStatsOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <BarChart3 size={18} aria-hidden="true" /> Ver Estadísticas
              </button>
            )}
          </div>
          
          {!loading && !errorType && filteredAirports.length > 0 && (
            <div className="local-filters-container">
              <span className="filters-label">Filtrar resultados por:</span>
              <div className="filters-row">
                <label htmlFor="filter-country" className="sr-only">País</label>
                <select id="filter-country" value={localFilterCountry} onChange={(e) => setLocalFilterCountry(e.target.value)} className="local-filter-select">
                  <option value="">Cualquier País</option>
                  {uniqueCountries.map((c: any) => <option key={c} value={c}>{c}</option>)}
                </select>
                <label htmlFor="filter-region" className="sr-only">Región</label>
                <select id="filter-region" value={localFilterRegion} onChange={(e) => setLocalFilterRegion(e.target.value)} className="local-filter-select">
                  <option value="">Cualquier Región</option>
                  {uniqueRegions.map((r: any) => <option key={r} value={r}>{r}</option>)}
                </select>
                <label htmlFor="filter-continent" className="sr-only">Continente</label>
                <select id="filter-continent" value={localFilterContinent} onChange={(e) => setLocalFilterContinent(e.target.value)} className="local-filter-select">
                  <option value="">Cualquier Continente</option>
                  {uniqueContinents.map((c: any) => <option key={c} value={c}>{c}</option>)}
                </select>
                
                {(localFilterCountry || localFilterRegion || localFilterContinent || sortField) && (
                  <button 
                    onClick={() => {
                      setLocalFilterCountry('');
                      setLocalFilterRegion('');
                      setLocalFilterContinent('');
                      setSortField('');
                      setSortOrder('asc');
                    }} 
                    className="local-filter-clear"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <div className="filters-row" style={{ marginTop: '0.75rem' }}>
                <span className="filters-label" style={{ marginRight: '0.5rem' }}>Ordenar por:</span>
                <label htmlFor="sort-field" className="sr-only">Campo de ordenamiento</label>
                <select id="sort-field" value={sortField} onChange={(e) => setSortField(e.target.value as any)} className="local-filter-select">
                  <option value="">Por defecto</option>
                  <option value="name">Nombre del aeropuerto</option>
                  <option value="iata">Código IATA</option>
                  <option value="country_name">País</option>
                  <option value="region">Región</option>
                  <option value="continent">Continente</option>
                </select>
                
                {sortField && (
                  <>
                    <label htmlFor="sort-order" className="sr-only">Dirección de ordenamiento</label>
                    <select id="sort-order" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')} className="local-filter-select">
                      <option value="asc">Ascendente (A-Z)</option>
                      <option value="desc">Descendente (Z-A)</option>
                    </select>
                  </>
                )}
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="loading-container">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 2rem 1.5rem 2rem' }}>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', margin: 0 }}></div>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)' }}>Buscando aeropuertos...</span>
              </div>
              <div className="airport-grid" style={{ paddingTop: 0 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="airport-card glass-panel" style={{ pointerEvents: 'none', opacity: 0.75 }}>
                    <div className="airport-card-main">
                      <div className="airport-card-left">
                        <div className="skeleton-line" style={{ height: '1.2rem', width: '80%', borderRadius: '4px', marginBottom: '0.5rem' }} />
                        <div className="skeleton-line" style={{ height: '0.8rem', width: '50%', borderRadius: '4px' }} />
                      </div>
                      <div className="airport-card-right">
                        <div className="skeleton-line" style={{ width: '28px', height: '28px', borderRadius: '50%', marginRight: '0.25rem' }} />
                        <div className="card-badges">
                          <div className="skeleton-line" style={{ width: '35px', height: '18px', borderRadius: '4px' }} />
                          <div className="skeleton-line" style={{ width: '35px', height: '18px', borderRadius: '4px' }} />
                        </div>
                        <div className="skeleton-line" style={{ width: '60px', height: '14px', borderRadius: '4px' }} />
                      </div>
                    </div>
                    <div className="airport-card-details" style={{ borderTopColor: 'rgba(0, 0, 0, 0.04)' }}>
                      <div className="detail-item">
                        <span className="detail-label">Región:</span>
                        <div className="skeleton-line" style={{ width: '60px', height: '12px', borderRadius: '2px' }} />
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Continente:</span>
                        <div className="skeleton-line" style={{ width: '40px', height: '12px', borderRadius: '2px' }} />
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Latitud:</span>
                        <div className="skeleton-line" style={{ width: '55px', height: '12px', borderRadius: '2px' }} />
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Longitud:</span>
                        <div className="skeleton-line" style={{ width: '55px', height: '12px', borderRadius: '2px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : errorType === 'connection' ? (
            <div className="error-section">
              <h3>Error de conexión</h3>
              <div className="error-box">
                <p>No fue posible conectarse al servicio.</p>
              </div>
            </div>
          ) : errorType === 'api' ? (
            <div className="error-section">
              <h3>Error de API</h3>
              <div className="error-box">
                <p>Ocurrió un error al consultar la información.</p>
              </div>
            </div>
          ) : errorType === 'empty' ? (
            <div className="error-section">
              <h3>Sin resultados</h3>
              <div className="error-box">
                <p>No se encontraron resultados para la búsqueda realizada.</p>
              </div>
            </div>
          ) : (
            <div className="airport-grid">
              {displayedAirports.map((airport) => (
                <AirportCard 
                  key={airport.icao} 
                  airport={airport} 
                  onClick={setSelectedAirport}
                  isFavorite={favorites.some(f => f.icao === airport.icao)}
                  onToggleFavorite={() => toggleFavorite(airport)}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="welcome-container">
          <div className="welcome-section">
            <h2 className="welcome-title">Aeropuertos Favoritos</h2>
            {favorites.length > 0 ? (
              <p className="welcome-subtitle">Accede rápidamente a tus terminales aéreas preferidas</p>
            ) : null}
            
            {favorites.length > 0 ? (
              <div className="airport-grid" style={{ padding: '1rem 0 2rem 0' }}>
                {favorites.map((airport) => (
                  <AirportCard 
                    key={airport.icao} 
                    airport={airport} 
                    onClick={setSelectedAirport}
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorite(airport)}
                  />
                ))}
              </div>
            ) : (
              <div className="favorites-empty-card">
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'rgba(234, 179, 8, 0.1)',
                  color: '#eab308',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <Star size={24} fill="currentColor" aria-hidden="true" />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-text)' }}>
                  Aún no tienes aeropuertos favoritos
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'color-mix(in srgb, var(--color-text) 70%, transparent)',
                  maxWidth: '450px',
                  lineHeight: '1.4',
                  margin: '0'
                }}>
                  Busca terminales por IATA, País o Región y haz clic en la estrella (⭐) en las tarjetas de resultados para agregarlas aquí.
                </p>
              </div>
            )}
          </div>

          <div className="welcome-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} style={{ color: 'var(--color-accent)' }} />
                <h2 className="welcome-title" style={{ margin: 0 }}>Historial de Búsquedas</h2>
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="history-clear-btn"
                  aria-label="Limpiar historial de búsquedas"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>
            {history.length > 0 ? (
              <p className="welcome-subtitle">Haz clic en cualquier búsqueda reciente para volver a realizarla</p>
            ) : null}

            {history.length > 0 ? (
              <div className="history-grid">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="history-chip glass-panel"
                    onClick={() => handleHistoryClick(item)}
                  >
                    <span className={`history-badge badge-${item.type}`}>
                      {item.type}
                    </span>
                    <span className="history-value-text">{item.value}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="history-empty-card">
                <p style={{
                  fontSize: '0.9rem',
                  color: 'color-mix(in srgb, var(--color-text) 60%, transparent)',
                  margin: '0'
                }}>
                  No tienes búsquedas recientes. Realiza consultas para ver tu historial aquí.
                </p>
              </div>
            )}
          </div>

          <div className="welcome-section">
            <h2 className="welcome-title">Guía de Exploración</h2>
            <p className="welcome-subtitle">Cómo utilizar las herramientas de búsqueda de forma inteligente</p>
            <div className="guides-grid">
              <div className="guide-card">
                <div className="guide-icon-wrapper">
                  <ListFilter size={22} aria-hidden="true" />
                </div>
                <h3>Criterio de Búsqueda</h3>
                <p>Elige entre IATA, ICAO, País, Región o Continente haciendo clic en las pestañas.</p>
              </div>
              <div className="guide-card">
                <div className="guide-icon-wrapper">
                  <Sparkles size={20} aria-hidden="true" />
                </div>
                <h3>Sugerencias en Vivo</h3>
                <p>Haz clic en la barra o escribe para filtrar sugerencias globales en tiempo real.</p>
              </div>
              <div className="guide-card">
                <div className="guide-icon-wrapper">
                  <Plane size={22} style={{ transform: 'rotate(-45deg)' }} aria-hidden="true" />
                </div>
                <h3>Información de Pistas</h3>
                <p>Haz clic en cualquier tarjeta de aeropuerto para consultar pistas, altitud, coordenadas y más.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Modal Overlay */}
      {selectedAirport && (
        <AirportModal 
          airport={selectedAirport} 
          onClose={() => setSelectedAirport(null)} 
          isFavorite={favorites.some(f => f.icao === selectedAirport.icao)}
          onToggleFavorite={() => toggleFavorite(selectedAirport)}
        />
      )}
      {isStatsOpen && (
        <StatsDashboard airports={displayedAirports} onClose={() => setIsStatsOpen(false)} />
      )}
    </div>
  );
};

export default MapExplorer;
