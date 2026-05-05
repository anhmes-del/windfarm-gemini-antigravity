'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Activity, Cpu, ChevronDown, Bell, Settings } from 'lucide-react';
import { turbines } from '@/data/turbines';

const Header = () => {
  const [time, setTime] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState('T3WF — Tra Vinh Block C');

  const projects = [
    'T3WF — Tra Vinh Block C',
    'BPWR — Ben Tre Offshore',
    'QTPW — Quang Tri Phase 1',
  ];

  const errorCount = turbines.filter(t => t.status === 'error').length;
  const warnCount  = turbines.filter(t => t.status === 'pending' || t.status === 'calculating').length;

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 h-14 glass-morphism border-b z-50 flex items-center justify-between px-5"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {/* ── Brand ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center glow-border"
          style={{ background: 'rgba(0,195,255,0.12)' }}
        >
          <Cpu className="w-5 h-5" style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h1
            className="text-sm font-bold tracking-[0.15em] uppercase glow-text"
            style={{ color: 'var(--primary)' }}
          >
            Wind-Farm Digital Twin
          </h1>
          <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Foundation Verification System · v2.0
          </p>
        </div>
      </div>

      {/* ── Project Switcher ── */}
      <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-lg border cursor-pointer group transition-all"
        style={{ background: 'rgba(0,195,255,0.06)', borderColor: 'var(--border-primary)' }}
      >
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
        <span className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.8)' }}>
          {selectedProject}
        </span>
        <ChevronDown className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
      </div>

      {/* ── Right Controls ── */}
      <div className="flex items-center gap-5">
        {/* Standards badge */}
        <div className="hidden lg:flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <Shield className="w-3.5 h-3.5 text-green-400" />
          <span>DNV · TCVN · API RP 2A</span>
        </div>

        <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Alert badges */}
        {errorCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md badge-fail text-[10px] font-bold uppercase tracking-wider">
            <Bell className="w-3 h-3" />
            {errorCount} FAIL
          </div>
        )}
        {warnCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md badge-warn text-[10px] font-bold uppercase tracking-wider">
            {warnCount} PENDING
          </div>
        )}

        {/* System status */}
        <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <Activity className="w-3.5 h-3.5 animate-pulse-slow" style={{ color: 'var(--primary)' }} />
          <span className="text-[10px] font-mono tracking-wider">{time}</span>
        </div>

        {/* Settings */}
        <button
          className="p-1.5 rounded-lg transition-all"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold tracking-wider glow-border"
          style={{ background: 'linear-gradient(135deg, rgba(0,195,255,0.3), rgba(30,80,180,0.5))', color: 'var(--primary)' }}
        >
          ENG
        </div>
      </div>
    </header>
  );
};

export default Header;
