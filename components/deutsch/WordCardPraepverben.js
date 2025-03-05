import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const PraepverbenCard = ({ wordData, showTranslation, onFlip }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const splitText = (text) => {
    return text ? text.split('\n').filter((v) => v.trim() !== '') : [];
  };

  // Berechne die benötigte Höhe basierend auf der Anzahl und Länge der Beispiele
  const calculateCardHeight = () => {
    const examples = splitText(wordData.beispiele);
    if (!examples || examples.length === 0) return "440px"; // Standardhöhe, wenn keine Beispiele vorhanden sind

    // Berechne die Höhe basierend auf der Anzahl der Beispiele und ihrer Länge
    const baseHeight = 440; // Standardhöhe der Karte
    const exampleHeightPerLine = 40; // Höhe pro Beispielzeile (in Pixeln)
    const maxExamplesHeight = 300; // Maximale zusätzliche Höhe für Beispiele

    let totalExamplesHeight = examples.length * exampleHeightPerLine;
    // Begrenze die zusätzliche Höhe auf maxExamplesHeight
    totalExamplesHeight = Math.min(totalExamplesHeight, maxExamplesHeight);

    // Füge eine Pufferhöhe hinzu, um sicherzustellen, dass die Karte nicht zu klein wird
    return `${baseHeight + totalExamplesHeight}px`;
  };

  const cardHeight = calculateCardHeight();

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
          height: cardHeight, // Dynamische Höhe
        }}
      >
        {/* Front of card */}
        <div 
          className="absolute inset-0 rounded-2xl p-8 flex flex-col justify-between bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-xl border border-white/20 backdrop-blur-sm"
          style={{ 
            backfaceVisibility: "hidden",
          }}
        >
          <div>
            <div className="inline-block px-3 py-1 mb-4 text-xs font-medium bg-white/20 rounded-full backdrop-blur-sm">
              Präposition & Verb
            </div>
            <h2 className="text-3xl font-bold mb-6">{wordData.satz}</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-white/70 font-medium">Verb</p>
                <p className="text-white leading-relaxed">{wordData.verb}</p>
              </div>
              <div className="mt-4 rounded-md border p-4 overflow-y-auto bg-gray-100 shadow-inner">
                <h4 className="text-lg font-semibold text-blue-900 mb-2">Beispiele</h4>
                <div className="space-y-4">
                  {splitText(wordData.beispiele).map((beispiel, index) => (
                    <div key={index} className="space-y-2">
                      <p className="text-blue-900">{beispiel}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-sm text-white/60">
              {wordData.quelle} {wordData.datum && `(${wordData.datum})`}
            </p>
          </div>
        </div>

        {/* Back of card */}
        <div 
          className="absolute inset-0 rounded-2xl p-8 flex flex-col justify-between bg-gradient-to-br from-purple-400 to-pink-600 text-white shadow-xl border border-white/20 backdrop-blur-sm"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <div>
            <div className="inline-block px-3 py-1 mb-4 text-xs font-medium bg-white/20 rounded-full backdrop-blur-sm">
              Lösung & Erklärung
            </div>
            <p className="text-xl font-bold mb-4">{wordData.loesung}</p>
            <p className="text-white leading-relaxed">{wordData.erklaerung}</p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-sm text-white/60">
              {wordData.quelle} {wordData.datum && `(${wordData.datum})`}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PraepverbenCard;