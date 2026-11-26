import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2, Send } from "lucide-react";

export default function VoiceControl({ onCommandSubmit, isProcessing }) {
  const [isListening, setIsListening] = useState(false);
  const [continuousMode, setContinuousMode] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [manualText, setManualText] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let current = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);

      if (event.results[event.results.length - 1].isFinal) {
        const finalSpeech = current.trim();
        if (finalSpeech) {
          onCommandSubmit(finalSpeech);
          setTranscript("");
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // إعادة التشغيل التلقائي في وضع الجرد المستمر
      if (continuousMode && recognitionRef.current?.shouldKeepListening) {
        try {
          recognition.start();
          setIsListening(true);
        } catch (e) {}
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [continuousMode, onCommandSubmit]);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert("متصفحك لا يدعم التعرف الصوتي المباشر، استخدم Google Chrome أو الإدخال النصي.");
      return;
    }

    if (isListening) {
      recognition.shouldKeepListening = false;
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.shouldKeepListening = continuousMode;
      recognition.start();
      setIsListening(true);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    onCommandSubmit(manualText.trim());
    setManualText("");
  };

  return (
    <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 shadow-lg p-3 z-20">
      <div className="max-w-4xl mx-auto">
        {/* شريط عرض الكلام الحي */}
        <div className="min-h-[28px] mb-2 px-3 py-1 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-center justify-between">
          <span className="truncate">
            {isProcessing
              ? "جاري تحليل الأصناف بالذكاء الاصطناعي..."
              : transcript || (isListening ? "تحدث الآن... (مثال: 5 كراتين حليب)" : "الميكروفون متوقف")}
          </span>
          <label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 shrink-0 mr-2">
            <input
              type="checkbox"
              checked={continuousMode}
              onChange={(e) => setContinuousMode(e.target.checked)}
              className="rounded text-blue-600"
            />
            استماع مستمر
          </label>
        </div>

        <div className="flex items-center gap-3">
          {/* إدخال نصي بديل */}
          <form onSubmit={handleManualSubmit} className="flex-1 flex gap-1.5">
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="أو اكتب هنا: 3 كرتون زيت و 10 حبة تونة..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isProcessing || !manualText.trim()}
              className="bg-slate-800 text-white px-3.5 rounded-xl disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* زر الميكروفون الرئيسي */}
          <button
            onClick={toggleListening}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-md transition-all shrink-0 ${
              isListening
                ? "bg-rose-600 ring-4 ring-rose-200 animate-pulse"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isListening ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
