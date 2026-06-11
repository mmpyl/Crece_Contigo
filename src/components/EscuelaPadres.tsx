import React, { useState } from "react";
import { BookOpen, HelpCircle, Utensils, HeartHandshake, Sparkles, Smile, ShieldCheck } from "lucide-react";

export default function EscuelaPadres() {
  const [activeTab, setActiveTab] = useState<number>(4);

  const guides = [
    {
      ageMonths: 4,
      title: "La Lactancia Exclusiva y Suplementación de Hierro",
      nutri: [
        "Lactancia materna exclusiva (0 a 6 meses): Libre demanda, sin agüitas ni tés. Satisface toda sed y apetito del bebé.",
        "Suplementación de Hierro preventiva: De acuerdo a la normativa de salud en el Perú (MINSA), se inicia gotas de sulfato ferroso a partir de los 4 meses cumplidos para asegurar el óptimo desarrollo neurológico y evitar la anemia."
      ],
      motor: [
        "Sostén cefálico: Coloca al bebé boca abajo por cortos períodos (bajo tu cuidado constante) para tonificar su cuello y espalda.",
        "Seguimiento visual: Pasa sonajeros o juguetes de colores brillantes a 30cm de distancia para ejercitar su enfoque ocular."
      ],
      warnings: "Emergencia: Si tu bebé presenta fiebre alta (>38°C), succiona con fatiga extrema, o tiene respiración rápida tirando costillas, acude urgentemente a la posta de salud."
    },
    {
      ageMonths: 6,
      title: "La Transición a la Alimentación Complementaria",
      nutri: [
        "Inicio de Alimentación: Incorpora papillas espesas, purés o mazamorrillas hechas de un único ingrediente macerado. No agregues sal, azúcar ni sazonadores.",
        "Alimentos ricos en hierro: Dale prioridad a papillas preparadas con dos cucharadas soperas de sangrecita, bazo de res o hígado, esenciales para evitar la anemia crónica."
      ],
      motor: [
        "Sedestación con apoyo: Coloca cojines en su entorno para animarlo a permanecer sentado de forma segura.",
        "Coordinación mano-boca: Préstale mordedores limpios para que practique sostener e intercambiar objetos entre sus manos."
      ],
      warnings: "Alerta: Introduce alimentos nuevos de uno en uno por 3 días seguidos para identificar alguna hipersensibilidad o alergia."
    },
    {
      ageMonths: 12,
      title: "Consolidación de la Dieta Familiar y Primeros Pasos",
      nutri: [
        "Alimentación Completa: Integra a tu niño a la olla familiar. Ofrécele trozos picados pequeños (no licuados) para estimular la masticación y autonomía.",
        "Alimentos sólidos recomendados: 5 cucharadas de comida sólida por porción, balanceando fuentes de proteína (huevo, pollo), menestras y verduras de colores."
      ],
      motor: [
        "Bipedestación asistida: Anímalo a levantarse apoyándose de sillones resistentes.",
        "Pinza digital: Estimula la toma de objetos pequeños y seguros usando el dedo pulgar e índice (ej. uvas partidas sin semillas)."
      ],
      warnings: "Esquema de Vacunación: Es obligatorio aplicar en este control la 1ra dosis de SPR (Sarampión-Papera-Rubéola) y Neumococo (3ra dosis). Proporciona inmunidad vital."
    },
    {
      ageMonths: 18,
      title: "Autonomía, Lenguaje y Estimulación Activa",
      nutri: [
        "Alimentación y Hábitos: Fomenta el uso de su propia cuchara y vaso entrenador. Evita distractores como celulares o televisión durante el almuerzo.",
        "Suplementos CRED: Continúa los controles y asiste puntualmente para la entrega periódica de micronutrientes preventivos."
      ],
      motor: [
        "Camina libremente: Propicia espacios seguros de juego en el piso para que camine, ruede y explore.",
        "Estímulo comunicacional: Háblale con claridad, nómbrale objetos cotidianos por su nombre real y evita usar diminutivos excesivos o imitar balbuceos."
      ],
      warnings: "Seguridad en el Hogar: Debido a su nivel de movilidad y curiosidad, protege enchufes eléctricos, guarda productos de limpieza bajo llave, y bloquea las escaleras con barandas de seguridad."
    }
  ];

  const currentGuide = guides.find(g => g.ageMonths === activeTab) || guides[0];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Escuela para Padres (Normas Técnicas CRED)</h3>
          <p className="text-slate-500 text-sm">Biblioteca interactiva con pautas oficiales del MINSA y de la OMS por grupo de edad</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 mb-6 overflow-x-auto">
        {guides.map((g) => (
          <button
            key={g.ageMonths}
            onClick={() => setActiveTab(g.ageMonths)}
            className={`px-6 py-3.5 border-b-2 font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === g.ageMonths
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Controles a los {g.ageMonths} Meses
          </button>
        ))}
      </div>

      {/* Dynamic Content Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nutrition */}
        <div className="bg-[#FFF3E0]/70 p-5 rounded-2xl border border-orange-100 space-y-3">
          <h4 className="font-bold text-sm text-amber-800 flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Nutrición y Hierro Preventivo
          </h4>
          <ul className="space-y-3">
            {currentGuide.nutri.map((n, i) => (
              <li key={i} className="text-xs text-amber-900/90 leading-relaxed list-disc list-inside">
                {n}
              </li>
            ))}
          </ul>
        </div>

        {/* Development milestones stimulants */}
        <div className="bg-[#E8F5E9]/70 p-5 rounded-2xl border border-emerald-100 space-y-3">
          <h4 className="font-bold text-sm text-emerald-800 flex items-center gap-2">
            <Smile className="w-4 h-4" />
            Estimulación Psicomotora en Casa
          </h4>
          <ul className="space-y-3">
            {currentGuide.motor.map((m, i) => (
              <li key={i} className="text-xs text-emerald-900/90 leading-relaxed list-disc list-inside">
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Preventions / Emergencies footer */}
      <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-800 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
        <div className="space-y-1">
          <h5 className="text-xs font-bold uppercase tracking-wider text-red-900">Prevención y Signos de Alerta Temprana</h5>
          <p className="text-xs leading-relaxed text-red-800/95">{currentGuide.warnings}</p>
        </div>
      </div>
    </div>
  );
}
