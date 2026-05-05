'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import DetailPanel from '@/components/DetailPanel';
import { turbines } from '@/data/turbines';

// Dynamically import Scene to avoid SSR issues with Three.js
const Scene = dynamic(() => import('@/components/Scene'), { ssr: false });

export default function Home() {
  const [selectedTurbineId, setSelectedTurbineId] = useState<string | null>(null);
  const selectedTurbine = turbines.find(t => t.id === selectedTurbineId) || null;

  const verified    = turbines.filter(t => t.status === 'verified').length;
  const errors      = turbines.filter(t => t.status === 'error').length;
  const avgUtil     = turbines.reduce((s, t) => s + t.checks.reduce((m, c) => Math.max(m, c.utilization), 0), 0) / turbines.length;
  const critScour   = turbines.filter(t => t.scourRisk === 'CRITICAL' || t.scourRisk === 'HIGH').length;

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: 'var(--ocean-950)' }}>
      <Header />
      <Sidebar
        selectedId={selectedTurbineId}
        onSelect={(id) => setSelectedTurbineId(id === selectedTurbineId ? null : id)}
      />

      {/* ── 3D Viewport ── */}
      <div className="absolute inset-0 pt-14 pl-72">
        <div className="w-full h-full relative">
          <Scene
            onSelectTurbine={setSelectedTurbineId}
            selectedTurbineId={selectedTurbineId}
          />

          {/* ── Top-right: View controls ── */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <div
              className="glass-morphism rounded-xl p-3 text-[8px] font-bold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.3)', minWidth: 120 }}
            >
              <div className="mb-2" style={{ color: 'var(--primary)' }}>3D Viewport</div>
              <div>Scroll · Zoom</div>
              <div>Drag · Rotate</div>
              <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                Click turbine to inspect
              </div>
            </div>
          </div>

          {/* ── Bottom KPI bar ── */}
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <div
              className="glass-morphism border-t flex items-center px-4 py-3"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              {[
                { label: 'Total WTGs',    value: turbines.length, color: 'rgba(255,255,255,0.8)', unit: '' },
                { label: 'Verified',      value: verified,        color: '#34d399', unit: '' },
                { label: 'Errors',        value: errors,          color: '#f87171', unit: '' },
                { label: 'High Scour',    value: critScour,       color: '#fb923c', unit: '' },
                { label: 'Avg Max Util.', value: `${(avgUtil*100).toFixed(1)}`, color: avgUtil >= 0.85 ? '#f59e0b' : '#34d399', unit: '%' },
                { label: 'Design Std.',   value: 'DNV-ST-0126',  color: 'rgba(255,255,255,0.5)', unit: '' },
                { label: 'Foundation',    value: 'Pile Cap',      color: 'rgba(255,255,255,0.5)', unit: '' },
                { label: 'Status',        value: errors === 0 ? 'SYSTEM OK' : 'ACTION REQ.', color: errors === 0 ? '#34d399' : '#f87171', unit: '' },
              ].map((kpi, i) => (
                <div key={i} className="flex-1 text-center px-3" style={{ borderRight: i < 7 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <div className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{kpi.label}</div>
                  <div className="text-sm font-mono font-bold" style={{ color: kpi.color }}>
                    {kpi.value}{kpi.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom-right: Soil stability indicator ── */}
          <div className="absolute bottom-16 right-4 z-10">
            <div
              className="glass-morphism p-3 rounded-xl"
              style={{ border: '1px solid rgba(255,255,255,0.08)', minWidth: 160 }}
            >
              <h4 className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)' }}>
                Active Data Stream
              </h4>
              {[
                { label: 'Soil Stability', value: 98.4, color: '#34d399' },
                { label: 'Pile Integrity', value: 91.2, color: '#34d399' },
                { label: 'Scour Monitor',  value: 74.0, color: '#f59e0b' },
              ].map(d => (
                <div key={d.label} className="mb-2">
                  <div className="flex justify-between text-[8px] mb-0.5">
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{d.label}</span>
                    <span className="font-mono font-bold" style={{ color: d.color }}>{d.value}%</span>
                  </div>
                  <div className="util-bar-track">
                    <div className="util-bar-fill" style={{ width: `${d.value}%`, background: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DetailPanel
        turbine={selectedTurbine}
        onClose={() => setSelectedTurbineId(null)}
      />
    </main>
  );
}
