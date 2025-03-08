import { useState, useEffect, useRef, memo } from "react";
import { motion } from "framer-motion";
import { useDeutschContext } from "../../contexts/AppContext";

// Use memo to prevent unnecessary re-renders
const WordCard = memo(function WordCard({ showTranslation, onFlip }) {
  const { currentItem } = useDeutschContext();
  const [isVisible, setIsVisible] = useState(false);
  
  // Use a fixed height to prevent layout shifts
  const cardHeight = "500px"; // Fixed height instead of dynamic calculation
  
  const frontCardRef = useRef(null);
  const backCardRef = useRef(null);

  // Effekt für die Einblendanimation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!currentItem) {
    return (
      <div className="w-full min-h-[440px] rounded-2xl bg-gray-200 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Lade Daten...</p>
      </div>
    );
  }

  const formattedDate = currentItem.DateEntryWord
    ? new Date(currentItem.DateEntryWord).toLocaleDateString("de-DE")
    : "Datum nicht verfügbar";

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
          <div>
            <h2 className="text-3xl font-bold mb-6">{currentItem.Word || "Unbekannt"}</h2>
            {(currentItem.Artikel || currentItem.Prefix || currentItem.Root) && (
              <p className="inline-block px-3 py-1 mb-4 text-xl font-bold bg-white/20 rounded-full backdrop-blur-sm">
                {currentItem.Artikel || ""}{" "}
                {currentItem.Prefix && currentItem.Root
                  ? `${currentItem.Prefix}- ${currentItem.Root}`
                  : `${currentItem.Prefix || ""}${currentItem.Root || ""}`}
              </p>
            )}

            {currentItem.Definition && (
              <p className="text-white/70">Struktur: {currentItem.Definition}</p>
            )}
            {currentItem.TypeOfWord?.length > 0 && (
              <p className="text-white/70">
                Wortart: {currentItem.TypeOfWord.map((t) => t.TypeOfWord).join(", ")}
              </p>
            )}
            {currentItem.Root && (
              <p className="text-white/70">Stamm: {currentItem.Root}</p>
            )}
            <div className="mt-6 pt-4 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">Beispiel</h3>
              <div className="space-y-4">
                {Array.isArray(currentItem.Article) && currentItem.Article.length > 0 ? (
                  currentItem.Article.map((example, index) => (
                    <div key={index} className="space-y-2 leading-relaxed bg-white/20 p-2 rounded-md">
                      <p className="text-white">{example.Sentence_D || "Kein Satz verfügbar"}</p>
                      <p className="text-sm text-white/60">
                        Quelle: {example.Source || "Keine Quelle verfügbar"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-white/60">Keine Beispiele verfügbar.</p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-sm text-white/60">Hinzugefügt am: {formattedDate}</p>
          </div>
        </div>

        {/* Rückseite der Karte */}
        <div
          ref={backCardRef}
          className="absolute inset-0 rounded-2xl p-8 flex flex-col justify-center bg-gradient-to-br from-purple-400 to-pink-600 text-white shadow-xl border border-white/20 backdrop-blur-sm"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div>
            <p className="text-white leading-relaxed text-3xl font-bold text-center">
              {currentItem.Transl_F?.map((t) => t.Transl_F).join("; ") || "Keine Übersetzung"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default WordCard;
