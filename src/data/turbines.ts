// ─── Enums & Types ────────────────────────────────────────────────────────────

export type TurbineStatus = 'verified' | 'error' | 'pending' | 'calculating';
export type SoilType = 'CLAY' | 'SAND' | 'ROCK' | 'GRAVEL' | 'SILT';
export type DesignSituation = 'ULS' | 'SLS' | 'FLS' | 'ALS';
export type ScourRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ─── Soil Layer ───────────────────────────────────────────────────────────────

export interface SoilLayer {
  name: string;
  type: SoilType;
  depthFrom: number;   // m below seabed
  depthTo: number;     // m below seabed
  unitWeight: number;  // kN/m³
  cohesion: number;    // kPa (cu for clay, 0 for sand)
  frictionAngle: number; // degrees (φ')
  Su: number;          // undrained shear strength at mid-layer (kPa)
  SuGradient: number;  // kPa/m increase with depth
  sptN: number;        // SPT N-value (blows/300mm)
  cptQc: number;       // cone resistance qc (MPa)
  cptFs: number;       // sleeve friction fs (kPa)
  elasticModulus: number; // MPa
  poissonRatio: number;
  description: string;
}

// ─── Load Case (6-DOF) ───────────────────────────────────────────────────────

export interface LoadCase {
  id: string;
  label: string;
  dlc: string;           // e.g. "DLC 1.3"
  situation: DesignSituation;
  gammaF: number;        // partial safety factor
  combinationFactor: number;
  V: number;             // vertical (kN)
  Hx: number;            // shear X (kN)
  Hy: number;            // shear Y (kN)
  Mx: number;            // moment X (kNm) — overturning
  My: number;            // moment Y (kNm) — overturning (perp)
  Mz: number;            // torsion (kNm)
  isGoverning: boolean;
}

// ─── Foundation Geometry ──────────────────────────────────────────────────────

export interface FoundationGeometry {
  type: 'PILE_CAP' | 'MONOPILE' | 'JACKET' | 'GRAVITY';
  pileCount: number;
  pileDiameter: number;        // m
  pileLength: number;          // m below seabed
  pileWallThickness: number;   // mm
  pileSpacing: number;         // m (centre-to-centre)
  rakeAngle: number;           // degrees from vertical (0 = vertical)
  pileCapDiameter: number;     // m
  pileCapThickness: number;    // m
  embedmentDepth: number;      // m (pile in cap)
  scourDepth: number;          // m (design scour allowance)
  pedestalHeight: number;      // m (above seabed / LAT)
  waterDepth: number;          // m (LAT to seabed)
}

// ─── Pile Group Checks ────────────────────────────────────────────────────────

export interface PileGroupResult {
  spacingRatio: number;              // S/D
  spacingOK: boolean;                // S/D ≥ 2.5 per DNV
  groupEfficiency: number;           // Converse-Labarre η (0..1)
  groupCapacityCompress: number;     // kN
  groupCapacityTension: number;      // kN
  lateralStiffness: number;          // kN/m (Randolph)
  rotationalStiffness: number;       // kNm/rad
}

// ─── Engineering Checks ───────────────────────────────────────────────────────

export interface EngineeringCheck {
  id: string;
  name: string;
  formula: string;
  category: 'BEARING' | 'STABILITY' | 'PILE' | 'STRUCTURAL' | 'DEFORMATION';
  utilization: number;   // 0..1 (≤1 = pass)
  limit: number;         // capacity
  applied: number;       // demand
  unit: string;
  safetyFactor: number;  // FS = limit / applied
  status: 'PASS' | 'WARN' | 'FAIL';
  reference: string;     // code reference
}

// ─── Turbine Root Interface ───────────────────────────────────────────────────

export interface Turbine {
  id: string;
  name: string;
  status: TurbineStatus;
  latitude: number;      // decimal degrees
  longitude: number;     // decimal degrees
  location: [number, number, number]; // 3D scene coords

  // Turbine tech specs
  ratedPower: number;      // MW
  hubHeight: number;       // m above LAT
  rotorDiameter: number;   // m
  designWindSpeed: number; // m/s (V_ref)
  designWaveHeight: number; // m (H_s)
  designWavePeriod: number; // s (T_p)
  scourRisk: ScourRisk;
  pileIntegrityIndex: number; // 0..100

