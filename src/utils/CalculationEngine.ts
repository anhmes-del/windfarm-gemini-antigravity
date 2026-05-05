import { Turbine, EngineeringCheck } from '@/data/turbines';

export interface VerificationResult {
  passed: boolean;
  warnings: string[];
  errors: string[];
  criticalChecks: EngineeringCheck[];
  overallUtilization: number;
}

export const verifyTurbineDesign = (turbine: Turbine): VerificationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { foundation, mvSystem, pileGroup, geometry, checks } = turbine;

  // 1. Foundation Bearing Capacity Check
  if (foundation.appliedPressure > foundation.bearingCapacity) {
    errors.push(`Bearing Capacity: Applied (${foundation.appliedPressure} kPa) > Limit (${foundation.bearingCapacity} kPa). FS=${(foundation.bearingCapacity/foundation.appliedPressure).toFixed(2)}`);
  }

  // 2. Overturning Stability Check
  if (foundation.overturningMoment > foundation.resistingMoment) {
    errors.push(`Overturning Stability: M_ov=${(foundation.overturningMoment/1000).toFixed(0)} MNm > M_res=${(foundation.resistingMoment/1000).toFixed(0)} MNm`);
  }

  // 3. Pile Load Check
  if (foundation.appliedPileLoad > foundation.pileCapacity) {
    errors.push(`Pile Capacity: Applied (${foundation.appliedPileLoad} kN) > Capacity (${foundation.pileCapacity} kN)`);
  } else if (foundation.appliedPileLoad > foundation.pileCapacity * 0.85) {
    warnings.push(`Pile Capacity approaching limit: Utilization=${(foundation.appliedPileLoad/foundation.pileCapacity*100).toFixed(1)}%`);
  }

  // 4. MV System Voltage Drop Check
  if (mvSystem && mvSystem.voltageDrop > 5.0) {
    errors.push(`MV Voltage Drop: ${mvSystem.voltageDrop.toFixed(1)}% exceeds 5% limit`);
  } else if (mvSystem && mvSystem.voltageDrop > 4.0) {
    warnings.push(`MV Voltage Drop approaching limit: ${mvSystem.voltageDrop.toFixed(1)}%`);
  }

  // 5. Pile group spacing check
  if (!pileGroup.spacingOK) {
    warnings.push(`Pile spacing S/D=${pileGroup.spacingRatio} < 2.5 (DNV-ST-0126 requirement)`);
  }

  // 6. Pile group efficiency check
  if (pileGroup.groupEfficiency < 0.80) {
    warnings.push(`Pile group efficiency η=${pileGroup.groupEfficiency.toFixed(2)} < 0.80 — review layout`);
  }

  // 7. Scour depth
  if (geometry.scourDepth > 1.5) {
    warnings.push(`Scour depth ${geometry.scourDepth.toFixed(1)}m — verify effective pile length`);
  }

  // 8. Settlement
  if (foundation.settlementEstimate > 80) {
    warnings.push(`Settlement estimate ${foundation.settlementEstimate.toFixed(0)}mm approaching SLS limit of 100mm`);
  }

  const criticalChecks = checks.filter(c => c.status === 'FAIL' || c.utilization > 0.90);
  const overallUtilization = checks.reduce((max, c) => Math.max(max, c.utilization), 0);

  return {
    passed: errors.length === 0,
    warnings,
    errors,
    criticalChecks,
    overallUtilization,
  };
};

// Utility: format large numbers
export const fmt = (val: number, decimals = 0): string =>
  val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// Utilization colour
export const utilizationColor = (u: number): string => {
  if (u >= 1.0) return '#ef4444';   // fail
  if (u >= 0.85) return '#f59e0b';  // warn
  return '#10b981';                  // pass
};

export const utilizationBg = (u: number): string => {
  if (u >= 1.0) return 'rgba(239,68,68,0.15)';
  if (u >= 0.85) return 'rgba(245,158,11,0.15)';
  return 'rgba(16,185,129,0.12)';
};

export const checkStatus = (u: number): 'PASS' | 'WARN' | 'FAIL' => {
  if (u >= 1.0) return 'FAIL';
  if (u >= 0.85) return 'WARN';
  return 'PASS';
};
