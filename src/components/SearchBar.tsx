import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  searchType: string;
  onSearchTypeChange: (type: string) => void;
  options: string[];
  onSearch: (val: string) => void;
}

const CONTINENT_NAMES: Record<string, string> = {
  AF: 'Africa África',
  AN: 'Antartida Antártida Antarctica',
  AS: 'Asia',
  EU: 'Europa Europe',
  NA: 'Norteamerica Norteamérica North America',
  OC: 'Oceania Oceanía Oceania',
  SA: 'Sudamerica Sudamérica South America'
};

const SearchBar: React.FC<Props> = ({
  value,
  onChange,
  searchType,
  onSearchTypeChange,
  options,
  onSearch
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPlaceholder = () => {
    switch (searchType) {
      case 'IATA': return 'Buscar por IATA... Ej. MEX';
      case 'ICAO': return 'Buscar por ICAO... Ej. MMMX';
      case 'COUNTRY': return 'Buscar por País... Ej. Mexico';
      case 'REGION': return 'Buscar por Región... Ej. Estado de México';
      case 'CONTINENT': return 'Buscar por Continente... Ej. NA, EU';
      default: return 'Buscar...';
    }
  };

  const tabs = [
    { id: 'IATA', label: 'IATA' },
    { id: 'ICAO', label: 'ICAO' },
    { id: 'COUNTRY', label: 'País' },
    { id: 'REGION', label: 'Región' },
    { id: 'CONTINENT', label: 'Continente' },
  ];

  // Accent-insensitive and case-insensitive suggestions filtering
  const filteredOptions = useMemo(() => {
    const cleanVal = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (!cleanVal) return options;

    return options.filter(opt => {
      const optClean = opt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      switch (searchType) {
        case 'IATA': {
          // Format is: "IATA - Airport Name (City)"
          // We only match if the IATA code starts with cleanVal
          const parts = optClean.split(' - ');
          const iataCode = parts[0].trim();
          return iataCode.startsWith(cleanVal);
        }
        case 'ICAO': {
          // Format is: "ICAO - Airport Name (City)"
          // We only match if the ICAO code starts with cleanVal
          const parts = optClean.split(' - ');
          const icaoCode = parts[0].trim();
          return icaoCode.startsWith(cleanVal);
        }
        case 'COUNTRY': {
          // Match if country name starts with or contains cleanVal
          return optClean.includes(cleanVal);
        }
        case 'REGION': {
          // Match if region name starts with or contains cleanVal
          return optClean.includes(cleanVal);
        }
        case 'CONTINENT': {
          // Match if continent code starts with cleanVal or name contains cleanVal
          const code = optClean.trim();
          const continentName = CONTINENT_NAMES[opt] || '';
          const nameClean = continentName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return code.startsWith(cleanVal) || nameClean.includes(cleanVal);
        }
        default:
          return optClean.includes(cleanVal);
      }
    });
  }, [value, options, searchType]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (opt: string) => {
    let searchValue = opt;
    if (searchType === 'IATA' || searchType === 'ICAO') {
      const parts = opt.split(' - ');
      if (parts.length > 1) {
        searchValue = parts[0].trim();
      }
    }
    onChange(searchValue);
    onSearch(searchValue);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (filteredOptions.length > 0) {
          setFocusedIndex(prev => (prev + 1) % filteredOptions.length);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (filteredOptions.length > 0) {
          setFocusedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[focusedIndex]);
        } else {
          onSearch(value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div className="search-bar-wrapper" ref={containerRef}>
      <div className="search-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`search-tab-btn ${searchType === tab.id ? 'active' : ''}`}
            onClick={() => {
              if (searchType !== tab.id) {
                onSearchTypeChange(tab.id);
                onChange(''); // Clear search on type change
                setIsOpen(false);
                setFocusedIndex(-1);
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form 
        className="search-bar-container glass-panel" 
        style={{ position: 'relative' }}
        onSubmit={(e) => {
          e.preventDefault();
          if (focusedIndex < 0) {
            onSearch(value);
            setIsOpen(false);
          }
        }}
      >
        <Search className="search-icon" size={20} aria-hidden="true" />
        <label htmlFor="main-search-input" className="sr-only">Término de búsqueda</label>
        <input
          id="main-search-input"
          type="text"
          className="search-input"
          placeholder={getPlaceholder()}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {value && (
          <button 
            type="button"
            className="search-clear-btn" 
            onClick={() => {
              onChange('');
              setIsOpen(true);
              setFocusedIndex(-1);
            }}
            aria-label="Borrar búsqueda"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          className="search-chevron-btn"
          aria-label={isOpen ? "Ocultar sugerencias" : "Mostrar sugerencias"}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(prev => !prev);
          }}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
        >
          <ChevronDown 
            className="search-chevron-icon" 
            size={20} 
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <div className="suggestions-dropdown">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <button
                  key={opt}
                  type="button"
                  className={`suggestion-item ${focusedIndex === idx ? 'focused' : ''}`}
                  onClick={() => handleSelectOption(opt)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                >
                  {opt}
                </button>
              ))
            ) : value.trim() ? (
              /* IATA/ICAO: API may have codes not in local data — avoid false "Sin coincidencias" */
              (searchType === 'IATA' || searchType === 'ICAO') ? (
                <div className="suggestion-item" style={{ color: '#9ca3af', cursor: 'default', fontStyle: 'italic' }}>
                  Presiona Enter para buscar &ldquo;{value.trim().toUpperCase()}&rdquo;
                </div>
              ) : (
                <div className="suggestion-item" style={{ color: '#9ca3af', cursor: 'default' }}>
                  Sin coincidencias
                </div>
              )
            ) : null}
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;

