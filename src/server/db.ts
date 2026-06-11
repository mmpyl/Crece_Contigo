import { calculateZScores } from "./who.ts";

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
  birthDate: string; // ISO yyyy-mm-dd
  gender: "Masculino" | "Femenino";
  bloodType: "O+" | "O-" | "A+" | "A-" | "B+" | "AB+";
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
  registeredBy: string; // "María Flores" or "Enfermero Carlos"
}

export interface Vaccine {
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
  ageGroupMonths: 2 | 4 | 6 | 9 | 12 | 18 | 24;
  milestoneText: string;
  pnpCategory: "Motor" | "Lenguaje" | "Cognitivo" | "Social";
  status: "achieved" | "delay" | "not_yet";
}

// Global In-Memory Store
export class GrowthDatabase {
  users: User[] = [];
  children: Child[] = [];
  growthLogs: GrowthLog[] = [];
  vaccines: Vaccine[] = [];
  vaccineRecords: VaccineRecord[] = [];
  alerts: HealthAlert[] = [];
  milestones: Milestone[] = [];

  constructor() {
    this.seedData();
  }

  private seedData() {
    // 1. Users
    this.users = [
      { id: "parent_1", email: "maria@ejemplo.com", name: "María Flores Quispe", role: "parent", phone: "+51 987 654 321" },
      { id: "parent_2", email: "juan@ejemplo.com", name: "Juan Mamani Condori", role: "parent", phone: "+51 912 345 678" },
      { id: "nurse_1", email: "carlos@crececontigo.gob.pe", name: "Lic. Carlos Segura Prado", role: "nurse" },
    ];

    // Helper to calculate births relative to 2026-06-11
    // 2026-06-11 - 4 months => ~ Feb 2026
    // 2026-06-11 - 18 months => ~ Dec 2024
    // 2026-06-11 - 2 months => ~ Apr 2026

    // 2. Children
    this.children = [
       {
         id: "child_1",
         parentId: "parent_1",
         name: "Liam Quispe Flores",
         birthDate: "2026-02-10", // 4 Months old today
         gender: "Masculino",
         bloodType: "O+",
         birthWeightKg: 3.2,
         birthHeightCm: 50.0,
         gestionalAgeWeeks: 39,
         photoUrl: "https://images.unsplash.com/photo-1519689680058-324335c77ebd?q=80&w=200&auto=format&fit=crop",
       },
       {
         id: "child_2",
         parentId: "parent_1",
         name: "Valentina Flores Quispe",
         birthDate: "2024-12-10", // 18 Months old today
         gender: "Femenino",
         bloodType: "A+",
         birthWeightKg: 2.9,
         birthHeightCm: 48.5,
         gestionalAgeWeeks: 38,
         photoUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=200&auto=format&fit=crop",
       },
       {
         id: "child_3",
         parentId: "parent_2",
         name: "Mateo Mamani Condori",
         birthDate: "2026-04-12", // 2 Months old today
         gender: "Masculino",
         bloodType: "O+",
         birthWeightKg: 3.4,
         birthHeightCm: 51.0,
         gestionalAgeWeeks: 40,
         photoUrl: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=200&auto=format&fit=crop",
       }
     ];

    // 3. Peruvian MINSA Official Immunization Schedule Vaccines Definition
    this.vaccines = [
      // Al nacer
      { id: "v_bcg", name: "BCG", dose: "Dosis Única", targetAgeMonths: 0, diseaseTargeted: "Tuberculosis Meníngea" },
      { id: "v_hvb", name: "HvB", dose: "Dosis Única", targetAgeMonths: 0, diseaseTargeted: "Hepatitis B" },
      // 2 meses
      { id: "v_penta_1", name: "Pentavalente (1ra)", dose: "1ra Dosis", targetAgeMonths: 2, diseaseTargeted: "Difteria, Tétanos, Tos Convulsiva, Hepatitis B, Hemophilus Influenza B" },
      { id: "v_polio_1", name: "Polio IPV (1ra)", dose: "1ra Dosis", targetAgeMonths: 2, diseaseTargeted: "Poliomielitis" },
      { id: "v_rota_1", name: "Rotavirus (1ra)", dose: "1ra Dosis", targetAgeMonths: 2, diseaseTargeted: "Diarreas severas por Rotavirus" },
      { id: "v_neumo_1", name: "Neumococo (1ra)", dose: "1ra Dosis", targetAgeMonths: 2, diseaseTargeted: "Neumonía, Meningitis, Otitis" },
      // 4 meses
      { id: "v_penta_2", name: "Pentavalente (2da)", dose: "2da Dosis", targetAgeMonths: 4, diseaseTargeted: "Difteria, Tétanos, Tos Convulsiva, Hepatitis B, Hib" },
      { id: "v_polio_2", name: "Polio IPV (2da)", dose: "2da Dosis", targetAgeMonths: 4, diseaseTargeted: "Poliomielitis" },
      { id: "v_rota_2", name: "Rotavirus (2da)", dose: "2da Dosis", targetAgeMonths: 4, diseaseTargeted: "Diarreas por Rotavirus" },
      { id: "v_neumo_2", name: "Neumococo (2da)", dose: "2da Dosis", targetAgeMonths: 4, diseaseTargeted: "Neumonía, Meningitis, Otitis" },
      // 6 meses
      { id: "v_penta_3", name: "Pentavalente (3ra)", dose: "3ra Dosis", targetAgeMonths: 6, diseaseTargeted: "Difteria, Tétanos, Tos Convulsiva, Hepatitis B, Hib" },
      { id: "v_polio_3", name: "Polio APO (3ra)", dose: "3ra Dosis", targetAgeMonths: 6, diseaseTargeted: "Poliomielitis" },
      { id: "v_inf_1", name: "Influenza Pediátrica (1ra)", dose: "1ra Dosis", targetAgeMonths: 6, diseaseTargeted: "Influenza Estacional" },
      // 12 meses
      { id: "v_spr_1", name: "SPR (1ra)", dose: "1ra Dosis", targetAgeMonths: 12, diseaseTargeted: "Sarampión, Papera, Rubéola" },
      { id: "v_neumo_3", name: "Neumococo (3ra)", dose: "3ra Dosis", targetAgeMonths: 12, diseaseTargeted: "Neumonía, Meningitis, Otitis" },
      { id: "v_var_1", name: "Varicela", dose: "Dosis Única", targetAgeMonths: 12, diseaseTargeted: "Varicela" },
      // 15 meses
      { id: "v_ama_1", name: "Antiamarílica (AMA)", dose: "Dosis Única", targetAgeMonths: 15, diseaseTargeted: "Fiebre Amarilla" },
      // 18 meses
      { id: "v_dpt_ref1", name: "DPT Refuerzo (1er)", dose: "1er Refuerzo", targetAgeMonths: 18, diseaseTargeted: "Difteria, Tétanos, Tos Convulsiva" },
      { id: "v_polio_ref1", name: "Polio APO Refuerzo (1er)", dose: "1er Refuerzo", targetAgeMonths: 18, diseaseTargeted: "Poliomielitis" },
      { id: "v_spr_2", name: "SPR (2da)", dose: "2da Dosis", targetAgeMonths: 18, diseaseTargeted: "Sarampión, Papera, Rubéola" },
    ];

    // 4. Seeding Growth Logs with realistic historic timelines
    // Liam (4m old): born Feb 10, 2026. Logs at 0m, 2m, 4m. Healthy normal boy.
    this.growthLogs.push(
      this.createGrowthLogDirect("child_1", "2026-02-10", 3.2, 50.0, 34.0, "Enfermero Carlos"),
      this.createGrowthLogDirect("child_1", "2026-04-11", 5.7, 58.6, 38.0, "Enfermero Carlos"),
      this.createGrowthLogDirect("child_1", "2026-06-10", 7.1, 64.1, 41.2, "María Flores") // logged by parent yesterday
    );

    // Valentina (18m old): born Dec 10, 2024. Excellent normal logs, but sudden weight drop recently.
    this.growthLogs.push(
      this.createGrowthLogDirect("child_2", "2024-12-10", 2.9, 48.5, 33.0, "Enfermero Carlos"),
      this.createGrowthLogDirect("child_2", "2025-06-12", 7.4, 65.8, 41.5, "Enfermero Carlos"),
      this.createGrowthLogDirect("child_2", "2025-12-11", 9.0, 74.2, 44.5, "Enfermero Carlos"),
      this.createGrowthLogDirect("child_2", "2026-03-10", 9.8, 79.5, 45.8, "María Flores"),
      // Sudden WEIGHT DROP in June 2026 (18m) to 8.8kg (WHO Median is 10.2kg, SD is 1.0, so 8.8kg puts Z-score < -2.0 -> Underweight risk!)
      this.createGrowthLogDirect("child_2", "2026-06-08", 8.8, 80.8, 46.0, "María Flores")
    );

    // Mateo (2m old): born Apr 12, 2026. Log at birth and 2 months.
    this.growthLogs.push(
      this.createGrowthLogDirect("child_3", "2026-04-12", 3.4, 51.0, 34.5, "Enfermero Carlos"),
      this.createGrowthLogDirect("child_3", "2026-06-10", 5.5, 58.1, 37.8, "Enfermero Carlos")
    );

    // 5. Seeding Immunization Records relative to children ages
    // Liam (4m old): has al nacer and 2m vaccines applied. 4m is pending.
    this.applyImplicitVaccines("child_1", [0, 2]);
    this.pendImplicitVaccines("child_1", [4, 6, 12, 15, 18]);

    // Valentina (18m old): has vaccines up to 12m. Standard SPR 1ra is applied, but var 1ra is missing (pending/delayed), and 15m/18m are pending.
    this.applyImplicitVaccines("child_2", [0, 2, 4, 6]);
    this.applyVaccineDirect("child_2", "v_spr_1", "applied", "2025-12-15", "nurse_1", "Lic. Carlos Segura");
    this.applyVaccineDirect("child_2", "v_neumo_3", "applied", "2025-12-15", "nurse_1", "Lic. Carlos Segura");
    this.applyVaccineDirect("child_2", "v_var_1", "delayed", undefined, undefined, undefined); // Flag delayed
    this.applyVaccineDirect("child_2", "v_ama_1", "pending");
    this.applyVaccineDirect("child_2", "v_dpt_ref1", "pending");
    this.applyVaccineDirect("child_2", "v_polio_ref1", "pending");
    this.applyVaccineDirect("child_2", "v_spr_2", "pending");

    // Mateo (2m old): has birth vaccines. 2m vaccines are pending.
    this.applyImplicitVaccines("child_3", [0]);
    this.pendImplicitVaccines("child_3", [2, 4, 6]);

    // 6. Child Milestones
    // Liam (4m): Achievements for 2m and 4m
    this.milestones.push(
      { id: "m1", childId: "child_1", ageGroupMonths: 2, milestoneText: "Sonrisa social amplia", pnpCategory: "Social", status: "achieved" },
      { id: "m2", childId: "child_1", ageGroupMonths: 2, milestoneText: "Sostiene la cabeza por momentos en prono", pnpCategory: "Motor", status: "achieved" },
      { id: "m3", childId: "child_1", ageGroupMonths: 4, milestoneText: "Suma gorgojeos y balbuceos", pnpCategory: "Lenguaje", status: "achieved" },
      { id: "m4", childId: "child_1", ageGroupMonths: 4, milestoneText: "Intenta agarrar juguetes llamativos", pnpCategory: "Cognitivo", status: "achieved" }
    );

    // Valentina (18m)
    this.milestones.push(
      { id: "m5", childId: "child_2", ageGroupMonths: 9, milestoneText: "Se sienta solo sin apoyo", pnpCategory: "Motor", status: "achieved" },
      { id: "m6", childId: "child_2", ageGroupMonths: 12, milestoneText: "Camina con ayuda o de la mano", pnpCategory: "Motor", status: "achieved" },
      { id: "m7", childId: "child_2", ageGroupMonths: 18, milestoneText: "Dice de 5 a 10 palabras claras (rezago detectado)", pnpCategory: "Lenguaje", status: "delay" },
      { id: "m8", childId: "child_2", ageGroupMonths: 18, milestoneText: "Camina solo con estabilidad amplia", pnpCategory: "Motor", status: "achieved" }
    );

    // 7. System alerts calculated from status
    this.retriggerSystemAlerts();
  }

