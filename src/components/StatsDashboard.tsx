import React, { useMemo, useEffect } from 'react';
import type { Airport } from '../types/airport';
import { X, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface Props {
  airports: Airport[];
  onClose: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

const StatsDashboard: React.FC<Props> = ({ airports, onClose }) => {
  // Prevent scrolling on body when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const total = airports.length;

  const countriesData = useMemo(() => {
    const counts: Record<string, number> = {};
    airports.forEach(a => {
      const c = a.country_name || 'Desconocido';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [airports]);

  const continentsData = useMemo(() => {
    const counts: Record<string, number> = {};
    airports.forEach(a => {
      const c = a.continent || 'Desconocido';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value);
  }, [airports]);

  const regionsData = useMemo(() => {
    const counts: Record<string, number> = {};
    airports.forEach(a => {
      const c = a.region?.replace(' (state)', '') || 'Desconocido';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [airports]);

  if (total === 0) {
    return (
      <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
        <div className="modal-container" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-header-top">
              <h2 className="modal-title">Estadísticas</h2>
              <button className="modal-close-btn-inline" onClick={onClose}><X size={24} /></button>
            </div>
          </div>
          <div className="modal-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
            <p style={{ color: '#64748b' }}>No hay datos para mostrar con los filtros actuales.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="modal-container stats-modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-top">
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BarChart3 size={28} color="var(--color-accent)" />
              Dashboard de Estadísticas
            </h2>
            <div className="modal-header-actions">
              <button className="modal-close-btn-inline" onClick={onClose} title="Cerrar">
                <X size={24} />
              </button>
            </div>
          </div>
          <p className="modal-subtitle">Análisis en tiempo real sobre los {total} aeropuertos resultantes</p>
        </div>

        <div className="modal-content stats-content">
          
          <div className="stats-summary-card">
            <div className="stats-summary-info">
              <h3 className="stats-summary-title">Total de Aeropuertos</h3>
              <p className="stats-summary-subtitle">Encontrados en esta búsqueda</p>
            </div>
            <div className="stats-total-number">{new Intl.NumberFormat('es-MX').format(total)}</div>
          </div>

          <div className="stats-grid">
            {/* Top 10 Países */}
            <div className="stats-chart-card">
              <h4 className="stats-chart-title">Aeropuertos por País (Top 10)</h4>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={countriesData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} tick={{fontSize: 11, fill: '#64748b'}} tickLine={false} axisLine={{stroke: '#cbd5e1'}} />
                    <YAxis allowDecimals={false} tick={{fontSize: 11, fill: '#64748b'}} tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{fill: 'rgba(59, 130, 246, 0.05)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Aeropuertos" animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Continentes */}
            <div className="stats-chart-card">
              <h4 className="stats-chart-title">Distribución por Continente</h4>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={continentsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      labelLine={{stroke: '#94a3b8'}}
                      animationDuration={1000}
                    >
                      {continentsData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top 10 Regiones (Horizontal Bar) */}
            <div className="stats-chart-card full-width">
              <h4 className="stats-chart-title">Aeropuertos por Región (Top 10)</h4>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={regionsData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" allowDecimals={false} tick={{fontSize: 11, fill: '#64748b'}} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#475569'}} tickLine={false} axisLine={{stroke: '#cbd5e1'}} />
                    <RechartsTooltip cursor={{fill: 'rgba(16, 185, 129, 0.05)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} name="Aeropuertos" animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
