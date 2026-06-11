import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Heart, ShieldAlert, BadgeInfo, Stethoscope } from "lucide-react";

interface Message {
  role: "user" | "bot";
  content: string;
}

interface TriageChatProps {
  childId: string;
}

export default function TriageChat({ childId }: TriageChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        `¡Hola! Soy tu **Enfermera de Triaje Virtual** de Crece Contigo. \n\nEstoy capacitada para orientarte sobre los síntomas de tu pequeño y clasificar la urgencia siguiendo guías clínicas de salud (MINSA/AIEPI). \n\n**¿De qué síntoma o malestar deseas consultarme hoy?**`,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const symptomTemplates = [
    { label: "🌡️ Fiebre alta 39°C", text: "Mi bebé de 3 meses tiene fiebre alta de 39°C y está muy decaído." },
    { label: "🤢 Vómitos y diarrea", text: "Mi hijo de 1 año empezó a vomitar todo lo que toma y tiene diarrea líquida." },
    { label: "💨 Tos leve y moquitos", text: "Mi pequeña de 18 meses tiene un poco de mocos transparentes y ligera tos, pero juega normal." },
    { label: "👶 Llanto en lactancia", text: "Mi bebé llora mucho cuando intenta mamar y se suelta con frecuencia." },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      const response = await fetch("/api/v1/chatbot/triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
          childId,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: `❌ Lo siento, no pude procesar la consulta. Error: ${data.error}` },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "⚠️ Hubo un error de conexión con la enfermera virtual. Por favor intenta más tarde." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyle = (content: string) => {
    if (content.includes("ROJO") || content.includes("ALERTA ROJA") || content.includes("EMERGENCIA")) {
      return "border-l-4 border-red-500 bg-red-50/50";
    }
    if (content.includes("AMARILLO") || content.includes("Atención Médica")) {
      return "border-l-4 border-amber-500 bg-amber-50/50";
    }
    if (content.includes("VERDE")) {
      return "border-l-4 border-emerald-500 bg-emerald-50/50";
    }
    return "";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col h-[520px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-52 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Triaje Pediátrico Inteligente</h4>
            <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Enfermera Virtual Activa (Protocolo AIEPI)
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-sm ${
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none"
                  : `bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100 ${getSeverityStyle(
                      m.content
                    )}`
              }`}
            >
              {/* Parse double asterisks manually to look gorgeous without rendering markdown dependencies */}
              <div className="whitespace-pre-line leading-relaxed">
                {m.content.split("\n").map((line, lineIdx) => {
                  // Basic rendering for headers & bold text to make AI reply readable
                  let parsedLine: React.ReactNode = line;
                  if (line.startsWith("###")) {
                    parsedLine = <h4 className="font-bold text-slate-900 mt-2 text-base">{line.replace("###", "")}</h4>;
                  } else {
                    // Match strong tags **bold**
                    const parts = line.split("**");
                    if (parts.length > 1) {
                      parsedLine = parts.map((part, partIdx) => {
                        return partIdx % 2 === 1 ? <strong key={partIdx} className="font-bold text-slate-900">{part}</strong> : part;
                      });
                    }
                  }
                  return <div key={lineIdx}>{parsedLine}</div>;
                })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-400 rounded-2xl rounded-tl-none p-3 text-xs italic flex items-center gap-1.5 border border-slate-200">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
              </span>
              Enfermera analizando síntomas...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick symptom triggers */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2 overflow-x-auto">
        {symptomTemplates.map((t, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(t.text)}
            disabled={loading}
            className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-medium hover:border-indigo-400 hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-100 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Describe los síntomas (Ej. mi bebé tiene tos y moquito)..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !inputText.trim()}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <div className="p-2.5 bg-amber-50 text-[10px] text-amber-700 text-center flex items-center justify-center gap-1 rounded-b-2xl border-t border-amber-100">
        <BadgeInfo className="w-3.5 h-3.5 shrink-0" />
        <span>Este asistente de triaje provee pautas de soporte. **No sustituye una receta ni consulta médica oficial.**</span>
      </div>
    </div>
  );
}
