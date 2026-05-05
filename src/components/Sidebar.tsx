'use client';

import React, { useState } from 'react';
import { turbines, Turbine, ScourRisk } from '@/data/turbines';
import {
  CheckCircle2, AlertTriangle, Clock, ChevronRight,
  Loader, MapPin, Waves, BarChart3, List, Activity,
} from 'lucide-react';

interface SidebarProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const scourColor: Record<ScourRisk, string> = {
  LOW:      'rgba(16,185,129,0.8)',
  MEDIUM:   'rgba(245,158,11,0.8)',
  HIGH:     'rgba(249,115,22,0.8)',
  CRITICAL: 'rgba(239,68,68,0.8)',
};

const StatusDot = ({ status }: { status: Turbine['status'] }) => {
  const map = {
    verified:    'bg-green-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]',
    error:       'bg-red-500  shadow-[0_0_8px_rgba(239,68,68,0.7)]',
    pending:     'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]',
    calculating: 'bg-blue-400 animate-pulse-slow shadow-[0_0_8px_rgba(96,165,250,0.7)]',
  };
  return <div className={`w-2 h-2 rounded-full flex-shrink-0 ${map[status]}`} />;
};

const StatusIcon = ({ status }: { status: Turbine['status'] }) => {
  if (status === 'verified')    return <CheckCircle2 className="w-3.5 h-3.5 text-green-400 opacity-60" />;
  if (status === 'error')       return <AlertTriangle className="w-3.5 h-3.5 text-red-400 opacity-60" />;
  if (status === 'calculating') return <Loader className="w-3.5 h-3.5 text-blue-400 opacity-60 animate-spin-slow" />;
  return <Clock className="w-3.5 h-3.5 text-amber-400 opacity-60" />;
};

