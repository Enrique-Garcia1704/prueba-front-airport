import React, { useMemo, useEffect, useState } from 'react';
import type { Airport } from '../types/airport';
import { X, BarChart3, Globe, Filter, Database, Search, Compass, MapPin } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface Props {
  displayedAirports: Airport[];
  allAirports: Airport[];
  onClose: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

const CONTINENT_NAMES: Record<string, string> = {
  'AF': 'África',
  'AN': 'Antártida',
  'AS': 'Asia',
  'EU': 'Europa',
  'NA': 'Norteamérica',
  'OC': 'Oceanía',
  'SA': 'Sudamérica',
  'DESCONOCIDO': 'Desconocido'
};

/** Truncate a string to maxLen chars, appending "…" if needed */
function truncate(str: string, maxLen: number) {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

const StatsDashboard: React.FC<Props> = ({ displayedAirports, allAirports, onClose }) => {
  const [isGlobal, setIsGlobal] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 600);

  // Prevent scrolling on body when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Track viewport width changes
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const airportsToAnalyze = isGlobal ? allAirports : displayedAirports;
  const totalActive = airportsToAnalyze.length;

  const countriesData = useMemo(() => {
    const counts: Record<string, number> = {};
    airportsToAnalyze.forEach(a => {
      const c = a.country_name || 'Desconocido';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [airportsToAnalyze]);

  const continentsData = useMemo(() => {
    const counts: Record<string, number> = {};
    airportsToAnalyze.forEach(a => {
      const c = a.continent ? a.continent.toUpperCase() : 'DESCONOCIDO';
      const name = CONTINENT_NAMES[c] || c;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value);
  }, [airportsToAnalyze]);

  const regionsData = useMemo(() => {
    const counts: Record<string, number> = {};
    airportsToAnalyze.forEach(a => {
      const c = a.region?.replace(' (state)', '') || 'Desconocido';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [airportsToAnalyze]);

  // Mobile version: truncate region names for the vertical bar labels
  const regionsDisplayData = useMemo(() => {
    if (!isMobile) return regionsData;
    return regionsData.map(r => ({ ...r, shortName: truncate(r.name, 9) }));
  }, [regionsData, isMobile]);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="modal-container stats-modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-top">
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BarChart3 size={isMobile ? 22 : 28} color="var(--color-accent)" />
              Dashboard de Estadísticas
            </h2>
            <div className="modal-header-actions">
              <button className="modal-close-btn-inline" onClick={onClose} title="Cerrar">
                <X size={24} />
              </button>
            </div>
          </div>
          <p className="modal-subtitle">
            {isGlobal
              ? `Análisis global sobre los ${allAirports.length} aeropuertos registrados en la base de datos`
              : `Análisis en tiempo real sobre los ${displayedAirports.length} aeropuertos resultantes`}
          </p>
        </div>

        <div className="modal-content stats-content">
          {/* Toggle Control segmentado */}
          <div className="stats-toggle-wrapper">
            <div className="stats-toggle-container">
              <button
                className={`stats-toggle-btn ${isGlobal ? 'active' : ''}`}
                onClick={() => setIsGlobal(true)}
              >
                <Globe size={16} />
                {isMobile ? 'Global' : 'Base de Datos Global'}
              </button>
              <button
                className={`stats-toggle-btn ${!isGlobal ? 'active' : ''}`}
                onClick={() => setIsGlobal(false)}
              >
                <Filter size={16} />
                {isMobile ? `Filtro (${displayedAirports.length})` : `Resultados Filtrados (${displayedAirports.length})`}
              </button>
            </div>
          </div>

          {/* Tarjetas de Resumen */}
          <div className="stats-summary-row">
            <div className="stats-summary-card">
              <div className="stats-summary-card-content">
                <div className="stats-summary-info">
                  <h3 className="stats-summary-title">Total Registrados</h3>
                  <p className="stats-summary-subtitle">Base de datos del explorador</p>
                </div>
                <div className="stats-total-number">{new Intl.NumberFormat('es-MX').format(allAirports.length)}</div>
              </div>
              <div className="stats-summary-icon-bg">
                <Database size={40} />
              </div>
            </div>

            <div className="stats-summary-card highlight">
              <div className="stats-summary-card-content">
                <div className="stats-summary-info">
                  <h3 className="stats-summary-title">Filtro / Búsqueda Actual</h3>
                  <p className="stats-summary-subtitle">Aeropuertos encontrados</p>
                </div>
                <div className="stats-total-number" style={{ color: 'var(--color-accent)' }}>
                  {new Intl.NumberFormat('es-MX').format(displayedAirports.length)}
                </div>
              </div>
              <div className="stats-summary-icon-bg">
                <Search size={40} />
              </div>
            </div>
          </div>

          {totalActive === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
              <p style={{ color: '#64748b' }}>No hay datos para mostrar en esta vista.</p>
            </div>
          ) : (
            <div className="stats-grid">

              {/* Top 10 Países */}
              <div className="stats-chart-card">
                <h4 className="stats-chart-title">
                  <Globe size={18} color="var(--color-accent)" />
                  Aeropuertos por País (Top 10)
                </h4>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                    <BarChart
                      data={countriesData}
                      margin={isMobile
                        ? { top: 10, right: 8, left: 0, bottom: 70 }
                        : { top: 20, right: 30, left: 0, bottom: 60 }
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={isMobile ? 70 : 60}
                        interval={0}
                        tick={{ fontSize: isMobile ? 9 : 11, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickFormatter={(v) => isMobile ? truncate(v, 9) : v}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: isMobile ? 9 : 11, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={false}
                        width={isMobile ? 20 : 30}
                      />
                      <RechartsTooltip
                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '0.8rem' }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Aeropuertos" animationDuration={1000} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Continentes */}
              <div className="stats-chart-card">
                <h4 className="stats-chart-title">
                  <Compass size={18} color="var(--color-accent)" />
                  Distribución por Continente
                </h4>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                    <PieChart>
                      <Pie
                        data={continentsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={isMobile ? 35 : 60}
                        outerRadius={isMobile ? 65 : 100}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        /* On mobile: show only % to avoid label overflow */
                        label={isMobile
                          ? ({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`
                          : ({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                        }
                        labelLine={isMobile ? false : { stroke: '#94a3b8' }}
                        animationDuration={1000}
                      >
                        {continentsData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '0.8rem' }}
                        formatter={(value, name) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top 10 Regiones */}
              <div className="stats-chart-card full-width">
                <h4 className="stats-chart-title">
                  <MapPin size={18} color="var(--color-accent)" />
                  Aeropuertos por Región (Top 10)
                </h4>
                <div className="chart-wrapper">
                  {isMobile ? (
                    /* Mobile: vertical bars — eliminates the left-margin overflow problem */
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={regionsDisplayData}
                        margin={{ top: 10, right: 8, left: 0, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="shortName"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          interval={0}
                          tick={{ fontSize: 9, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 9, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={false}
                          width={20}
                        />
                        <RechartsTooltip
                          cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '0.8rem' }}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
                        />
                        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Aeropuertos" animationDuration={1000} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    /* Desktop: original horizontal bar chart */
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={regionsData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                        <RechartsTooltip cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} name="Aeropuertos" animationDuration={1000} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
