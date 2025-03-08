import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function PraepositionCard({ wordData, showTranslation, onFlip }) {
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

      const maxHeight = Math.max(frontHeight, backHeight, 440); // Mindesthöhe von 440px
      setCardHeight(`${maxHeight}px`);
    }
  }, [wordData]);

  if (!wordData) {
    return (
      <div className="w-full min-h-[440px] rounded-2xl bg-gray-200 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Lade Daten...</p>
      </div>
    );
  }

  const formattedDate = wordData.datum && !isNaN(new Date(wordData.datum))
    ? new Date(wordData.datum).toLocaleDateString("de-DE")
    : null;

  // Funktion, um den Satz mit Platzhaltern zu ersetzen und Lösungen fett zu machen
  const formatSentenceWithSolutions = () => {
    const placeholders = wordData.satz.match(/_/g) || [];
    let solutions = Array.isArray(wordData.loesung) ? wordData.loesung : wordData.loesung.split(",").map((s) => s.trim());

    if (solutions.length === 1 && placeholders.length > 1) {
      solutions = Array(placeholders.length).fill(solutions[0]);
    }

    let formattedSentence = wordData.satz;
    solutions.forEach((solution) => {
      formattedSentence = formattedSentence.replace("_", `<strong>${solution}</strong>`);
    });

    return formattedSentence;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="perspective-1000"
    >
      <div
        className="w-full relative preserve-3d cursor-pointer"
        onClick={onFlip}
        style={{
          height: cardHeight,
          transformStyle: "preserve-3d",
          transition: "transform 0.6s",
          transform: showTranslation ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Vorderseite der Karte */}
        <div
          ref={frontCardRef}
          className="absolute inset-0 rounded-2xl p-8 flex flex-col justify-between bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-xl border border-white/20 backdrop-blur-sm"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex-grow flex items-center justify-center text-center">
            <h2 className="text-3xl font-bold">{wordData.satz || "Unbekannt"}</h2>
          </div>
          {(wordData.quelle || formattedDate) && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-sm text-white/60">
                {wordData.quelle || "Unbekannt"} {formattedDate && `(${formattedDate})`}
              </p>
            </div>
          )}
        </div>

        {/* Rückseite der Karte */}
        <div
          ref={backCardRef}
          className="absolute inset-0 rounded-2xl p-8 flex flex-col justify-between bg-gradient-to-br from-purple-400 to-pink-600 text-white shadow-xl border border-white/20 backdrop-blur-sm"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex-grow flex flex-col items-center justify-center text-center">
            <p className="text-3xl font-bold mb-6">{wordData.loesung || "Keine Lösung"}</p>
            <p
              className="text-xl font-medium text-green-100 rounded-md border p-4 bg-white/20 shadow-inner"
              dangerouslySetInnerHTML={{ __html: formatSentenceWithSolutions() }}
            />
          </div>
          {(wordData.quelle || formattedDate) && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-sm text-white/60">
                {wordData.quelle || "Unbekannt"} {formattedDate && `(${formattedDate})`}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}