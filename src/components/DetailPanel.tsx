'use client';

import React, { useState } from 'react';
import { Turbine } from '@/data/turbines';
import { verifyTurbineDesign, utilizationColor, fmt } from '@/utils/CalculationEngine';
import { X, ShieldCheck, ShieldAlert, BarChart3, Wind, Zap, Layers, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props { turbine: Turbine | null; onClose: () => void; }

type Tab = 'foundation' | 'geotech' | 'loads' | 'mv';

const SOIL_COLOR: Record<string, string> = {
  CLAY:   '#8B5A2B',
  SAND:   '#C9AA50',
  ROCK:   '#787890',
  GRAVEL: '#A08C64',
  SILT:   '#9B8F78',
};

const SIT_BADGE: Record<string, string> = {
  ULS: 'badge-uls', SLS: 'badge-sls', FLS: 'badge-fls', ALS: 'badge-als',
};

const UtilBar = ({ value, label, unit, applied, limit }: { value: number; label: string; unit: string; applied: number; limit: number; }) => {
  const pct = Math.min(value * 100, 100);
  const color = utilizationColor(value);
  const status = value >= 1 ? 'FAIL' : value >= 0.85 ? 'WARN' : 'PASS';
  const statusClass = status === 'FAIL' ? 'badge-fail' : status === 'WARN' ? 'badge-warn' : 'badge-pass';
  return (
    <div className="py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{fmt(applied)}/{fmt(limit)} {unit}</span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${statusClass}`}>{status}</span>
        </div>
      </div>
      <div className="util-bar-track">
        <div className="util-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-right text-[9px] font-mono mt-0.5" style={{ color }}>{pct.toFixed(1)}%</div>
    </div>
  );
};

const InfoRow = ({ label, value, unit = '' }: { label: string; value: string | number; unit?: string }) => (
  <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
    <span className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
    <span className="text-[10px] font-mono font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>{value}{unit && <span style={{ color: 'rgba(255,255,255,0.35)' }}> {unit}</span>}</span>
  </div>
);

const DetailPanel = ({ turbine, onClose }: Props) => {
  const [tab, setTab] = useState<Tab>('foundation');
  if (!turbine) return null;

  const v = verifyTurbineDesign(turbine);
  const { geometry: g, pileGroup: pg, soilProfile, loadCases, checks, foundation: f, mvSystem } = turbine;
  const totalDepth = soilProfile[soilProfile.length - 1]?.depthTo ?? 45;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'foundation', label: 'Foundation', icon: <BarChart3 className="w-3 h-3" /> },
    { id: 'geotech',   label: 'Geotech',    icon: <Layers className="w-3 h-3" /> },
    { id: 'loads',     label: 'Loads',      icon: <Wind className="w-3 h-3" /> },
    { id: 'mv',        label: 'MV System',  icon: <Zap className="w-3 h-3" /> },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 120 }}
        className="fixed right-0 top-14 bottom-0 w-[420px] flex flex-col z-50 shadow-2xl glass-morphism"
        style={{ borderLeft: '1px solid var(--border-subtle)' }}
      >
        {/* ── Header ── */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${v.passed ? 'badge-pass' : 'badge-fail'}`}>
              {v.passed ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider uppercase" style={{ color: v.passed ? '#34d399' : '#f87171' }}>{turbine.name}</h2>
              <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {v.passed ? 'All Checks Passed' : `${v.errors.length} Error · ${v.warnings.length} Warning`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
            <X className="w-4 h-4" />
          </button>
        </div>


        {/* ── Meta strip ── */}
        <div className="grid grid-cols-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          {[
            { l: 'Power', v: `${turbine.ratedPower} MW` },
            { l: 'H_s', v: `${turbine.designWaveHeight.toFixed(1)} m` },
            { l: 'Piles', v: `${g.pileCount} × Ø${g.pileDiameter}m` },
            { l: 'Depth', v: `${g.waterDepth} m` },
          ].map((i, idx) => (
            <div key={i.l} className="p-2 text-center" style={{ borderRight: idx < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div className="text-[8px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{i.l}</div>
              <div className="text-[10px] font-mono font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>{i.v}</div>
            </div>
          ))}
        </div>


        {/* ── Tabs ── */}
        <div className="flex gap-1 p-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`tab-btn flex-1 flex items-center justify-center gap-1 ${tab === t.id ? 'active' : ''}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ── FOUNDATION TAB ── */}
          {tab === 'foundation' && (
            <>
              {/* Geometry */}
              <section>
                <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--primary)' }}>Geometry</h3>
                <div className="glass-card p-3 space-y-0">
                  <InfoRow label="Pile Count"       value={g.pileCount} unit="nos" />
                  <InfoRow label="Pile Diameter"    value={g.pileDiameter} unit="m" />
                  <InfoRow label="Pile Length"      value={g.pileLength} unit="m" />
                  <InfoRow label="Wall Thickness"   value={g.pileWallThickness} unit="mm" />
                  <InfoRow label="Pile Spacing S"   value={g.pileSpacing} unit="m" />
                  <InfoRow label="Rake Angle"       value={g.rakeAngle} unit="°" />
                  <InfoRow label="Scour Depth"      value={g.scourDepth.toFixed(1)} unit="m" />
                  <InfoRow label="Cap Diameter"     value={g.pileCapDiameter} unit="m" />
                  <InfoRow label="Water Depth"      value={g.waterDepth} unit="m" />
                </div>
              </section>

              {/* Pile Group */}
              <section>
                <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--primary)' }}>Pile Group (Converse-Labarre)</h3>
                <div className="glass-card p-3 space-y-0">
                  <InfoRow label="S/D Ratio"        value={pg.spacingRatio} unit={pg.spacingOK ? '✓ OK' : '✗ NG'} />
                  <InfoRow label="Group Efficiency η" value={pg.groupEfficiency} />
                  <InfoRow label="Group Compress."  value={fmt(pg.groupCapacityCompress)} unit="kN" />
                  <InfoRow label="Group Tension"    value={fmt(pg.groupCapacityTension)} unit="kN" />
                  <InfoRow label="Lateral Stiffness" value={fmt(pg.lateralStiffness)} unit="kN/m" />
                  <InfoRow label="Rotational K"     value={`${(pg.rotationalStiffness / 1e6).toFixed(1)}×10⁶`} unit="kNm/rad" />
                </div>
              </section>

              {/* Engineering Checks */}
              <section>
                <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--primary)' }}>Engineering Checks</h3>
                <div className="glass-card p-3">
                  {checks.map(c => (
                    <UtilBar key={c.id} label={c.name} value={c.utilization} unit={c.unit} applied={c.applied} limit={c.limit} />
                  ))}
                </div>
              </section>

              {/* Cost */}
              <section>
                <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--primary)' }}>Cost Estimate</h3>
                <div className="glass-card p-3 space-y-0">
                  <InfoRow label="VND" value={`${fmt(f.costEstimateVND)} M`} />
                  <InfoRow label="USD" value={`~${fmt(f.costEstimateVND / 24)} K`} />
                  <InfoRow label="Settlement" value={f.settlementEstimate.toFixed(0)} unit="mm" />
                  <InfoRow label="Lateral Disp." value={f.lateralDisplacement.toFixed(0)} unit="mm" />
                </div>
              </section>

              {/* Errors/Warnings */}
              {v.errors.length > 0 && (
                <section>
                  <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2 text-red-400">Issues Detected</h3>
                  <div className="space-y-1.5">
                    {v.errors.map((e, i) => <div key={i} className="glass-card p-2.5 text-[10px] leading-relaxed badge-fail rounded-lg">⚠ {e}</div>)}
                    {v.warnings.map((w, i) => <div key={i} className="glass-card p-2.5 text-[10px] leading-relaxed badge-warn rounded-lg">⚡ {w}</div>)}
                  </div>
                </section>
              )}
            </>
          )}

          {/* ── GEOTECH TAB ── */}
          {tab === 'geotech' && (
            <>
              <section>
                <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--primary)' }}>Soil Profile Visualizer</h3>
                <div className="flex gap-3">
                  {/* Soil column */}
                  <div className="w-16 flex-shrink-0 rounded overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    {soilProfile.map((layer, i) => {
                      const heightPct = ((layer.depthTo - layer.depthFrom) / totalDepth) * 100;
                      return (
                        <div key={i} className="relative flex items-center justify-center"
                          style={{ height: `${heightPct * 2}px`, background: `${SOIL_COLOR[layer.type]}40`, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <span className="text-[7px] font-bold uppercase" style={{ color: SOIL_COLOR[layer.type] }}>{layer.type.slice(0, 2)}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Layer details */}
                  <div className="flex-1 space-y-2">
                    {soilProfile.map((layer, i) => (
                      <div key={i} className="glass-card p-2.5" style={{ borderLeft: `3px solid ${SOIL_COLOR[layer.type]}80` }}>
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>{layer.name}</span>
                          <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{layer.depthFrom}–{layer.depthTo}m</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="text-center"><div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>qc</div><div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>{layer.cptQc.toFixed(1)} MPa</div></div>
                          <div className="text-center"><div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>SPT-N</div><div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>{layer.sptN}</div></div>
                          <div className="text-center"><div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Su</div><div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>{layer.Su > 0 ? `${layer.Su} kPa` : `φ=${layer.frictionAngle}°`}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* GWL info */}
              <section>
                <div className="glass-card p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>Groundwater Level</div>
                    <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>At seabed (offshore) · Design water depth: {g.waterDepth} m LAT</div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ── LOADS TAB ── */}
          {tab === 'loads' && (
            <>
              <section>
                <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--primary)' }}>6-DOF Load Cases (DNV-ST-0437)</h3>
                <div className="space-y-2">
                  {loadCases.map(lc => (
                    <div key={lc.id} className="glass-card p-3" style={{ borderLeft: `3px solid ${lc.isGoverning ? '#ef4444' : 'rgba(255,255,255,0.1)'}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold" style={{ color: lc.isGoverning ? '#f87171' : 'rgba(255,255,255,0.8)' }}>{lc.label}</span>
                          {lc.isGoverning && <span className="text-[7px] font-bold px-1.5 py-0.5 rounded badge-fail">GOVERNING</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${SIT_BADGE[lc.situation]}`}>{lc.situation}</span>
                          <span className="text-[8px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>{lc.dlc}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        {[
                          { l: 'V', v: `${fmt(lc.V)} kN` },
                          { l: 'Hx', v: `${fmt(lc.Hx)} kN` },
                          { l: 'Hy', v: `${fmt(lc.Hy)} kN` },
                          { l: 'Mx', v: `${(lc.Mx/1000).toFixed(0)} MNm` },
                          { l: 'My', v: `${(lc.My/1000).toFixed(0)} MNm` },
                          { l: 'Mz', v: `${(lc.Mz/1000).toFixed(1)} MNm` },
                        ].map(d => (
                          <div key={d.l} className="rounded p-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{d.l}</div>
                            <div className="text-[9px] font-mono font-bold" style={{ color: 'rgba(255,255,255,0.75)' }}>{d.v}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-1.5 text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        γ_F = {lc.gammaF} · ψ = {lc.combinationFactor}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ── MV TAB ── */}
          {tab === 'mv' && mvSystem && (
            <>
              <section>
                <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: '#fbbf24' }}>MV Collecting System</h3>
                <div className="glass-card p-3 space-y-0">
                  <InfoRow label="Cable Sizing"    value={mvSystem.cableSizing} />
                  <InfoRow label="Voltage Drop"    value={mvSystem.voltageDrop.toFixed(2)} unit="%" />
                  <InfoRow label="SC Level"        value={mvSystem.shortCircuitLevel} unit="kA" />
                  <InfoRow label="Loop Resistance" value={mvSystem.loopResistance.toFixed(3)} unit="Ω/km" />
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[9px] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <span>Voltage Drop Utilization</span>
                    <span className="font-mono">{(mvSystem.voltageDrop / 5 * 100).toFixed(1)}% of 5% limit</span>
                  </div>
                  <div className="util-bar-track">
                    <div className="util-bar-fill" style={{ width: `${Math.min(mvSystem.voltageDrop / 5 * 100, 100)}%`, background: mvSystem.voltageDrop > 5 ? '#ef4444' : mvSystem.voltageDrop > 4 ? '#f59e0b' : '#10b981' }} />
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-3 border-t flex gap-2" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(0,0,0,0.25)' }}>
          <button className="flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95" style={{ background: 'rgba(0,195,255,0.1)', border: '1px solid rgba(0,195,255,0.3)', color: 'var(--primary)' }}>
            Recalculate
          </button>
          <button className="px-3 py-2.5 rounded-lg transition-all" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DetailPanel;