  // Foundation
  foundation: {
    bearingCapacity: number;
    appliedPressure: number;
    safetyFactor: number;
    overturningMoment: number;
    resistingMoment: number;
    pileCapacity: number;
    appliedPileLoad: number;
    concreteGrade: string;
    steelRatio: number;
    settlementEstimate: number; // mm
    lateralDisplacement: number; // mm
    costEstimateVND: number; // million VND
  };

  geometry: FoundationGeometry;
  pileGroup: PileGroupResult;
  soilProfile: SoilLayer[];
  loadCases: LoadCase[];
  checks: EngineeringCheck[];

  mvSystem?: {
    cableSizing: string;
    voltageDrop: number;
    shortCircuitLevel: number;
    loopResistance: number; // Ω/km
  };
}

// ─── Factory helpers ──────────────────────────────────────────────────────────

function makeStatus(i: number): TurbineStatus {
  if (i === 0) return 'error';
  if (i === 4) return 'pending';
  if (i === 8) return 'calculating';
  return 'verified';
}

function makeScourRisk(i: number): ScourRisk {
  const risks: ScourRisk[] = ['LOW', 'LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'MEDIUM', 'LOW', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'LOW'];
  return risks[i] ?? 'LOW';
}

function makeSoilProfile(seed: number): SoilLayer[] {
  return [
    {
      name: 'Soft Marine Clay',
      type: 'CLAY',
      depthFrom: 0,
      depthTo: 6,
      unitWeight: 16.5,
      cohesion: 18 + seed * 2,
      frictionAngle: 0,
      Su: 20 + seed * 3,
      SuGradient: 1.5,
      sptN: 4 + seed,
      cptQc: 0.8 + seed * 0.1,
      cptFs: 28,
      elasticModulus: 5 + seed * 0.5,
      poissonRatio: 0.45,
      description: 'Soft to firm grey marine clay, high plasticity',
    },
    {
      name: 'Medium Dense Sand',
      type: 'SAND',
      depthFrom: 6,
      depthTo: 18,
      unitWeight: 19.5,
      cohesion: 0,
      frictionAngle: 32 + seed % 3,
      Su: 0,
      SuGradient: 0,
      sptN: 22 + seed * 2,
      cptQc: 8.5 + seed * 0.3,
      cptFs: 85,
      elasticModulus: 45 + seed * 3,
      poissonRatio: 0.3,
      description: 'Medium dense fine to medium sand with shell fragments',
    },
    {
      name: 'Dense Silty Sand',
      type: 'SAND',
      depthFrom: 18,
      depthTo: 30,
      unitWeight: 20.0,
      cohesion: 0,
      frictionAngle: 36 + seed % 2,
      Su: 0,
      SuGradient: 0,
      sptN: 38 + seed,
      cptQc: 14.0 + seed * 0.4,
      cptFs: 140,
      elasticModulus: 80 + seed * 5,
      poissonRatio: 0.28,
      description: 'Dense silty fine sand, cemented zones locally',
    },
    {
      name: 'Weathered Rock',
      type: 'ROCK',
      depthFrom: 30,
      depthTo: 45,
      unitWeight: 23.5,
      cohesion: 200,
      frictionAngle: 40,
      Su: 500,
      SuGradient: 0,
      sptN: 100,
      cptQc: 60,
      cptFs: 800,
      elasticModulus: 500 + seed * 20,
      poissonRatio: 0.22,
      description: 'Highly to moderately weathered basalt / phyllite',
    },
  ];
}

function makeLoadCases(i: number): LoadCase[] {
  const base = 1 + i * 0.05;
  return [
    { id: 'lc1', label: 'Normal Production', dlc: 'DLC 1.2', situation: 'FLS', gammaF: 1.0, combinationFactor: 1.0, V: 22000 * base, Hx: 1850 * base, Hy: 420 * base, Mx: 185000 * base, My: 42000 * base, Mz: 3200 * base, isGoverning: false },
    { id: 'lc2', label: 'Extreme Turbulence', dlc: 'DLC 1.3', situation: 'ULS', gammaF: 1.35, combinationFactor: 1.0, V: 25000 * base, Hx: 3200 * base, Hy: 820 * base, Mx: 295000 * base, My: 78000 * base, Mz: 5400 * base, isGoverning: true },
    { id: 'lc3', label: '50-yr Extreme Wind', dlc: 'DLC 6.1', situation: 'ULS', gammaF: 1.35, combinationFactor: 0.7, V: 24000 * base, Hx: 2800 * base, Hy: 680 * base, Mx: 260000 * base, My: 64000 * base, Mz: 4800 * base, isGoverning: false },
    { id: 'lc4', label: 'Fault + Extreme', dlc: 'DLC 2.3', situation: 'ALS', gammaF: 1.1, combinationFactor: 0.6, V: 23000 * base, Hx: 2600 * base, Hy: 600 * base, Mx: 240000 * base, My: 58000 * base, Mz: 4200 * base, isGoverning: false },
    { id: 'lc5', label: 'Transport & Install', dlc: 'DLC 8.1', situation: 'SLS', gammaF: 1.0, combinationFactor: 0.5, V: 18000 * base, Hx: 800 * base, Hy: 200 * base, Mx: 80000 * base, My: 20000 * base, Mz: 1200 * base, isGoverning: false },
  ];
}

function makeChecks(i: number): EngineeringCheck[] {
  const good = i !== 0;
  const utilBase = good ? 0.62 + i * 0.02 : 1.08;
  return [
    { id: 'bc',  name: 'Bearing Capacity',          formula: 'q_ult / q_applied ≥ FS=3.0', category: 'BEARING',     utilization: Math.min(utilBase * 0.9, 0.98),        limit: 500,      applied: good ? 420 : 550,     unit: 'kPa',   safetyFactor: good ? 1.19 : 0.91, status: good ? 'PASS' : 'FAIL',  reference: 'TCVN 9362:2012 §6' },
    { id: 'ot',  name: 'Overturning Stability',      formula: 'M_resist / M_overturn ≥ 1.5', category: 'STABILITY',  utilization: good ? 0.68 : 1.12,                   limit: 120000,   applied: good ? 85000 : 125000, unit: 'kNm',  safetyFactor: good ? 1.41 : 0.96, status: good ? 'PASS' : 'FAIL',  reference: 'DNV-ST-0126 §6.3' },
    { id: 'pc',  name: 'Pile Compression Capacity',  formula: 'R_c,cal ≥ F_compression',     category: 'PILE',        utilization: good ? utilBase * 0.82 : 0.94,        limit: 4500,     applied: good ? 3800 : 4800,   unit: 'kN',   safetyFactor: good ? 1.18 : 0.94, status: good ? 'PASS' : 'WARN',  reference: 'API RP 2A-WSD §6.4' },
    { id: 'pt',  name: 'Pile Tension Capacity',      formula: 'R_t,cal ≥ F_tension',          category: 'PILE',        utilization: good ? 0.55 + i * 0.03 : 0.88,       limit: 3200,     applied: good ? 1800 : 2800,   unit: 'kN',   safetyFactor: good ? 1.78 : 1.14, status: 'PASS',                  reference: 'API RP 2A-WSD §6.5' },
    { id: 'lt',  name: 'Lateral Displacement',       formula: 'δ_h ≤ 50mm (SLS)',             category: 'DEFORMATION', utilization: good ? 0.44 + i * 0.02 : 0.72,       limit: 50,       applied: good ? 22 : 36,       unit: 'mm',   safetyFactor: good ? 2.27 : 1.39, status: 'PASS',                  reference: 'DNV-ST-0126 §6.6' },
    { id: 'st',  name: 'Settlement (Total)',          formula: 'S_total ≤ 100mm (SLS)',         category: 'DEFORMATION', utilization: good ? 0.38 + i * 0.015 : 0.55,      limit: 100,      applied: good ? 38 : 55,       unit: 'mm',   safetyFactor: good ? 2.63 : 1.82, status: 'PASS',                  reference: 'TCVN 9362:2012 §7' },
    { id: 'sd',  name: 'Steel Pile Structural',       formula: 'σ ≤ f_y / γ_M',               category: 'STRUCTURAL',  utilization: good ? utilBase * 0.88 : 1.05,        limit: 345,      applied: good ? 290 : 362,     unit: 'MPa',  safetyFactor: good ? 1.19 : 0.95, status: good ? 'PASS' : 'FAIL',  reference: 'EN 1993-1-1 §6.2' },
    { id: 'sd2', name: 'Pile Group Efficiency',       formula: 'η ≥ 0.80 (Converse-Labarre)', category: 'PILE',        utilization: good ? 0.91 : 0.87,                   limit: 1.0,      applied: good ? 0.91 : 0.87,   unit: 'η',    safetyFactor: good ? 1.10 : 1.15, status: 'PASS',                  reference: 'DNV-ST-0126 §6.4' },
  ];
}

function makePileGroup(i: number, geom: FoundationGeometry): PileGroupResult {
  const S = geom.pileSpacing;
  const D = geom.pileDiameter;
  const n = geom.pileCount;
  const nRow = Math.ceil(Math.sqrt(n));
  const phi = Math.atan(D / S) * (180 / Math.PI);
  const eta = 1 - (phi / 90) * ((nRow - 1) * nRow + (nRow - 1) * nRow) / (4 * nRow * nRow);
  return {
    spacingRatio: +(S / D).toFixed(2),
    spacingOK: S / D >= 2.5,
    groupEfficiency: +Math.max(0.7, Math.min(1.0, eta + i * 0.005)).toFixed(3),
    groupCapacityCompress: +(4500 * n * Math.max(0.7, eta) * (1 + i * 0.01)).toFixed(0),
    groupCapacityTension: +(3200 * n * Math.max(0.7, eta)).toFixed(0),
    lateralStiffness: +(28000 + i * 500).toFixed(0),
    rotationalStiffness: +(1.8e8 + i * 2e6).toFixed(0),
  };
}

// ─── Main data export ─────────────────────────────────────────────────────────

export const turbines: Turbine[] = Array.from({ length: 12 }, (_, i) => {
  const geom: FoundationGeometry = {
    type: 'PILE_CAP',
    pileCount: 8,
    pileDiameter: 1.2,
    pileLength: 32 + i % 4,
    pileWallThickness: 22,
    pileSpacing: 3.6,
    rakeAngle: i % 3 === 0 ? 5 : 0,
    pileCapDiameter: 10.5,
    pileCapThickness: 2.5,
    embedmentDepth: 0.6,
    scourDepth: 1.0 + i * 0.1,
    pedestalHeight: 5.0,
    waterDepth: 12 + i % 5,
  };

  return {
    id: `tb-${i + 1}`,
    name: `WTG-T${(i + 1).toString().padStart(2, '0')}`,
    status: makeStatus(i),
    latitude: 9.68 + i * 0.012,
    longitude: 106.32 + (i % 4) * 0.018,
    location: [(i % 4) * 8 - 12, 0, Math.floor(i / 4) * 8 - 8],

    ratedPower: 8.0,
    hubHeight: 105,
    rotorDiameter: 167,
    designWindSpeed: 50.0,
    designWaveHeight: 8.2 + i * 0.15,
    designWavePeriod: 11.5 + i * 0.1,
    scourRisk: makeScourRisk(i),
    pileIntegrityIndex: i === 0 ? 62 : 88 + (i % 6),

    foundation: {
      bearingCapacity: 500,
      appliedPressure: i === 0 ? 550 : 410 + i * 5,
      safetyFactor: i === 0 ? 0.91 : 1.19 + i * 0.02,
      overturningMoment: 85000 + i * 1000,
      resistingMoment: i === 0 ? 80000 : 120000 + i * 2000,
      pileCapacity: 4500,
      appliedPileLoad: i === 4 ? 4800 : 3600 + i * 50,
      concreteGrade: 'B40',
      steelRatio: 0.85 + i * 0.01,
      settlementEstimate: 22 + i * 1.5,
      lateralDisplacement: 14 + i * 0.8,
      costEstimateVND: 38000 + i * 500,
    },

    geometry: geom,
    pileGroup: makePileGroup(i, geom),
    soilProfile: makeSoilProfile(i % 4),
    loadCases: makeLoadCases(i),
    checks: makeChecks(i),

    mvSystem: {
      cableSizing: i < 4 ? '3×240mm²' : i < 8 ? '3×185mm²' : '3×150mm²',
      voltageDrop: i === 8 ? 5.2 : 2.1 + i * 0.15,
      shortCircuitLevel: 25,
      loopResistance: 0.075 + i * 0.003,
    },
  };
});
