import React, { useState } from "react";
import { Camera, Image, Ruler, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";

interface VisionTallimetroProps {
  childId: string;
  childName: string;
  onHeightEstimated: (heightCm: number) => void;
}

export default function VisionTallimetro({ childId, childName, onHeightEstimated }: VisionTallimetroProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [referenceMarkerCm, setReferenceMarkerCm] = useState("60");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Mock baby images parents can choose instantly for testing the visual algorithm
  const sampleScenarios = [
    {
      name: "Bebé Recostado (Alineación Perfecta)",
      imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&auto=format&fit=crop",
      desc: "Excelente postura con piernas tendidas y marca de 60cm al costado."
    },
    {
      name: "Bebé Flexionando Rodillas (Error de Postura)",
      imageUrl: "https://images.unsplash.com/photo-1519689680058-324335c77ebd?q=80&w=600&auto=format&fit=crop",
      desc: "Falla postural típica: piernas semi flectadas impiden medición fiable."
    }
  ];

  const handleSelectSample = (url: string) => {
    setSelectedFile(url);
    setResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setResult(null);

    try {
      // For testing, send base64 or sample URL to backend
      const response = await fetch("/api/v1/ai/height-vision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: selectedFile.startsWith("data:") ? selectedFile : "MOCK_FRAME_URL",
          childId,
          referenceMarkerCm,
        }),
      });

      const data = await response.json();
      if (response.ok && data.result) {
        setResult(data.result);
        if (data.result.estimatedHeightCm && data.result.isPosturallyCompliant === "Sí") {
          // Callback to parent component to register control if acceptable
          onHeightEstimated(data.result.estimatedHeightCm);
        }
      } else {
        alert("Fallo el procesamiento: " + (data.error || "Error desconocido"));
      }
    } catch (err) {
      alert("Error de red llamando a la estimación por visión Computacional.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Estimación de Talla Inteligente (Computer Vision)</h3>
          <p className="text-slate-500 text-sm">Toma una foto de tu bebé y calcula su talla usando redes neuronales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Input and interactive camera frame */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <span className="text-xs font-semibold text-slate-500 uppercase">1. Prepara la captura</span>
          
          <div className="relative border-2 border-dashed border-slate-200 rounded-2xl h-[300px] overflow-hidden bg-slate-50 hover:bg-slate-100/50 transition-all flex flex-col justify-center items-center">
            {selectedFile ? (
              <>
                <img src={selectedFile} alt="Baby capture" className="w-full h-full object-cover" />
                {/* Simulated Alignment Overlays */}
                <div className="absolute inset-x-0 top-6 border-t-2 border-indigo-400 stroke-dasharray opacity-80 flex justify-between px-4">
                  <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">PLANO FRANKFURT</span>
                </div>
                <div className="absolute inset-y-0 right-12 border-l-2 border-emerald-400 opacity-80 flex items-center">
                  <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded font-mono origin-top-left rotate-90 -translate-y-6">TALÓN EXPENDIDO</span>
                </div>
                <div className="absolute bottom-6 inset-x-0 text-center">
                  <span className="bg-black/60 text-white text-[10px] px-3 py-1 rounded-full">Referencia fijada: {referenceMarkerCm}cm</span>
                </div>
              </>
            ) : (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                  <Image className="w-6 h-6" />
                </div>
                <div>
                  <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all inline-block">
                    Seleccionar Foto o Tomar Cámara
                    <input type="file" onChange={handleFileUpload} accept="image/*" className="hidden" />
                  </label>
                </div>
                <p className="text-slate-400 text-xs">Sube un archivo local o prueba con nuestros casos de test rápidos 👇</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Medida de Referencia (cm)</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <Ruler className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="number"
                  value={referenceMarkerCm}
                  onChange={(e) => setReferenceMarkerCm(e.target.value)}
                  className="bg-transparent w-full focus:outline-none text-slate-800 text-sm"
                />
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Largo del objeto calibrador al costado del bebé (regla, cinta).</span>
            </div>

            <div className="flex items-end">
              <button
                onClick={runAnalysis}
                disabled={!selectedFile || analyzing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-3.5 px-4 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {analyzing ? "Corriendo algoritmos..." : "Calcular Talla por IA"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Scenarios & Results */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <span className="text-xs font-semibold text-slate-500 uppercase">Casos Clínicos de Muestra</span>
          <div className="grid grid-cols-1 gap-2.5">
            {sampleScenarios.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(s.imageUrl)}
                className={`text-left p-3 border rounded-xl flex items-center gap-3 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer ${
                  selectedFile === s.imageUrl ? "border-indigo-400 bg-indigo-50/50" : "border-slate-100"
                }`}
              >
                <img src={s.imageUrl} alt={s.name} className="w-12 h-12 rounded-lg object-cover" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{s.name}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold text-slate-500 uppercase mt-2">Diagnóstico de Visión</span>
          {result ? (
            <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3.5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Talla Estimada</p>
                  <h3 className="text-3xl font-extrabold text-indigo-600 mt-1">{result.estimatedHeightCm} cm</h3>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    result.isPosturallyCompliant === "Sí"
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : "text-amber-700 bg-amber-50 border-amber-200"
                  }`}
                >
                  Conformidad: {result.isPosturallyCompliant}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  {result.isPosturallyCompliant === "Sí" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                  )}
                  Reporte Postural Pediátrico:
                </p>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                  {result.postureFeedback}
                </p>
              </div>

              {result.isPosturallyCompliant === "Sí" && (
                <div className="p-2.5 bg-emerald-100/50 text-emerald-700 text-[11px] font-medium rounded-lg flex items-center justify-between">
                  <span>Margen de Precisión Estelar: (Confianza {result.confidenceScorePercent}%)</span>
                  <span className="font-bold">¡Aprobado para CRED!</span>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-slate-150 rounded-xl flex-1 flex flex-col justify-center items-center text-center p-6 text-slate-400 italic">
              <Ruler className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs">Sube una fotografía y haz clic en "Calcular Talla por IA" para ver el reporte instantáneo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
