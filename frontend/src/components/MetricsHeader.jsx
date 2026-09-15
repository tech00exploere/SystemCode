import React from 'react';
import { Layers, Clock, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function MetricsHeader({ metrics = {}, activeFilter, onFilterChange }) {
  const cards = [
    { key: '', label: 'Total Jobs', count: metrics.total || 0, icon: Layers, color: 'blue' },
    { key: 'pending', label: 'Pending', count: metrics.pending || 0, icon: Clock, color: 'amber' },
    { key: 'running', label: 'Running', count: metrics.running || 0, icon: PlayCircle, color: 'indigo' },
    { key: 'completed', label: 'Completed', count: metrics.completed || 0, icon: CheckCircle2, color: 'emerald' },
    { key: 'failed', label: 'Failed', count: metrics.failed || 0, icon: XCircle, color: 'rose' },
  ];

  return (
    <div className="metrics-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.key;
        return (
          <button
            key={card.label}
            onClick={() => onFilterChange(card.key)}
            className={`metric-card card-${card.color} ${isActive ? 'active' : ''}`}
          >
            <div className="metric-header">
              <span className="metric-label">{card.label}</span>
              <div className={`metric-icon-wrapper icon-${card.color}`}>
                <Icon size={18} />
              </div>
            </div>
            <div className="metric-count">{card.count}</div>
          </button>
        );
      })}
    </div>
  );
}