  // Purely private setup helpers
  private createGrowthLogDirect(
    childId: string,
    date: string,
    weightKg: number,
    heightCm: number,
    headCirc?: number,
    registeredBy = "Sistema"
  ): GrowthLog {
    const child = this.children.find(c => c.id === childId);
    if (!child) throw new Error("Child not found");
    const z = calculateZScores(child.birthDate, child.gender, weightKg, heightCm);
    return {
      id: "log_" + Math.random().toString(36).substr(2, 9),
      childId,
      date,
      weightKg,
      heightCm,
      headCircumferenceCm: headCirc,
      weightZ: z.weightZ,
      heightZ: z.heightZ,
      weightStatus: z.weightStatus,
      heightStatus: z.heightStatus,
      registeredBy,
    };
  }

  private applyVaccineDirect(
    childId: string,
    vaccineId: string,
    status: "applied" | "pending" | "delayed",
    dateApplied?: string,
    nurseId?: string,
    nurseName?: string
  ) {
    this.vaccineRecords.push({
      id: "vr_" + Math.random().toString(36).substr(2, 9),
      childId,
      vaccineId,
      status,
      dateApplied,
      nurseId,
      nurseName,
    });
  }

  private applyImplicitVaccines(childId: string, targetAges: number[]) {
    const matchedVaccines = this.vaccines.filter(v => targetAges.includes(v.targetAgeMonths));
    const child = this.children.find(c => c.id === childId);
    if (!child) return;
    
    // Set approximate date matching ages
    matchedVaccines.forEach(v => {
      const bDate = new Date(child.birthDate);
      bDate.setMonth(bDate.getMonth() + v.targetAgeMonths);
      const formattedDate = bDate.toISOString().split("T")[0];
      this.applyVaccineDirect(childId, v.id, "applied", formattedDate, "nurse_1", "Lic. Carlos Segura");
    });
  }

