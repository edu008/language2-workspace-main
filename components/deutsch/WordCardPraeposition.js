import { animated, useSpring, useTransition } from "@react-spring/web";
import styles from "../../styles/WordCard.module.css"; // Du kannst dieselben Stile verwenden oder ein neues Modul erstellen
import { useState, useCallback, useRef } from "react";

export default function PraepositionCard({ wordData, showTranslation, onFlip, trained, totalCount }) {
  if (!wordData) {
    return <div>Loading...</div>;
  }

  // Formatierung des Datums, falls vorhanden (hier null, daher Fallback)
  const formattedDate = wordData.datum
    ? new Date(wordData.datum).toLocaleDateString("de-DE")
    : "Datum nicht verfügbar";

  const [isFlipping, setIsFlipping] = useState(false); // Umbenannt für Klarheit
  const animationComplete = useRef(true); // Verfolgt, ob die Animation abgeschlossen ist

  // Handle Flip mit präziserer Kontrolle
  const handleFlip = useCallback(() => {
    if (!animationComplete.current || isFlipping) return; // Verhindere Mehrfachklicks

    setIsFlipping(true);
    animationComplete.current = false; // Markiere, dass eine Animation läuft
    onFlip(); // Umschalten zwischen Satz und Lösung

    // Setze den Status zurück, sobald die Animation abgeschlossen ist
    setTimeout(() => {
      setIsFlipping(false);
      animationComplete.current = true;
    }, 900); // 900ms = 800ms Animation + 100ms Puffer
  }, [onFlip, isFlipping]);

  // Basis-Animation für die gesamte Karte (Skalierung und leichte Drehung)
  const cardSpring = useSpring({
    from: { scale: 0.85, rotateX: "10deg", translateY: 30 },
    to: { scale: 1, rotateX: "0deg", translateY: 0 },
    config: { duration: 800, easing: (t) => t * t * (3 - 2 * t) }, // easeInOut
    onRest: () => {
      // Optional, falls zusätzliche Logik benötigt wird
    },
  });

  // Übergang für den Inhalt (Flip-Effekt mit Rotation und Verschiebung)
  const transitions = useTransition(showTranslation, {
    from: { scale: 0.9, rotateY: "90deg", translateY: 20, opacity: 0 }, // Hinzugefügt Opacity für Übergang
    enter: { scale: 1, rotateY: "0deg", translateY: 0, opacity: 1 },
    leave: { scale: 0.9, rotateY: "-90deg", translateY: 20, opacity: 0 },
    config: { duration: 800 },
    unique: true, // Stellt sicher, dass nur eine Instanz gleichzeitig existiert
    exitBeforeEnter: true, // Verhindert das Überlagern von alten und neuen Elementen
  });

  // Individuelle Animationen für die Wort-Details (Skalierung und Verschiebung)
  const detailSpring = useSpring({
    from: { scale: 0.95, translateY: 15 },
    to: { scale: 1, translateY: 0 },
    delay: showTranslation ? 0 : 100, // Verzögerung nur bei Anzeige des Satzes
  });

  // Funktion, um den Satz mit Platzhaltern zu ersetzen und die Lösungen fett zu machen
  const formatSentenceWithSolutions = () => {
    // Find all placeholder underscores
    const placeholders = wordData.satz.match(/_/g) || [];
    
    // Handle solution as array (even if it's a single string)
    let solutions = Array.isArray(wordData.loesung) ? wordData.loesung : wordData.loesung.split(',').map(s => s.trim());
    
    // If only one word but multiple placeholders, replicate it for all placeholders
    if (solutions.length === 1 && placeholders.length > 1) {
      solutions = Array(placeholders.length).fill(solutions[0]);
    }
    
    // Replace each underscore with the corresponding solution in bold
    let formattedSentence = wordData.satz;
    solutions.forEach((solution, index) => {
      formattedSentence = formattedSentence.replace('_', `<strong>${solution}</strong>`);
    });
    
    return formattedSentence;
  };

  return (
    <animated.div
      style={{
        ...cardSpring,
        position: "relative",
        transformStyle: "preserve-3d", // Für 3D-Effekte
      }}
      onClick={handleFlip} // Direktes Klicken auf die animierte Karte
    >
      {transitions((style, item) => (
        <animated.div style={style}>
          <div className={`${styles.cardContainer} ${item ? styles.translation : ""}`}>
            <div className={styles.topRightInfo}>
              Klicken zum {item ? "Satz" : "Lösung"} anzeigen
            </div>
            {trained !== undefined && totalCount !== undefined && (
              <div className={styles.progressInfo}>
                Fortschritt: {trained} von {totalCount} gelernt
              </div>
            )}

            {/* Vorderseite (Satz & Details) */}
            {!item && (
              <div className={styles.innerContent}>
                <animated.h2
                  style={{ ...detailSpring, delay: 200 }}
                  className="text-5xl font-bold text-blue-900"
                >
                  {wordData.satz.replace("–", <span className={styles.gapHighlight}>–</span>)}
                </animated.h2>
                {wordData.quelle && (
                  <animated.p
                    style={{ ...detailSpring, delay: 300 }}
                    className="text-lg text-gray-700"
                  >
                    Quelle: {wordData.quelle}
                  </animated.p>
                )}
                <div className="text-right text-xs text-gray-500 mt-2">
                  Hinzugefügt am: {formattedDate}
                </div>
              </div>
            )}

            {/* Rückseite (Lösung und vollständiger Satz) */}
            {item && (
              <div className={styles.innerContent}>
                <animated.h3
                  style={{ ...detailSpring, delay: 100 }}
                  className="text-4xl font-semibold text-black mb-4"
                >
                  Lösung:
                </animated.h3>
                <animated.h3
                  style={detailSpring}
                  className="text-5xl font-medium text-blue-900 mb-4"
                >
                  {wordData.loesung}
                </animated.h3>
                <animated.p
                  style={{ ...detailSpring, delay: 200 }}
                  className="text-2xl font-medium text-green-600 mt-8 rounded-md border p-4 bg-white shadow-inner"
                  dangerouslySetInnerHTML={{ __html: formatSentenceWithSolutions() }}
                />
                <div className={`${styles.date} text-right text-xs text-gray-500 mt-2`}>
                  Hinzugefügt am: {formattedDate}
                </div>
              </div>
            )}
          </div>
        </animated.div>
      ))}
    </animated.div>
  );
}