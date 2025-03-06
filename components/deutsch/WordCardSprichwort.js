import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const SprichwortCard = ({ wordData, showTranslation, onFlip }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [cardHeight, setCardHeight] = useState("auto");
  const frontCardRef = useRef(null);
  const backCardRef = useRef(null);

  // Effekt für die Einblendanimation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Effekt zur Berechnung der Kartenhöhe basierend auf dem Inhalt
  useEffect(() => {
    if (wordData && frontCardRef.current && backCardRef.current) {
      frontCardRef.current.style.position = "static";
      backCardRef.current.style.position = "static";
      backCardRef.current.style.transform = "none";

      const frontHeight = frontCardRef.current.offsetHeight;
      const backHeight = backCardRef.current.offsetHeight;

      frontCardRef.current.style.position = "absolute";
      backCardRef.current.style.position = "absolute";
      backCardRef.current.style.transform = "rotateY(180deg)";

      const maxHeight = Math.max(frontHeight, backHeight, 440);
      setCardHeight(`${maxHeight}px`);
    }
  }, [wordData]);

  const splitText = (text) => {
    return text ? text.split('\n').filter((v) => v.trim() !== '') : [];
  };

  if (!wordData) {
    return (
      <div className="w-full min-h-[440px] rounded-2xl bg-gray-200 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Lade Daten...</p>
      </div>
    );
  }

  const hasExamples = splitText(wordData.beispiel).length > 0;
  const hasExplanation = wordData.erklaerung && wordData.erklaerung.trim() !== "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        y: isVisible ? 0 : 20,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
      }}
      className="perspective-1000"
    >
      <div 
        className="w-full relative preserve-3d cursor-pointer"
        onClick={onFlip}
        style={{ 
          transformStyle: "preserve-3d",
          transition: "transform 0.6s",
          transform: showTranslation ? "rotateY(180deg)" : "rotateY(0deg)",
          height: cardHeight,
        }}
      >
        {/* Vorderseite der Karte */}
        <div 
          ref={frontCardRef}
          className="absolute inset-0 rounded-2xl p-8 flex flex-col justify-between bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-xl border border-white/20 backdrop-blur-sm"
          style={{ 
            backfaceVisibility: "hidden",
          }}
        >
          <div>
            <div className="inline-block px-3 py-1 mb-4 text-xs font-medium bg-white/20 rounded-full backdrop-blur-sm">
              Hauptwort
            </div>
            <h2 className="text-3xl font-bold mb-6">{wordData.sprichwort || "Unbekannt"}</h2>
            {hasExamples && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">Beispiel</h4>
                <div className="space-y-2 leading-relaxed bg-white/20 p-2 rounded-md">
                  {splitText(wordData.beispiel).map((beispiel, index) => (
                    <div key={index} className="space-y-2">
                      <p className="text-xl text-white/90">{beispiel}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {(wordData.quelle || wordData.datum) && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-sm text-white/60">
                {wordData.quelle || "Unbekannt"} {wordData.datum && `(${wordData.datum})`}
              </p>
            </div>
          )}
        </div>

        {/* Rückseite der Karte */}
        <div 
          ref={backCardRef}
          className="absolute inset-0 rounded-2xl p-8 flex flex-col justify-between bg-gradient-to-br from-purple-400 to-pink-600 text-white shadow-xl border border-white/20 backdrop-blur-sm"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <div className="flex-grow flex flex-col items-center justify-center text-center">
            {hasExplanation && (
              <p className="text-3xl font-bold text-white leading-relaxed">{wordData.erklaerung}</p>
            )}
          </div>
          {(wordData.quelle || wordData.datum) && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-sm text-white/60">
                {wordData.quelle || "Unbekannt"} {wordData.datum && `(${wordData.datum})`}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SprichwortCard;