  private pendImplicitVaccines(childId: string, targetAges: number[]) {
    const matchedVaccines = this.vaccines.filter(v => targetAges.includes(v.targetAgeMonths));
    matchedVaccines.forEach(v => {
      this.applyVaccineDirect(childId, v.id, "pending");
    });
  }

  /**
   * Scans growth records, milestones, and vaccines to refresh clinical alerts.
   * Demonstrates proactive AI/expert system detection!
   */
  public retriggerSystemAlerts() {
    this.alerts = []; // Reset and rebuild alert states dynamically

    this.children.forEach(c => {
      const childLogs = this.growthLogs
        .filter(l => l.childId === c.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (childLogs.length > 0) {
        const latest = childLogs[childLogs.length - 1];

        // 1. Growth risk: Acute malnutrition / low weight
        if (latest.weightStatus === "Desnutrición Severa" || latest.weightZ < -3) {
          this.alerts.push({
            id: `alert_g1_${c.id}`,
            childId: c.id,
            childName: c.name,
            type: "growth",
            severity: "high",
            message: `Desnutrición aguda severa detectada (Z-Score de Peso: ${latest.weightZ}). Se requiere intervención CRED inmediata.`,
            resolved: false,
            dateCreated: new Date().toISOString().split("T")[0],
          });
        } else if (latest.weightStatus === "Bajo Peso" || latest.weightZ < -2) {
          this.alerts.push({
            id: `alert_g2_${c.id}`,
            childId: c.id,
            childName: c.name,
            type: "growth",
            severity: "high",
            message: `Riesgo elevado de Desnutrición Crónica Infantil (DCI). Peso actual de ${latest.weightKg}kg está por debajo del estándar OMS (Z-Score ${latest.weightZ}).`,
            resolved: false,
            dateCreated: new Date().toISOString().split("T")[0],
          });
        }

        // 2. Trend analytical alert: sudden drop even if weight status is semi-normal
        if (childLogs.length >= 2) {
          const prev = childLogs[childLogs.length - 2];
          const drop = prev.weightKg - latest.weightKg;
          if (drop > 0.4) {
            this.alerts.push({
              id: `alert_t1_${c.id}`,
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

      // 3. Vaccine delay detection
      const pendingVaccines = this.vaccineRecords.filter(vr => vr.childId === c.id && vr.status === "delayed");
      if (pendingVaccines.length > 0) {
        pendingVaccines.forEach(pv => {
          const vDetail = this.vaccines.find(v => v.id === pv.vaccineId);
          if (vDetail) {
            this.alerts.push({
              id: `alert_v_${pv.id}`,
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
      }

      // 4. Milestone delay detection
      const delays = this.milestones.filter(m => m.childId === c.id && m.status === "delay");
      delays.forEach(d => {
        this.alerts.push({
          id: `alert_m_${d.id}`,
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
  }

  // CRUD child growth
  public logGrowth(childId: string, date: string, weightKg: number, heightCm: number, headCirc?: number, registeredBy = "Sistema"): GrowthLog {
    const newLog = this.createGrowthLogDirect(childId, date, weightKg, heightCm, headCirc, registeredBy);
    this.growthLogs.push(newLog);
    this.retriggerSystemAlerts();
    return newLog;
  }

  // Record a vaccine application
  public updateVaccineStatus(childId: string, recordId: string, status: "applied" | "pending" | "delayed", dateApplied?: string, nurseId?: string, nurseName?: string) {
    const rec = this.vaccineRecords.find(vr => vr.id === recordId && vr.childId === childId);
    if (rec) {
      rec.status = status;
      if (status === "applied") {
        rec.dateApplied = dateApplied || new Date().toISOString().split("T")[0];
        rec.nurseId = nurseId || "nurse_1";
        rec.nurseName = nurseName || "Lic. Carlos Segura";
      } else {
        rec.dateApplied = undefined;
        rec.nurseId = undefined;
        rec.nurseName = undefined;
      }
      this.retriggerSystemAlerts();
      return rec;
    }
    throw new Error("Vaccine record not found");
  }

  public registerMilestone(childId: string, ageGroupMonths: Milestone["ageGroupMonths"], milestoneText: string, category: Milestone["pnpCategory"], status: Milestone["status"]): Milestone {
    const newM: Milestone = {
      id: "m_" + Math.random().toString(36).substr(2, 9),
      childId,
      ageGroupMonths,
      milestoneText,
      pnpCategory: category,
      status,
    };
    this.milestones.push(newM);
    this.retriggerSystemAlerts();
    return newM;
  }

  public updateMilestoneStatus(milestoneId: string, status: Milestone["status"]) {
    const m = this.milestones.find(x => x.id === milestoneId);
    if (m) {
      m.status = status;
      this.retriggerSystemAlerts();
      return m;
    }
    throw new Error("Milestone not found");
  }

  public resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return alert;
    }
    throw new Error("Alert not found");
  }
}

// Export single instance
export const DB = new GrowthDatabase();
export default DB;