const UtilBar = ({ value }: { value: number }) => {
  const pct = Math.min(value * 100, 100);
  const color = value >= 1.0 ? '#ef4444' : value >= 0.85 ? '#f59e0b' : '#10b981';
  return (
    <div className="util-bar-track w-full mt-1">
      <div className="util-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
};

const KpiTile = ({ label, value, color }: { label: string; value: number | string; color: string }) => (
  <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
    <div className="text-lg font-bold font-mono" style={{ color }}>{value}</div>
    <div className="text-[8px] uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</div>
  </div>
);

const Sidebar = ({ selectedId, onSelect }: SidebarProps) => {
  const [view, setView] = useState<'list' | 'map'>('list');

  const total      = turbines.length;
  const verified   = turbines.filter(t => t.status === 'verified').length;
  const errors     = turbines.filter(t => t.status === 'error').length;
  const pending    = turbines.filter(t => t.status === 'pending' || t.status === 'calculating').length;
  const critScour  = turbines.filter(t => t.scourRisk === 'CRITICAL' || t.scourRisk === 'HIGH').length;

  const avgUtil = turbines.reduce((sum, t) => {
    const maxU = t.checks.reduce((m, c) => Math.max(m, c.utilization), 0);
    return sum + maxU;
  }, 0) / total;

  return (
    <aside
      className="fixed left-0 top-14 bottom-0 w-72 flex flex-col z-40 glass-morphism"
      style={{ borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* ── Project KPIs ── */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--primary)' }}>
            Project Overview
          </h2>
          <div className="flex items-center gap-1 text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <Activity className="w-3 h-3" />
            LIVE
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 mb-3">
          <KpiTile label="Total"    value={total}    color="rgba(255,255,255,0.8)" />
          <KpiTile label="OK"       value={verified} color="#34d399" />
          <KpiTile label="Fail"     value={errors}   color="#f87171" />
          <KpiTile label="Pending"  value={pending}  color="#fbbf24" />
        </div>

        {/* Overall utilization bar */}
        <div className="flex items-center justify-between text-[9px] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span className="uppercase tracking-wider">Avg Max Utilization</span>
          <span className="font-mono font-bold" style={{ color: avgUtil >= 0.85 ? '#f59e0b' : '#34d399' }}>
            {(avgUtil * 100).toFixed(1)}%
          </span>
        </div>
        <UtilBar value={avgUtil} />

        {critScour > 0 && (
          <div className="mt-2 px-2.5 py-1.5 rounded-md flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider badge-fail">
            <Waves className="w-3 h-3" />
            {critScour} turbines — High Scour Risk
          </div>
        )}
      </div>

      {/* ── View toggle ── */}
      <div className="flex gap-1 p-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <button onClick={() => setView('list')} className={`tab-btn flex-1 flex items-center justify-center gap-1.5 ${view === 'list' ? 'active' : ''}`}>
          <List className="w-3 h-3" />List
        </button>
        <button onClick={() => setView('map')} className={`tab-btn flex-1 flex items-center justify-center gap-1.5 ${view === 'map' ? 'active' : ''}`}>
          <MapPin className="w-3 h-3" />Map
        </button>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        {view === 'list' ? (
          <div className="p-3 space-y-1.5">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Turbine Foundation Units
            </div>
            {turbines.map((tb) => {
              const maxUtil = tb.checks.reduce((m, c) => Math.max(m, c.utilization), 0);
              const isSelected = selectedId === tb.id;
              return (
                <div
                  key={tb.id}
                  onClick={() => onSelect(tb.id)}
                  className="group relative flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all overflow-hidden"
                  style={{
                    background: isSelected ? 'rgba(0,195,255,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? 'rgba(0,195,255,0.35)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(0,195,255,0.06)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,195,255,0.2)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                    }
                  }}
                >
                  {/* Left accent bar for selected */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l" style={{ background: 'var(--primary)' }} />
                  )}

                  <div className="flex items-center gap-2.5">
                    <StatusDot status={tb.status} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold tracking-wide" style={{ color: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.85)' }}>
                        {tb.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] uppercase tracking-tighter" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          L={tb.geometry.pileLength}m · D={tb.geometry.pileDiameter}m
                        </span>
                        <div className="w-1 h-1 rounded-full" style={{ background: scourColor[tb.scourRisk] }} title={`Scour: ${tb.scourRisk}`} />
                      </div>
                      <UtilBar value={maxUtil} />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className="text-[8px] font-mono font-bold"
                      style={{ color: maxUtil >= 1.0 ? '#f87171' : maxUtil >= 0.85 ? '#fbbf24' : '#34d399' }}
                    >
                      {(maxUtil * 100).toFixed(0)}%
                    </span>
                    <StatusIcon status={tb.status} />
                    <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Dot map view */
          <div className="p-4">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
              WTG Layout · Top View
            </div>
            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(0,80,160,0.15), rgba(2,15,30,0.9))',
                border: '1px solid rgba(0,195,255,0.15)',
                height: 220,
              }}
            >
              {/* Grid lines */}
              {[0,25,50,75,100].map(p => (
                <div key={p} className="absolute inset-x-0 border-t" style={{ top: `${p}%`, borderColor: 'rgba(0,195,255,0.06)' }} />
              ))}
              {[0,25,50,75,100].map(p => (
                <div key={p} className="absolute inset-y-0 border-l" style={{ left: `${p}%`, borderColor: 'rgba(0,195,255,0.06)' }} />
              ))}
              {turbines.map((tb, i) => {
                const col = i % 4;
                const row = Math.floor(i / 4);
                const x = 12 + col * 25;
                const y = 12 + row * 32;
                const dotColor = tb.status === 'verified' ? '#34d399' : tb.status === 'error' ? '#f87171' : tb.status === 'calculating' ? '#60a5fa' : '#fbbf24';
                const isSelected = selectedId === tb.id;
                return (
                  <button
                    key={tb.id}
                    onClick={() => onSelect(tb.id)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    title={tb.name}
                  >
                    <div
                      className="rounded-full transition-all"
                      style={{
                        width: isSelected ? 14 : 10,
                        height: isSelected ? 14 : 10,
                        background: dotColor,
                        boxShadow: `0 0 ${isSelected ? 14 : 6}px ${dotColor}`,
                        border: isSelected ? '2px solid white' : 'none',
                      }}
                    />
                    {isSelected && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[7px] font-mono whitespace-nowrap" style={{ color: 'var(--primary)' }}>
                        {tb.name}
                      </div>
                    )}
                  </button>
                );
              })}
              {/* North indicator */}
              <div className="absolute top-2 right-3 text-[8px] font-bold" style={{ color: 'rgba(0,195,255,0.4)' }}>N ↑</div>
              <div className="absolute bottom-2 left-3 text-[7px]" style={{ color: 'rgba(255,255,255,0.2)' }}>1:5000</div>
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { color: '#34d399', label: 'Verified' },
                { color: '#f87171', label: 'Error' },
                { color: '#fbbf24', label: 'Pending' },
                { color: '#60a5fa', label: 'Calc...' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-[8px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer action ── */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(0,0,0,0.25)' }}>
        <button
          className="w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{
            background: 'rgba(0,195,255,0.1)',
            border: '1px solid rgba(0,195,255,0.3)',
            color: 'var(--primary)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,195,255,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,195,255,0.1)')}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Generate Full Report
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
