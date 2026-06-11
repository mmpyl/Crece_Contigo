/**
 * WHO Child Growth Standards (0 - 24 months)
 * This utility calculates standard Z-scores for height and weight in infants.
 */

interface GrowthReference {
  months: number;
  weightMedian: number;
  weightSD: number; // Standard deviation for weight
  heightMedian: number;
  heightSD: number; // Standard deviation for height
}

// WHO standard estimations for boys and girls
const BOY_STANDARDS: GrowthReference[] = [
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

const GIRL_STANDARDS: GrowthReference[] = [
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

/**
 * Linearly interpolates between two reference values
 */
function interpolate(
  ageMonths: number,
  standards: GrowthReference[]
): { weightMedian: number; weightSD: number; heightMedian: number; heightSD: number } {
  // Edge cases
  if (ageMonths <= standards[0].months) {
    return standards[0];
  }
  if (ageMonths >= standards[standards.length - 1].months) {
    return standards[standards.length - 1];
  }

  // Find surrounding interval
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

export interface ZScoreResult {
  weightZ: number;
  heightZ: number;
  weightStatus: "Desnutrición Severa" | "Bajo Peso" | "Normal" | "Sobrepeso" | "Obesidad";
  heightStatus: "Talla Muy Baja" | "Talla Baja" | "Normal" | "Alto";
}

export function calculateZScores(
  birthDateStr: string,
  gender: "Masculino" | "Femenino" | "boy" | "girl",
  weightKg: number,
  heightCm: number
): ZScoreResult {
  // Compute age in decimal months
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birthDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const ageMonths = diffDays / 30.4375; // average days in month

  const standards = (gender === "Masculino" || gender === "boy") ? BOY_STANDARDS : GIRL_STANDARDS;
  const { weightMedian, weightSD, heightMedian, heightSD } = interpolate(ageMonths, standards);

  const weightZ = (weightKg - weightMedian) / weightSD;
  const heightZ = (heightCm - heightMedian) / heightSD;

  // Status mapping based on WHO Guidelines
  let weightStatus: ZScoreResult["weightStatus"] = "Normal";
  if (weightZ < -3) weightStatus = "Desnutrición Severa";
  else if (weightZ < -2) weightStatus = "Bajo Peso";
  else if (weightZ > 2) weightStatus = "Obesidad";
  else if (weightZ > 1) weightStatus = "Sobrepeso";

  let heightStatus: ZScoreResult["heightStatus"] = "Normal";
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

/**
 * Gets the standard curve guidelines for boys/girls to render in charts (0-24m)
 */
export function getGrowthCurves(gender: "Masculino" | "Femenino" | "boy" | "girl") {
  const standards = (gender === "Masculino" || gender === "boy") ? BOY_STANDARDS : GIRL_STANDARDS;
  return standards.map(s => ({
    months: s.months,
    medianWeight: s.weightMedian,
    sdMin2Weight: s.weightMedian - 2 * s.weightSD, // Lower bounds (Underweight)
    sdMin3Weight: s.weightMedian - 3 * s.weightSD, // Critical desnutrición
    sdPlus2Weight: s.weightMedian + 2 * s.weightSD, // Obesity
    medianHeight: s.heightMedian,
    sdMin2Height: s.heightMedian - 2 * s.heightSD, // Talla baja
    sdMin3Height: s.heightMedian - 3 * s.heightSD, 
    sdPlus2Height: s.heightMedian + 2 * s.heightSD, // Tall child
  }));
}
