import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { DB } from "./src/server/db.ts";
import { calculateZScores, getGrowthCurves } from "./src/server/who.ts";

const app = express();
app.use(express.json({ limit: '10mb' })); // support base64 imagery uploads

const PORT = 3000;

// Shared lazy-loaded Gemini client
let _aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!_aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    _aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY", // gracefully fall back during initial compilation or loading
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return _aiClient;
}

// Check if Gemini is fully configured
function hasValidGeminiKey(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
}

// ============================================
// REST API ENDPOINTS
// ============================================

// REST: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// REST: Auth Mock Endpoint
app.post("/api/v1/auth/login", (req, res) => {
  const { email } = req.body;
  const user = DB.users.find(u => u.email === email);
  if (user) {
    res.json({ token: `mock-jwt-for-${user.id}`, user });
  } else {
    res.status(401).json({ error: "Credenciales de demostración inválidas. Puedes usar maria@ejemplo.com o carlos@crececontigo.gob.pe" });
  }
});

// REST: Get children (filtered depending on role)
app.get("/api/v1/children", (req, res) => {
  const role = req.headers["x-user-role"] || "parent";
  const userId = req.headers["x-user-id"] || "parent_1";

  if (role === "nurse") {
    // Nurses see all children in their health sector
    res.json(DB.children);
  } else {
    // Parents only see their own kids
    const filtered = DB.children.filter(c => c.parentId === userId);
    res.json(filtered);
  }
});

// REST: Register a new Child profile
app.post("/api/v1/children", (req, res) => {
  const { name, birthDate, gender, bloodType, birthWeightKg, birthHeightCm, gestionalAgeWeeks, parentId, photoUrl } = req.body;
  
  if (!name || !birthDate || !gender) {
    return res.status(400).json({ error: "Nombre, fecha de nacimiento y género son campos requeridos." });
  }

  const newChild = {
    id: "child_" + Math.random().toString(36).substr(2, 9),
    parentId: parentId || "parent_1",
    name,
    birthDate,
    gender,
    bloodType: bloodType || "O+",
    birthWeightKg: parseFloat(birthWeightKg) || 3.0,
    birthHeightCm: parseFloat(birthHeightCm) || 49.0,
    gestionalAgeWeeks: parseInt(gestionalAgeWeeks) || 39,
    photoUrl: photoUrl || "",
  };

  DB.children.push(newChild);

  // Auto seed initial growth log based on birth metrics
  DB.logGrowth(newChild.id, birthDate, newChild.birthWeightKg, newChild.birthHeightCm, 34.0, "Sistema CRED");

  // Auto seed all standard vaccine calendar schedules as 'pending'
  DB.vaccines.forEach(v => {
    DB.vaccineRecords.push({
      id: "vr_" + Math.random().toString(36).substr(2, 9),
      childId: newChild.id,
      vaccineId: v.id,
      status: v.targetAgeMonths === 0 ? "pending" : "pending",
    });
  });

  // Calculate vaccine alerts if overdue
  DB.retriggerSystemAlerts();

  res.status(201).json(newChild);
});

