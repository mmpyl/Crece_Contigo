import React, { useState, useEffect } from "react";
import {
  Baby,
  Activity,
  Calendar,
  Syringe,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Stethoscope,
  LogOut,
  MapPin,
  TrendingDown,
  GraduationCap,
  Sparkles,
  Brain,
  RefreshCw,
  FileSpreadsheet,
  Heart,
  Scale,
  Smile,
  ShieldCheck,
  User,
  PlusCircle,
  TrendingUp,
  X,
  BadgeInfo
} from "lucide-react";

import { Child, GrowthLog, VaccineRecord, HealthAlert, Milestone, GrowthCurvePoint } from "./types";
import GrowthChart from "./components/GrowthChart";
import TriageChat from "./components/TriageChat";
import VisionTallimetro from "./components/VisionTallimetro";
import EscuelaPadres from "./components/EscuelaPadres";

export default function App() {
  // Session Roles Simulators
  const [currentUser, setCurrentUser] = useState({
    id: "parent_1",
    email: "maria@ejemplo.com",
    name: "María Flores Quispe",
    role: "parent" as "parent" | "nurse",
  });

  // State Management
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [childDetails, setChildDetails] = useState<{
    child: Child;
    growthLogs: GrowthLog[];
    vaccineRecords: VaccineRecord[];
    milestones: Milestone[];
    growthCurves: GrowthCurvePoint[];
  } | null>(null);

  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "chart" | "vaccines" | "triage" | "vision" | "escuela">("dashboard");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [loadingAiAnalysis, setLoadingAiAnalysis] = useState(false);

  // Modals Controls
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showAddControlModal, setShowAddControlModal] = useState(false);
  const [showVaccinateModal, setShowVaccinateModal] = useState(false);

  // Form states
  const [newChildForm, setNewChildForm] = useState({
    name: "",
    birthDate: "",
    gender: "Masculino" as "Masculino" | "Femenino",
    bloodType: "O+",
    birthWeightKg: "",
    birthHeightCm: "",
    gestionalAgeWeeks: "39",
    photoUrl: "",
  });

  const [newControlForm, setNewControlForm] = useState({
    date: new Date().toISOString().split("T")[0],
    weightKg: "",
    heightCm: "",
    headCircumferenceCm: "",
  });

  const [vaccineToApply, setVaccineToApply] = useState<VaccineRecord | null>(null);
  const [vaccineDate, setVaccineDate] = useState(new Date().toISOString().split("T")[0]);
  const [nurseSignature, setNurseSignature] = useState("Lic. Carlos Segura");

  // Fetch initial system elements
  useEffect(() => {
    fetchSystemData();
  }, [currentUser]);

  // Read children detailed metrics when selection changes
  useEffect(() => {
    if (selectedChildId) {
      fetchChildDetail(selectedChildId);
    } else {
      setChildDetails(null);
    }
  }, [selectedChildId]);

  const fetchSystemData = async () => {
    try {
      // 1. Fetch Children matching roles
      const cRes = await fetch("/api/v1/children", {
        headers: {
          "X-User-Role": currentUser.role,
          "X-User-Id": currentUser.id,
        },
      });
      if (cRes.ok) {
        const childrenData = await cRes.json();
        if (Array.isArray(childrenData)) {
          setChildren(childrenData);
          if (childrenData.length > 0) {
            // Auto-select first baby
            setSelectedChildId(childrenData[0].id);
          } else {
            setSelectedChildId("");
          }
        } else {
          console.error("Los datos de niños devueltos no son un arreglo:", childrenData);
          setChildren([]);
        }
      } else {
        console.error("Error al obtener niños del servidor:", cRes.status);
        setChildren([]);
      }

      // 2. Fetch Active Health Alerts
      const aRes = await fetch("/api/v1/alerts");
      if (aRes.ok) {
        const alertsData = await aRes.json();
        if (Array.isArray(alertsData)) {
          setAlerts(alertsData);
        } else {
          console.error("Las alertas devueltas no son un arreglo:", alertsData);
          setAlerts([]);
        }
      } else {
        console.error("Error al obtener alertas del servidor:", aRes.status);
        setAlerts([]);
      }
    } catch (err) {
      console.error("Fallo al sincronizar datos del servidor:", err);
      setChildren([]);
      setAlerts([]);
    }
  };

  const fetchChildDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/children/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.child && Array.isArray(data.growthLogs) && Array.isArray(data.vaccineRecords)) {
          setChildDetails(data);
          setAiAnalysis(""); // Reset AI text across child focus
        } else {
          console.error("Ficha detallada del niño tiene un formato inválido:", data);
        }
      } else {
        console.error("Error al obtener detalles del niño:", res.status);
      }
    } catch (err) {
      console.error("Fallo al leer ficha detallada:", err);
    }
  };

  const handleRoleToggle = (role: "parent" | "nurse") => {
    if (role === "parent") {
      setCurrentUser({
        id: "parent_1",
        email: "maria@ejemplo.com",
        name: "María Flores Quispe",
        role: "parent",
      });
    } else {
      setCurrentUser({
        id: "nurse_1",
        email: "carlos@crececontigo.gob.pe",
        name: "Lic. Carlos Segura Prado",
        role: "nurse",
      });
    }
    setActiveTab("dashboard");
    setChildDetails(null);
  };

  // Create child
  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newChildForm,
          parentId: currentUser.role === "parent" ? currentUser.id : "parent_1", // link default
        }),
      });
      if (res.ok) {
        const baby = await res.json();
        setShowAddChildModal(false);
        // Refresh
        await fetchSystemData();
        setSelectedChildId(baby.id);
        // Reset sheet
        setNewChildForm({
          name: "",
          birthDate: "",
          gender: "Masculino",
          bloodType: "O+",
          birthWeightKg: "",
          birthHeightCm: "",
          gestionalAgeWeeks: "39",
          photoUrl: "",
        });
      } else {
        const data = await res.json();
        alert(`Error al registrar perfil: ${data.error}`);
      }
    } catch (err) {
      alert("Error de red.");
    }
  };

  // Submit Growth log check
  const handleCreateControl = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/growth/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: selectedChildId,
          ...newControlForm,
          registeredBy: currentUser.name,
        }),
      });

      if (res.ok) {
        setShowAddControlModal(false);
        // Refresh details, list alerts
        await fetchChildDetail(selectedChildId);
        // Sync general section
        const aRes = await fetch("/api/v1/alerts");
        const alertsData = await aRes.json();
        setAlerts(alertsData);

        // Reset
        setNewControlForm({
          date: new Date().toISOString().split("T")[0],
          weightKg: "",
          heightCm: "",
          headCircumferenceCm: "",
        });
      } else {
        const errorData = await res.json();
        alert("Fallo el registro biométrico: " + errorData.error);
      }
    } catch (err) {
      alert("Error de red registrando control.");
    }
  };

  // Open vaccine application modal
  const openVaccinateModal = (rec: VaccineRecord) => {
    setVaccineToApply(rec);
    setVaccineDate(new Date().toISOString().split("T")[0]);
    setShowVaccinateModal(true);
  };

  const handleUpdateVaccine = async (status: "applied" | "delayed") => {
    if (!vaccineToApply || !selectedChildId) return;

    try {
      const res = await fetch("/api/v1/vaccines/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: selectedChildId,
          recordId: vaccineToApply.id,
          status,
          dateApplied: status === "applied" ? vaccineDate : undefined,
          nurseName: status === "applied" ? nurseSignature : undefined,
        }),
      });

      if (res.ok) {
        setShowVaccinateModal(false);
        setVaccineToApply(null);
        await fetchChildDetail(selectedChildId);
        // Sync alerts
        const aRes = await fetch("/api/v1/alerts");
        const alertsData = await aRes.json();
        setAlerts(alertsData);
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert("Fallo de red al vacunar.");
    }
  };

  // AI-powered growth projections clinical run
  const handleGenerateAiAnalysis = async () => {
    if (!selectedChildId) return;
    setLoadingAiAnalysis(true);
    setAiAnalysis("");

    try {
      const response = await fetch("/api/v1/ai/growth-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: selectedChildId }),
      });
      const data = await response.json();
      if (response.ok) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis(`❌ Falló la generación del informe de IA: ${data.error}`);
      }
    } catch (err) {
      setAiAnalysis("❌ Error de red comunicando con el ecosistema de IA.");
    } finally {
      setLoadingAiAnalysis(false);
    }
  };

  // Resolve nurse alert
  const handleResolveAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/alerts/${id}/resolve`, {
        method: "POST",
      });
      if (res.ok) {
        // Redraw alerts
        const aRes = await fetch("/api/v1/alerts");
        const alertsData = await aRes.json();
        setAlerts(alertsData);
      }
    } catch (err) {
      console.error("Fallo al archivar alerta:", err);
    }
  };

  // Metrics calculators
  const vaccineCoveragePercentage = () => {
    if (!childDetails || childDetails.vaccineRecords.length === 0) return 0;
    const applied = childDetails.vaccineRecords.filter(v => v.status === "applied").length;
    return Math.round((applied / childDetails.vaccineRecords.length) * 100);
  };

  const getChildSeverityClass = (childId: string) => {
    const childAlerts = alerts.filter(a => a.childId === childId && !a.resolved);
    if (childAlerts.some(a => a.severity === "high")) return "border-red-200 bg-red-50/50";
    if (childAlerts.some(a => a.severity === "medium")) return "border-amber-200 bg-amber-50/50";
    return "border-slate-100 bg-white";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none pb-12">
      {/* Upper Navigation Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-indigo-50 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-150">
              C
            </div>
            <div>
              <h1 id="app-title" className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                Crece Contigo <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Ecosistema CRED</span>
              </h1>
              <p className="text-[11px] text-slate-400">Plataforma Inteligente de Monitoreo Pediátrico Infantil (OMS/MINSA)</p>
            </div>
          </div>

          {/* Quick Sandbox Session Switcher */}
          <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => handleRoleToggle("parent")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentUser.role === "parent"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-150"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              Vista Madre (María Flores)
            </button>
            <button
              onClick={() => handleRoleToggle("nurse")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentUser.role === "nurse"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-150"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Vista Enfermero (Lic. Carlos Segura)
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left Side: Children sidebar list & Alerts feed */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          {/* Active Infant Profiles */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Baby className="w-4 h-4 text-indigo-500" />
                Pacientes / Niños
              </h3>
              
              <button
                onClick={() => setShowAddChildModal(true)}
                className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all font-semibold flex items-center gap-1 text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Registrar Niño
              </button>
            </div>

            {/* List with styled cards */}
            <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
              {Array.isArray(children) && children.map((c) => {
                const isSelected = c.id === selectedChildId;
                const healthClass = getChildSeverityClass(c.id);

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChildId(c.id)}
                    className={`text-left w-full p-4 border rounded-2xl transition-all cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? "border-2 border-indigo-500 shadow-xs bg-indigo-50/15"
                        : `border-slate-100 hover:border-indigo-200 ${healthClass}`
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${
                      c.gender === "Masculino" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"
                    }`}>
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <Baby className="w-5 h-5 shrink-0" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{c.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 flex justify-between">
                        <span>F.Nac: {c.birthDate}</span>
                        <span className="font-semibold text-slate-500">{c.gender}</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clinical Alerts Dashboard for the active child/sector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex-1 flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Notificaciones y Alarmas Clínicas
            </h3>

            <div className="space-y-3 overflow-y-auto flex-1 max-h-[300px]">
              {!Array.isArray(alerts) || alerts.filter(a => !a.resolved && (currentUser.role === "nurse" || a.childId === selectedChildId)).length === 0 ? (
                <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center items-center h-full">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-xs font-semibold text-slate-500">Ninguna condición de alarma detectada</p>
                  <p className="text-[10px] text-slate-400 mt-1">El estado médico y dosis de inmunización se encuentran en regla.</p>
                </div>
              ) : (
                alerts
                  .filter(a => !a.resolved && (currentUser.role === "nurse" || a.childId === selectedChildId))
                  .map((a) => (
                    <div
                      key={a.id}
                      className={`p-3.5 border rounded-xl flex flex-col gap-2 ${
                        a.severity === "high"
                          ? "border-red-200 bg-red-50 text-red-900"
                          : "border-amber-200 bg-amber-50 text-amber-900"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${a.severity === "high" ? "bg-red-500" : "bg-amber-500"}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {a.type === "growth" ? "Nutricional Z-Score" : a.type === "vaccine" ? "Esquema Overdue" : "Desarrollo"}
                          </span>
                        </div>

                        {currentUser.role === "nurse" && (
                          <button
                            onClick={() => handleResolveAlert(a.id)}
                            className="text-[10px] font-extrabold text-indigo-600 bg-white hover:bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5 cursor-pointer transition-all uppercase"
                          >
                            Atender / Resolver
                          </button>
                        )}
                      </div>

                      <p className="text-xs font-bold leading-relaxed">{a.message}</p>
                      <span className="text-[10px] text-slate-400 flex justify-between">
                        <span>Paciente: {a.childName}</span>
                        <span>Registrado: {a.dateCreated}</span>
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </section>

        {/* Right Side: Tab Workspaces */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Active Infant Profile header */}
          {childDetails ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center ${
                  childDetails.child.gender === "Masculino" ? "bg-blue-100/50 text-blue-600" : "bg-pink-100/50 text-pink-600"
                }`}>
                  {childDetails.child.photoUrl ? (
                    <img src={childDetails.child.photoUrl} alt={childDetails.child.name} className="w-full h-full object-cover" />
                  ) : (
                    <Baby className="w-8 h-8 shrink-0" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-slate-800">{childDetails.child.name}</h2>
                    <span className="text-xs px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full font-bold">
                      Factor: {childDetails.child.bloodType}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1 font-semibold">
                    <span>Peso nacer: {childDetails.child.birthWeightKg}kg</span>
                    <span>•</span>
                    <span>Talla nacer: {childDetails.child.birthHeightCm}cm</span>
                    <span>•</span>
                    <span>Edad Gestacional: {childDetails.child.gestionalAgeWeeks} semanas</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowAddControlModal(true)}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  Agregar Control CRED
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-slate-400 italic">
              <Baby className="w-12 h-12 text-slate-300 mx-auto mb-2 animate-pulse" />
              <p>Selecciona o registra un perfil de niño para iniciar la consulta e informes de salud.</p>
            </div>
          )}

          {/* Navigation Tab Menu */}
          {childDetails && (
            <div className="flex bg-slate-200/65 p-1 rounded-2xl overflow-x-auto gap-1">
              {[
                { id: "dashboard", label: "Resumen CRED", icon: FileSpreadsheet },
                { id: "chart", label: "Gráfico Crecimiento", icon: Activity },
                { id: "vaccines", label: "Carnet Vacunas", icon: Syringe },
                { id: "triage", label: "Triaje AI Chat", icon: Stethoscope },
                { id: "vision", label: "Talla Inteligente (Visión)", icon: Sparkles },
                { id: "escuela", label: "Escuela Padres", icon: GraduationCap },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab Views content */}
          {childDetails && (
            <div className="space-y-6">
              {/* TAB: DASHBOARD RESUMEN */}
              {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nutritional Assessment Summary */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-emerald-500" />
                      Estado Nutricional Pediátrico Reciente
                    </h3>

                    {childDetails.growthLogs.length > 0 ? (() => {
                      const latest = childDetails.growthLogs[childDetails.growthLogs.length - 1];
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                              <span className="text-[10px] font-bold text-slate-400 block">PESO ACTUAL</span>
                              <span className="text-xl font-bold text-slate-800 block mt-0.5">{latest.weightKg} kg</span>
                              <span className="text-[10px] text-slate-500 block mt-1 font-medium">Z-Score: {latest.weightZ}</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                              <span className="text-[10px] font-bold text-slate-400 block">TALLA ACTUAL</span>
                              <span className="text-xl font-bold text-slate-800 block mt-0.5">{latest.heightCm} cm</span>
                              <span className="text-[10px] text-slate-500 block mt-1 font-medium">Z-Score: {latest.heightZ}</span>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl border flex items-start gap-3 bg-indigo-50/20 border-indigo-100">
                            <Brain className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-bold text-indigo-800">Evaluación del Sistema CRED</h4>
                              <p className="text-xs text-indigo-900/90 mt-1 leading-relaxed">
                                De acuerdo a los parámetros calculados para su edad y sexo, el niño presenta una clasificación de <strong className="font-extrabold">{latest.weightStatus}</strong> en Peso y <strong className="font-extrabold">{latest.heightStatus}</strong> en Talla.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })() : (
                      <p className="text-xs text-slate-400 italic">No hay registros cargados para este perfil.</p>
                    )}

                    <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5">
                      <button
                        onClick={handleGenerateAiAnalysis}
                        disabled={loadingAiAnalysis}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Brain className="w-4 h-4 animate-pulse" />
                        {loadingAiAnalysis ? "Consultando Motor de IA..." : "Generar Diagnóstico de Crecimiento Avanzado (IA)"}
                      </button>

                      {aiAnalysis && (
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-2 mt-2 leading-relaxed max-h-[300px] overflow-y-auto">
                          <h4 className="font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Informe Especializado de IA (Gemini 3.5)
                          </h4>
                          <div className="whitespace-pre-line text-slate-700">
                            {aiAnalysis.split("\n").map((line, lIdx) => {
                              if (line.startsWith("###")) {
                                return <h5 key={lIdx} className="font-bold text-slate-900 mt-2 text-[13px]">{line.replace("###", "")}</h5>;
                              }
                              return <p key={lIdx} className="mt-1">{line}</p>;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vaccines & Milestones Coverage Overview */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      <Syringe className="w-4 h-4 text-indigo-500" />
                      Inmunizaciones y Desarrollo (CDR)
                    </h3>

                    <div className="space-y-4">
                      {/* Vaccine progress meter */}
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700">Cobertura de Vacunación</span>
                          <span className="text-xs font-extrabold text-indigo-600">{vaccineCoveragePercentage()}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${vaccineCoveragePercentage()}%` }}
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          ></div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          {childDetails.vaccineRecords.filter(v => v.status === "applied").length} de {childDetails.vaccineRecords.length} dosis obligatorias del calendario aplicadas satisfactoriamente.
                        </p>
                      </div>

                      {/* Developmental tracker card */}
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Smile className="w-4 h-4 text-emerald-500" />
                          Últimos Hitos Psicometores Evaluados (CDR):
                        </h4>

                        <div className="space-y-2 max-h-[150px] overflow-y-auto">
                          {childDetails.milestones.map((m) => (
                            <div key={m.id} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-slate-100">
                              <span className="font-medium text-slate-600 truncate max-w-[70%]">
                                [{m.pnpCategory}] {m.milestoneText}
                              </span>

                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                m.status === "achieved"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}>
                                {m.status === "achieved" ? "Logrado" : "Rezago"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: GROWTH CHART */}
              {activeTab === "chart" && (
                <GrowthChart
                  logs={childDetails.growthLogs}
                  curves={childDetails.growthCurves}
                  gender={childDetails.child.gender}
                />
              )}

              {/* TAB: VACCINE DIGITAL CARD */}
              {activeTab === "vaccines" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">Carnet Digital de Vacunación (MINSA)</h3>
                      <p className="text-slate-500 text-sm">Control integral del calendario de inoculaciones recomendado</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-400 block">COBERTURA ESQUEMA</span>
                      <span className="text-xl font-extrabold text-indigo-600 block">{vaccineCoveragePercentage()}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {childDetails.vaccineRecords
                      .sort((a, b) => (a.details?.targetAgeMonths || 0) - (b.details?.targetAgeMonths || 0))
                      .map((v) => (
                        <div
                          key={v.id}
                          className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all flex justify-between items-start gap-4"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                v.status === "applied" ? "bg-emerald-100 text-emerald-800" : v.status === "delayed" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                              }`}>
                                {v.details?.targetAgeMonths === 0 ? "Al Nacer" : `${v.details?.targetAgeMonths} Meses`}
                              </span>

                              <span className="text-[10px] text-slate-400 font-medium">Dosis: {v.details?.dose}</span>
                            </div>

                            <h4 className="font-bold text-slate-800 text-xs truncate">{v.details?.name}</h4>
                            <p className="text-[10px] text-slate-500 italic line-clamp-1">Previene: {v.details?.diseaseTargeted}</p>

                            {v.status === "applied" && (
                              <div className="mt-2 text-[9px] text-slate-400 border-t border-slate-100 pt-1.5 flex flex-col gap-0.5 font-medium">
                                <span>Aplicada: {v.dateApplied}</span>
                                <span>Responsable: {v.nurseName}</span>
                              </div>
                            )}
                          </div>

                          {v.status !== "applied" ? (
                            currentUser.role === "nurse" ? (
                              <button
                                onClick={() => openVaccinateModal(v)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-all uppercase whitespace-nowrap"
                              >
                                Registrar Inoculación
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                <Clock className="w-3.5 h-3.5" /> Pendiente
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded">
                              <CheckCircle className="w-3.5 h-3.5" /> Aplicada
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB: TRIAGE CHAT */}
              {activeTab === "triage" && (
                <TriageChat childId={childDetails.child.id} />
              )}

              {/* TAB: VISION ASSISTANT */}
              {activeTab === "vision" && (
                <VisionTallimetro
                  childId={childDetails.child.id}
                  childName={childDetails.child.name}
                  onHeightEstimated={(estimatedHeight) => {
                    // Pre-fill the control form with estimated height for user convenience!
                    setNewControlForm(prev => ({
                      ...prev,
                      heightCm: estimatedHeight.toString()
                    }));
                  }}
                />
              )}

              {/* TAB: EDUCATIONAL CONTENT */}
              {activeTab === "escuela" && (
                <EscuelaPadres />
              )}
            </div>
          )}
        </section>
      </main>

      {/* ====================================
          MODALS & FORM DRAWERS
          ==================================== */}

      {/* MODAL 1: REGISTER PROFILE CHILD */}
      {showAddChildModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                <Baby className="w-5 h-5 text-indigo-600" />
                Registrar Lactante / Lactante CRED
              </h3>
              <button onClick={() => setShowAddChildModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChild} className="space-y-4 mt-4">
              {/* Photo Input (Face of the baby) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Foto del Rostro del Niño(a)</label>
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="w-20 h-20 bg-white border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center relative group shadow-2xs shrink-0">
                    {newChildForm.photoUrl ? (
                      <img src={newChildForm.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-slate-400 flex flex-col items-center">
                        <User className="w-8 h-8" />
                        <span className="text-[9px] mt-0.5">Sin foto</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/40 text-white text-[10px] items-center justify-center flex opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                      Cambiar
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewChildForm(p => ({ ...p, photoUrl: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex-1 space-y-1.5 text-center sm:text-left">
                    <label className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-2 rounded-xl cursor-pointer transition-all inline-block shadow-2xs">
                      Seleccionar Archivo de de Foto
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewChildForm(p => ({ ...p, photoUrl: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium">O elige una foto rápida de demostración:</p>
                    <div className="flex gap-2.5 justify-center sm:justify-start">
                      {[
                        { url: "https://images.unsplash.com/photo-1519689680058-324335c77ebd?q=80&w=200&auto=format&fit=crop", label: "Liam" },
                        { url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=200&auto=format&fit=crop", label: "Valentina" },
                        { url: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=200&auto=format&fit=crop", label: "Mateo" },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewChildForm(p => ({ ...p, photoUrl: item.url }))}
                          className={`w-9 h-9 rounded-xl overflow-hidden border transition-all hover:scale-105 ${
                            newChildForm.photoUrl === item.url ? "border-indigo-600 ring-2 ring-indigo-100" : "border-slate-200"
                          }`}
                          title={`Usar foto de ${item.label}`}
                        >
                          <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre Completo del Niño(a)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Liam Quispe Flores"
                  value={newChildForm.name}
                  onChange={(e) => setNewChildForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    required
                    value={newChildForm.birthDate}
                    onChange={(e) => setNewChildForm(p => ({ ...p, birthDate: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Género / Sexo</label>
                  <select
                    value={newChildForm.gender}
                    onChange={(e) => setNewChildForm(p => ({ ...p, gender: e.target.value as any }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none bg-white"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Peso al nacer (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="3.2"
                    value={newChildForm.birthWeightKg}
                    onChange={(e) => setNewChildForm(p => ({ ...p, birthWeightKg: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Talla al nacer (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="50.0"
                    value={newChildForm.birthHeightCm}
                    onChange={(e) => setNewChildForm(p => ({ ...p, birthHeightCm: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Sem. Gestación</label>
                  <input
                    type="number"
                    required
                    placeholder="39"
                    value={newChildForm.gestionalAgeWeeks}
                    onChange={(e) => setNewChildForm(p => ({ ...p, gestionalAgeWeeks: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddChildModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  Registrar Perfil Pediátrico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CRED METRICS LOG */}
      {showAddControlModal && childDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                <Scale className="w-5 h-5 text-indigo-600" />
                Registrar Control de Peso y Talla (CRED)
              </h3>
              <button onClick={() => setShowAddControlModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateControl} className="space-y-4 mt-4">
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-start gap-2.5 text-xs text-indigo-900 font-medium mb-2">
                <BadgeInfo className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Registrado como: <strong>{currentUser.name}</strong>. El motor calculará automáticamente los desvíos Z-Score oficiales OMS.</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Fecha del Control</label>
                <input
                  type="date"
                  required
                  value={newControlForm.date}
                  onChange={(e) => setNewControlForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Peso Corporall (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ej. 7.9"
                    value={newControlForm.weightKg}
                    onChange={(e) => setNewControlForm(p => ({ ...p, weightKg: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Estatura / Talla (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="Ej. 67.6"
                    value={newControlForm.heightCm}
                    onChange={(e) => setNewControlForm(p => ({ ...p, heightCm: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">C. Cefálica (cm - Opcional)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej. 42.1"
                  value={newControlForm.headCircumferenceCm}
                  onChange={(e) => setNewControlForm(p => ({ ...p, headCircumferenceCm: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddControlModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  Guardar Control Clínico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INOCULATE VACCINE AUTHORIZATION */}
      {showVaccinateModal && vaccineToApply && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 block">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                <Syringe className="w-5 h-5 text-indigo-600 animate-pulse" />
                Registrar Aplicación de Vacuna
              </h3>
              <button onClick={() => setShowVaccinateModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-4">
              <div className="bg-slate-100 p-3.5 rounded-xl text-xs space-y-1 text-slate-700 border border-slate-200">
                <p><strong>Inmunizador:</strong> {vaccineToApply.details?.name}</p>
                <p><strong>Dosis:</strong> {vaccineToApply.details?.dose}</p>
                <p><strong>Enfermedades inmunizadas:</strong> {vaccineToApply.details?.diseaseTargeted}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Fecha de Aplicación</label>
                <input
                  type="date"
                  value={vaccineDate}
                  onChange={(e) => setVaccineDate(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Licenciado CRED / Firma Responsable</label>
                <input
                  type="text"
                  value={nurseSignature}
                  onChange={(e) => setNurseSignature(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-indigo-900 font-semibold text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-150">
                <button
                  onClick={() => handleUpdateVaccine("delayed")}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Reportar Retraso
                </button>
                <button
                  onClick={() => handleUpdateVaccine("applied")}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer text-center"
                >
                  Registrar Firma de Aplicación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
