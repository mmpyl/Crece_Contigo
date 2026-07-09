import { Child, GrowthLog, VaccineRecord, Milestone, HealthAlert, GrowthCurvePoint } from "../types";

const BOY_STANDARDS = [
  { months: 0, weightMedian: 3.3, weightSD: 0.5, heightMedian: 49.9, heightSD: 1.9 },
  { months: 1, weightMedian: 4.5, weightSD: 0.55, heightMedian: 54.7, heightSD: 2.0 },
  { months: 2, weightMedian: 5.6, weightSD: 0.6, heightMedian: 58.4, heightSD: 2.1 },
  { months: 3, weightMedian: 6.4, weightSD: 0.65, heightMedian: 61.4, heightSD: 2.2 },
  { months: 4, weightMedian: 7.0, weightSD: 0.7, heightMedian: 63.9, heightSD: 2.3 },
  { months: 6, weightMedian: 7.9, weightSD: 0.8, heightMedian: 67.6, heightSD: 2.4 },
  { months: 9, weightMedian: 8.9, weightSD: 0.9, heightMedian: 72.0, heightSD: 2.5 },
  { months: 12, weightMedian: 9.6, weightSD: 1.0, heightMedian: 75.7, heightSD: 2.6 },
  { months: 15, weightMedian: 10.3, weightSD: 1.05, heightMedian: 79.1, heightSD: 2.7 },
  { months: 18, weightMedian: 10.9, weightSD: 1.1, heightMedian: 82.3, heightSD: 2.8 },
  { months: 21, weightMedian: 11.5, weightSD: 1.15, heightMedian: 85.1, heightSD: 2.9 },
  { months: 24, weightMedian: 12.2, weightSD: 1.2, heightMedian: 87.8, heightSD: 3.0 },
];

const GIRL_STANDARDS = [
  { months: 0, weightMedian: 3.2, weightSD: 0.45, heightMedian: 49.1, heightSD: 1.8 },
  { months: 1, weightMedian: 4.2, weightSD: 0.5, heightMedian: 53.7, heightSD: 1.9 },
  { months: 2, weightMedian: 5.1, weightSD: 0.55, heightMedian: 57.1, heightSD: 2.0 },
  { months: 3, weightMedian: 5.8, weightSD: 0.6, heightMedian: 59.8, heightSD: 2.1 },
  { months: 4, weightMedian: 6.4, weightSD: 0.65, heightMedian: 62.1, heightSD: 2.2 },
  { months: 6, weightMedian: 7.3, weightSD: 0.75, heightMedian: 65.7, heightSD: 2.3 },
  { months: 9, weightMedian: 8.2, weightSD: 0.85, heightMedian: 70.1, heightSD: 2.4 },
  { months: 12, weightMedian: 8.9, weightSD: 0.9, heightMedian: 74.0, heightSD: 2.5 },
  { months: 15, weightMedian: 9.6, weightSD: 0.95, heightMedian: 77.5, heightSD: 2.6 },
  { months: 18, weightMedian: 10.2, weightSD: 1.0, heightMedian: 80.7, heightSD: 2.7 },
  { months: 21, weightMedian: 10.9, weightSD: 1.05, heightMedian: 83.7, heightSD: 2.8 },
  { months: 24, weightMedian: 11.5, weightSD: 1.1, heightMedian: 86.4, heightSD: 2.9 },
];

function interpolate(ageMonths: number, standards: typeof BOY_STANDARDS) {
  if (ageMonths <= standards[0].months) return standards[0];
  if (ageMonths >= standards[standards.length - 1].months) return standards[standards.length - 1];

  for (let i = 0; i < standards.length - 1; i++) {
    const left = standards[i];
    const right = standards[i + 1];
    if (ageMonths >= left.months && ageMonths <= right.months) {
      const ratio = (ageMonths - left.months) / (right.months - left.months);
      return {
        weightMedian: left.weightMedian + ratio * (right.weightMedian - left.weightMedian),
        weightSD: left.weightSD + ratio * (right.weightSD - left.weightSD),
        heightMedian: left.heightMedian + ratio * (right.heightMedian - left.heightMedian),
        heightSD: left.heightSD + ratio * (right.heightSD - left.heightSD),
      };
    }
  }
  return standards[0];
}

export function calculateZScoresClient(birthDateStr: string, gender: "Masculino" | "Femenino", weightKg: number, heightCm: number) {
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birthDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const ageMonths = diffDays / 30.4375;

  const standards = gender === "Masculino" ? BOY_STANDARDS : GIRL_STANDARDS;
  const { weightMedian, weightSD, heightMedian, heightSD } = interpolate(ageMonths, standards);

  const weightZ = (weightKg - weightMedian) / weightSD;
  const heightZ = (heightCm - heightMedian) / heightSD;

  let weightStatus = "Normal";
  if (weightZ < -3) weightStatus = "Desnutrición Severa";
  else if (weightZ < -2) weightStatus = "Bajo Peso";
  else if (weightZ > 2) weightStatus = "Obesidad";
  else if (weightZ > 1) weightStatus = "Sobrepeso";

  let heightStatus = "Normal";
  if (heightZ < -3) heightStatus = "Talla Muy Baja";
  else if (heightZ < -2) heightStatus = "Talla Baja";
  else if (heightZ > 2) heightStatus = "Alto";

  return {
    weightZ: Math.round(weightZ * 100) / 100,
    heightZ: Math.round(heightZ * 100) / 100,
    weightStatus,
    heightStatus,
  };
}