// REST: Get details of a single child, including logs, vaccine records, milestone checklists
app.get("/api/v1/children/:id", (req, res) => {
  const child = DB.children.find(c => c.id === req.params.id);
  if (!child) {
    return res.status(404).json({ error: "Perfil de niño no encontrado." });
  }

  const logs = DB.growthLogs.filter(l => l.childId === child.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const vaccines = DB.vaccineRecords
    .filter(vr => vr.childId === child.id)
    .map(vr => {
      const details = DB.vaccines.find(v => v.id === vr.vaccineId);
      return { ...vr, details };
    });

  const milestones = DB.milestones.filter(m => m.childId === child.id);

  res.json({
    child,
    growthLogs: logs,
    vaccineRecords: vaccines,
    milestones,
    growthCurves: getGrowthCurves(child.gender)
  });
});

// REST: Record Weight and Height
app.post("/api/v1/growth/record", (req, res) => {
  const { childId, date, weightKg, heightCm, headCircumferenceCm, registeredBy } = req.body;
  
  if (!childId || !date || !weightKg || !heightCm) {
    return res.status(400).json({ error: "Datos biométricos incompletos." });
  }

  try {
    const newLog = DB.logGrowth(
      childId,
      date,
      parseFloat(weightKg),
      parseFloat(heightCm),
      headCircumferenceCm ? parseFloat(headCircumferenceCm) : undefined,
      registeredBy || "Usuario"
    );
    res.json(newLog);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// REST: Update immunizations
app.post("/api/v1/vaccines/update", (req, res) => {
  const { childId, recordId, status, dateApplied, nurseName } = req.body;
  if (!childId || !recordId || !status) {
    return res.status(400).json({ error: "Insumo de vacuna faltante." });
  }

  try {
    const updated = DB.updateVaccineStatus(childId, recordId, status, dateApplied, "nurse_1", nurseName);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// REST: Update milestone status
app.post("/api/v1/milestones/update", (req, res) => {
  const { milestoneId, status } = req.body;
  try {
    const updated = DB.updateMilestoneStatus(milestoneId, status);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// REST: Add milestone
app.post("/api/v1/milestones", (req, res) => {
  const { childId, ageGroupMonths, milestoneText, pnpCategory, status } = req.body;
  try {
    const item = DB.registerMilestone(childId, ageGroupMonths, milestoneText, pnpCategory, status);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// REST: Fetch clinical alarms
app.get("/api/v1/alerts", (req, res) => {
  const childId = req.query.childId as string;
  if (childId) {
    res.json(DB.alerts.filter(a => a.childId === childId));
  } else {
    res.json(DB.alerts);
  }
});

// REST: Resolve warning/alert
app.post("/api/v1/alerts/:id/resolve", (req, res) => {
  try {
    const resolved = DB.resolveAlert(req.params.id);
    res.json(resolved);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// REST: Vaccines Catalogue
app.get("/api/v1/vaccines-catalogue", (req, res) => {
  res.json(DB.vaccines);
});

// ============================================
// ADVANCED SERVER-SIDE AI INTEGRATIONS (GEMINI API)
// ============================================

// AI Endpoint: Predictive early growth risk model & standard recommendations (WHO based)
app.post("/api/v1/ai/growth-analysis", async (req, res) => {
  const { childId } = req.body;
  if (!childId) {
    return res.status(400).json({ error: "Falta el ID del niño para ejecutar el análisis clínico predictivo." });
  }

  const child = DB.children.find(c => c.id === childId);
  if (!child) {
    return res.status(404).json({ error: "Niño no encontrado." });
  }

  const logs = DB.growthLogs
    .filter(l => l.childId === childId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const milestones = DB.milestones.filter(m => m.childId === childId);

  // Generate a detailed medical projection prompt
  const serializedLogs = logs.map(l => 
    `- Fecha: ${l.date}, Peso: ${l.weightKg}kg (Z-score: ${l.weightZ}, Status: ${l.weightStatus}), Talla: ${l.heightCm}cm (Z-score: ${l.heightZ}, Status: ${l.heightStatus})`
  ).join("\n");

  const serializedMilestones = milestones.map(m => 
    `- Hito (${m.ageGroupMonths}m, ${m.pnpCategory}): "${m.milestoneText}", Estado: ${m.status}`
  ).join("\n");

  const prompt = `Analiza los siguientes registros biométricos y de hitos para el niño(a) "${child.name}" (${child.gender}, F.Nacimiento: ${child.birthDate}, Peso al nacer: ${child.birthWeightKg}kg):

HISTORIAL DE CONTROLES BIOMÉTRICOS:
${serializedLogs || "Ninguno registrado excepto peso al nacer"}

HITOS DEL DESARROLLO EVALUADOS:
${serializedMilestones || "Ninguno evaluado aún"}

Por favor, como especialista en Salud Infantil CRED y Nutrición Pediátrica de la OMS y el MINSA Perú:
1. Analiza la TENDENCIA de crecimiento (¿Se está aplanando la curva? ¿Hay riesgo de desnutrición crónica infantil - DCI o sobrepeso?).
2. Ofrece una PROYECCIÓN predictiva a los próximos 3 meses basada en su tasa de cambio.
3. Brinda RECOMENDACIONES nutricionales personalizadas y pautas de estimulación psicomotora adecuadas exactamente para la edad actual y estado en base a la norma técnica peruana (CRED).
4. Indica si requiere suplementación preventiva (ej. Hierro or Gotas de Micronutrientes) según la normativa de salud de Perú.

Responde de manera formal, muy legible en formato Markdown clínico con títulos claros, usando viñetas bien estructuradas y un tono empático pero riguroso.`;

  try {
    if (!hasValidGeminiKey()) {
      // Friendly, beautiful fallback descriptive response to simulate high-tier clinical AI
      const mockAnalysis = `### Resumen del Análisis Predictivo Clínico (Simulado - Configura tu API Key)

*   **Tendencia de Crecimiento para ${child.name}:** El trayecto en los últimos meses sugiere una dinámica estable con buena adecuación al percentil 50 OMS. Su Z-Score de peso se mantiene dentro de rangos idóneos (-0.5 a +0.5).
*   **Proyección Predictiva (3 meses):** Si consolida su ritmo metabólico promedio, se proyecta un incremento ponderal óptimo (+600g a 900g adicionales para el próximo control trimestral).
*   **Micronutrientes recomendados (CRED - MINSA Perú):** 
    *   Suplementación preventiva de hierro a partir de los 4 meses para evitar anemia ferropénica.
    *   Lactancia materna exclusiva si es menor de 6 meses; o incorporación gradual de papillas ricas en hierro (sangrecita, bazo) si ya inició la alimentación complementaria.
*   **Plan de Estimulación:** Continuar fortaleciendo el gateo asistido y el desarrollo auditivo/habla.

*Nota: Para habilitar el motor generativo avanzado de diagnóstico en vivo de Crece Contigo, añade tu **GEMINI_API_KEY** en la pestaña de Secrets de AI Studio.*`;
      return res.json({ analysis: mockAnalysis, isSimulated: true });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ analysis: response.text || "No se pudo recuperar el análisis en este momento.", isSimulated: false });
  } catch (err: any) {
    res.status(500).json({ error: `Fallo el análisis clínico de IA: ${err.message}` });
  }
});

// AI Endpoint: Chatbot de Triaje Pediátrico con NLP
app.post("/api/v1/chatbot/triage", async (req, res) => {
  const { messages, childId } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Arreglo de mensajes de chat requerido." });
  }

  let childContext = "Sin perfil asociado aún.";
  if (childId) {
    const child = DB.children.find(c => c.id === childId);
    if (child) {
      const logs = DB.growthLogs.filter(l => l.childId === childId);
      const latest = logs[logs.length - 1];
      childContext = `Niño evaluado: ${child.name}, Edad: ${child.birthDate}, Sexo: ${child.gender}, Último Control: Peso ${latest?.weightKg || "N/A"}kg, Estado de peso: ${latest?.weightStatus || "Normal"}`;
    }
  }

  const systemInstruction = `Actúas como "Enfermera de Triaje Pediátrico Virtual" de la plataforma nacional de salud infantil "Crece Contigo" en Perú.
Tu misión es procesar las consultas de los padres sobre síntomas de salud de sus hijos basándote en protocolos oficiales de triaje (ej. Guías AIEPI de la Organización Panamericana de la Salud).

DIRECTRICES CRÍTICAS:
1. Evalúa detalladamente la gravedad de los síntomas según lo reportado. Deberás clasificar de manera visual la urgencia en una de tres categorías claras:
   - 🔴 **ALERTA ROJA (ACUDIR A EMERGENCIA DE INMEDIATO):** Fiebre alta persistente en neonatos (<3 meses), letargia, dificultad respiratoria visible (tiraje intercostal), deshidratación severa (no retiene líquidos, ojos hundidos), convulsiones.
   - 🟡 **AMARILLO (CONSULTA CRED / EVALUACIÓN EN LÍNEA):** Fiebre moderada y controlable que cede al paño o antipiréticos, tos leve sin sibilancias, diarrea inicial bien hidratada, erupciones cutáneas benignas con apetito conservado.
   - 🟢 **VERDE (MONITOREO DOMÉSTICO Y CONFORT):** Moquito claro pasajero, cólicos del lactante habituales, brote de dientes, pautas de crianza normales.
2. Brinda una explicación clara de lo que podría estar ocurriendo en un lenguaje sumamente comprensible para un padre primerizo sin jerga compleja.
3. Brinda exclusivamente pautas de confort físico, soporte de hidratación y nutrición seguras (ej. lactancia frecuente, paños tibios para la fiebre).
4. ABSOLUTAMENTE PROHIBIDO: Prescribir dosificaciones médicas o medicamentos específicos de venta regulada (ej. antibióticos). Solo puedes guiar en medidas generales y aconsejar cuándo acudir al pediatra.

CONTEXTO CLÍNICO DEL NIÑO ACTUAL:
${childContext}`;

  try {
    const latestMessage = messages[messages.length - 1]?.content || "";

    if (!hasValidGeminiKey()) {
      // Simulative triaging logic for smooth developer review preview when Key is not set up yet
      let severity: "high" | "medium" | "low" = "low";
      let classification = "🟢 VERDE - Monitoreo en Hogar";
      let textResponse = "Gracias por consultar con Crece Contigo. Por los síntomas que describes, parece tratarse de un malestar leve. Mantén a tu bebé bien hidratado(a) mediante lactancia materna o líquidos tibios, limpia suavemente su naricita, y mantente alerta a signos de alarma como dificultad al respirar o fiebre alta mayor a 38.5°C por más de 12 horas. Consulta a tu pediatra si el malestar persiste.";

      const lowerText = latestMessage.toLowerCase();
      if (lowerText.includes("fiebre") || lowerText.includes("calentura") || lowerText.includes("vomito") || lowerText.includes("diarrea")) {
        severity = "medium";
        classification = "🟡 AMARILLO - Atención Médica Prioritaria";
        textResponse = "He registrado síntomas de fiebre o problemas gástricos. Aunque estos cuadros son comunes, requieren monitoreo estricto. **Recomendaciones:** Ofrece líquidos fraccionados constantemente (suero oral o leche), pon paños de agua tibia en la frente y axilas, y lleva un registro de su temperatura cada 3 horas. Si no disminuye o notas que vomita todo lo que ingiere, acude de inmediato a tu centro de salud.";
      }
      if (lowerText.includes("ahogo") || lowerText.includes("respirar") || lowerText.includes("convulsio") || lowerText.includes("ahoga") || lowerText.includes("emergencia")) {
        severity = "high";
        classification = "🔴 ROJO - ¡EMERGENCIA INMEDIATA!";
        textResponse = "### 🚨 ALERTA ROJA CLINICA\n\nLos síntomas descritos (dificultad respiratoria extrema o signos neurológicos) representan un riesgo vital. **Debes acudir inmediatamente al servicio de urgencias más cercano.**\n\n**Qué hacer de camino:**\n- Mantén las vías aéreas libres.\n- No intentes forzar ingesta de comida o medicación.\n- Abriga moderadamente al menor.";
      }

      const mockReply = `### Clasificación: ${classification}

${textResponse}

*(Respuesta inteligente simulada localmente por el servidor. Para habilitar un diálogo clínico completo por NLP asistido por Gemini 3.5, configura tu API Key en AI Studio Secrets).*`;

      return res.json({ reply: mockReply });
    }

    const ai = getGeminiClient();
    // Prepare contents array matching chat structure
    const contentsPayload = messages.map(msg => ({
      role: msg.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentsPayload,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ reply: response.text || "La enfermera de triaje no pudo contestarte en este instante, por favor inténtalo de nuevo." });
  } catch (err: any) {
    res.status(500).json({ error: `Error del chatbot de triaje de IA: ${err.message}` });
  }
});

// AI Endpoint: Computer Vision for infant height estimation & postural validation
app.post("/api/v1/ai/height-vision", async (req, res) => {
  const { imageBase64, childId, referenceMarkerCm } = req.body;
  
  if (!imageBase64) {
    return res.status(400).json({ error: "Falta la imagen base64 para poder realizar el análisis por computadora." });
  }

  const child = DB.children.find(c => c.id === childId);
  const targetMark = parseFloat(referenceMarkerCm) || 60; // 60cm standard visual reference mark

  const prompt = `Analiza detalladamente esta foto de un bebé recostado clínicamente dispuesto para estimar su talla e identificar si cumple con las posturas adecuadas de medición CRED (piernas completamente extendidas, talones firmes contra el tope, cabeza alineada horizontalmente en el plano de Frankfurt). La línea visual de referencia tiene una longitud estandarizada de ${targetMark} centímetros.
  
  En base al análisis de pixeles y contexto referencial:
  1. Estima la talla exacta acumulada en centímetros.
  2. Determina si cumple con las normas posturales de medición (Sí/No y fundamentos posturales).
  3. Recomienda correcciones físicas en caso de notar encogimiento de rodillas o alineación incorrecta.
  
  Estructura tu respuesta estrictamente en un formato JSON plano, con los siguientes campos obligatorios para facilitar el parsing clínico:
  {
    "estimatedHeightCm": 62.5,
    "isPosturallyCompliant": "No",
    "postureFeedback": "El bebé presenta ligera flexión en la articulación de la rodilla izquierda. Para asegurar un tallado preciso, presione suavemente los muslos hacia abajo y mantenga el tope podálico perpendicular.",
    "isFeasible": true,
    "confidenceScorePercent": 85
  }`;

  try {
    if (!hasValidGeminiKey()) {
      // Simulate computer vision parsing for beautiful diagnostic UI preview
      const estimatedValue = child ? (child.birthHeightCm + 11.5) : 63.5;
      const mockResult = {
        estimatedHeightCm: estimatedValue,
        isPosturallyCompliant: "Sí",
        postureFeedback: "Análisis de Imagen Completado. La alineación cefálica sigue de forma óptima el plano de Frankfurt. Las extremidades inferiores se observan alineadas correctamente con extensión de rodillas satisfactoria sobre el pañal. Estimación calculada con un margen de tolerancia de +/- 1.2cm respecto a la marca referencial de 60cm.",
        isFeasible: true,
        confidenceScorePercent: 92
      };
      return res.json({ result: mockResult, isSimulated: true });
    }

    const ai = getGeminiClient();
    // Prepare multi-part content with image and text-JSON prompt
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: "image/jpeg"
      }
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedHeightCm: { type: Type.NUMBER, description: "Estimated physical height of the child in cm" },
            isPosturallyCompliant: { type: Type.STRING, description: "Whether the baby posture is strictly correct for reliable tall assessment: 'Sí' or 'No'" },
            postureFeedback: { type: Type.STRING, description: "Pediatric postural assessment feedback and corrections" },
            isFeasible: { type: Type.BOOLEAN, description: "Whether the photo is clear enough to do analysis" },
            confidenceScorePercent: { type: Type.NUMBER, description: "Score of estimation accuracy out of 100" }
          },
          required: ["estimatedHeightCm", "isPosturallyCompliant", "postureFeedback", "isFeasible", "confidenceScorePercent"]
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json({ result: parsedData, isSimulated: false });
  } catch (err: any) {
    res.status(500).json({ error: `Fallo el estimador visual de talla de IA: ${err.message}` });
  }
});


// ============================================
// VITE DEV SERVER / PRODUCTION ENTRY SETUP
// ============================================

const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite dev server in non-prod mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Crece Contigo Server] Host: http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Fallo al inicializar el servidor full-stack de Crece Contigo:", err);
});
