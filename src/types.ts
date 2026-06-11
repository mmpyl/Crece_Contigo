export interface User {
  id: string;
  email: string;
  name: string;
  role: "parent" | "nurse";
  phone?: string;
}

export interface Child {
  id: string;
  parentId: string;
  name: string;
  birthDate: string;
  gender: "Masculino" | "Femenino";
  bloodType: string;
  birthWeightKg: number;
  birthHeightCm: number;
  gestionalAgeWeeks: number;
  photoUrl?: string;
}

export interface GrowthLog {
  id: string;
  childId: string;
  date: string;
  weightKg: number;
  heightCm: number;
  headCircumferenceCm?: number;
  weightZ: number;
  heightZ: number;
  weightStatus: string;
  heightStatus: string;
  registeredBy: string;
}

export interface VaccineDetails {
  id: string;
  name: string;
  dose: string;
  targetAgeMonths: number;
  diseaseTargeted: string;
}

export interface VaccineRecord {
  id: string;
  childId: string;
  vaccineId: string;
  status: "applied" | "pending" | "delayed";
  dateApplied?: string;
  nurseId?: string;
  nurseName?: string;
  details?: VaccineDetails;
}

export interface HealthAlert {
  id: string;
  childId: string;
  childName: string;
  type: "growth" | "vaccine" | "risk";
  severity: "high" | "medium" | "low";
  message: string;
  resolved: boolean;
  dateCreated: string;
}

export interface Milestone {
  id: string;
  childId: string;
  ageGroupMonths: number;
  milestoneText: string;
  pnpCategory: "Motor" | "Lenguaje" | "Cognitivo" | "Social";
  status: "achieved" | "delay" | "not_yet";
}

export interface GrowthCurvePoint {
  months: number;
  medianWeight: number;
  sdMin2Weight: number;
  sdMin3Weight: number;
  sdPlus2Weight: number;
  medianHeight: number;
  sdMin2Height: number;
  sdMin3Height: number;
  sdPlus2Height: number;
}