export function getGrowthCurvesClient(gender: "Masculino" | "Femenino"): GrowthCurvePoint[] {
  const standards = gender === "Masculino" ? BOY_STANDARDS : GIRL_STANDARDS;
  return standards.map(s => ({
    months: s.months,
    medianWeight: s.weightMedian,
    sdMin2Weight: s.weightMedian - 2 * s.weightSD,
    sdMin3Weight: s.weightMedian - 3 * s.weightSD,
    sdPlus2Weight: s.weightMedian + 2 * s.weightSD,
    medianHeight: s.heightMedian,
    sdMin2Height: s.heightMedian - 2 * s.heightSD,
    sdMin3Height: s.heightMedian - 3 * s.heightSD,
    sdPlus2Height: s.heightMedian + 2 * s.heightSD,
  }));
}

export function recomputeLocalAlerts() {
  const localChildrenStr = localStorage.getItem("local_children");
  const localLogsStr = localStorage.getItem("local_growth_logs");
  const localVaccinesStr = localStorage.getItem("local_vaccine_records");
  const localMilestonesStr = localStorage.getItem("local_milestones");

  let localChildren: Child[] = [];
  let localLogs: GrowthLog[] = [];
  let localVaccines: VaccineRecord[] = [];
  let localMilestones: Milestone[] = [];

  try { if (localChildrenStr) localChildren = JSON.parse(localChildrenStr); } catch {}
  try { if (localLogsStr) localLogs = JSON.parse(localLogsStr); } catch {}
  try { if (localVaccinesStr) localVaccines = JSON.parse(localVaccinesStr); } catch {}
  try { if (localMilestonesStr) localMilestones = JSON.parse(localMilestonesStr); } catch {}

  const localAlerts: HealthAlert[] = [];

  localChildren.forEach(c => {
    const childLogs = localLogs
      .filter(l => l.childId === c.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (childLogs.length > 0) {
      const latest = childLogs[childLogs.length - 1];

      if (latest.weightStatus === "Desnutrición Severa" || latest.weightZ < -3) {
        localAlerts.push({
          id: `alert_local_g1_${c.id}`,
          childId: c.id,
          childName: c.name,
          type: "growth",
          severity: "high",
          message: `Desnutrición aguda severa detectada (Z-Score de Peso: ${latest.weightZ}). Se requiere intervención CRED inmediata.`,
          resolved: false,
          dateCreated: new Date().toISOString().split("T")[0],
        });
      } else if (latest.weightStatus === "Bajo Peso" || latest.weightZ < -2) {
        localAlerts.push({
          id: `alert_local_g2_${c.id}`,
          childId: c.id,
          childName: c.name,
          type: "growth",
          severity: "high",
          message: `Riesgo elevado de Desnutrición Crónica Infantil (DCI). Peso actual de ${latest.weightKg}kg está por debajo del estándar OMS (Z-Score ${latest.weightZ}).`,
          resolved: false,
          dateCreated: new Date().toISOString().split("T")[0],
        });
      }

      if (childLogs.length >= 2) {
        const prev = childLogs[childLogs.length - 2];
        const drop = prev.weightKg - latest.weightKg;
        if (drop > 0.4) {
          localAlerts.push({
            id: `alert_local_t1_${c.id}`,
            childId: c.id,
            childName: c.name,
            type: "risk",
            severity: "medium",
            message: `Pérdida súbita de peso detectada entre controles: descendió de ${prev.weightKg}kg a ${latest.weightKg}kg (${drop.toFixed(1)}kg perdidos). Posible cuadro de deshidratación o infección aguda.`,
            resolved: false,
            dateCreated: new Date().toISOString().split("T")[0],
          });
        }
      }
    }

    // Vaccine delays
    const pendingVaccines = localVaccines.filter(vr => vr.childId === c.id && vr.status === "delayed");
    pendingVaccines.forEach(pv => {
      const vDetail = pv.details;
      if (vDetail) {
        localAlerts.push({
          id: `alert_local_v_${pv.id}`,
          childId: c.id,
          childName: c.name,
          type: "vaccine",
          severity: "medium",
          message: `Vacuna retrasada detectada: ${vDetail.name} (${vDetail.dose}) correspondiente a los ${vDetail.targetAgeMonths} meses de edad. Esquema incompleto.`,
          resolved: false,
          dateCreated: new Date().toISOString().split("T")[0],
        });
      }
    });

    // Milestones delay
    const delays = localMilestones.filter(m => m.childId === c.id && m.status === "delay");
    delays.forEach(d => {
      localAlerts.push({
        id: `alert_local_m_${d.id}`,
        childId: c.id,
        childName: c.name,
        type: "risk",
        severity: "medium",
        message: `Rezago psicomotor detectado en categoría [${d.pnpCategory}] a los ${d.ageGroupMonths} meses: "${d.milestoneText}". Requiere estimulación temprana.`,
        resolved: false,
        dateCreated: new Date().toISOString().split("T")[0],
      });
    });
  });

  localStorage.setItem("local_alerts", JSON.stringify(localAlerts));
}
