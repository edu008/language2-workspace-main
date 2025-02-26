import { animated, useSpring, useTransition } from "@react-spring/web";
import styles from "../../styles/WordCard.module.css";
import { useState, useCallback, useRef } from "react";

export default function WordCard({ wordData, showTranslation, onFlip }) {
  if (!wordData) {
    return <div>Loading...</div>;
  }

  const formattedDate = wordData.dateEntryWord
    ? new Date(wordData.dateEntryWord).toLocaleDateString("de-DE")
    : "Datum nicht verfügbar";

  const [isFlipping, setIsFlipping] = useState(false); // Umbenannt für Klarheit
  const animationComplete = useRef(true); // Verfolgt, ob die Animation abgeschlossen ist

  // Handle Flip mit präziserer Kontrolle
  const handleFlip = useCallback(() => {
    if (!animationComplete.current || isFlipping) return; // Verhindere Mehrfachklicks

    setIsFlipping(true);
    animationComplete.current = false; // Markiere, dass eine Animation läuft
    onFlip(); // Umschalten zwischen Wort und Übersetzung

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
    delay: showTranslation ? 0 : 100, // Verzögerung nur bei Wortanzeige
  });

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
          <div className={styles.cardContainer}>
            <div className={styles.topRightInfo}>
              Klicken zum {item ? "Wort" : "Übersetzung"} anzeigen
            </div>

            {/* Vorderseite (Wort & Details) */}
            {!item && (
              <div className={styles.innerContent}>
                <animated.p
                  style={{ ...detailSpring, delay: 100 }}
                  className="text-2xl text-blue-700"
                >
                  {wordData.article}
                </animated.p>
                <animated.h2
                  style={{ ...detailSpring, delay: 200 }}
                  className="text-5xl font-bold text-blue-900"
                >
                  {wordData.word}
                </animated.h2>
                <animated.p
                  style={{ ...detailSpring, delay: 300 }}
                  className="text-xl text-blue-700"
                >
                  {wordData.prefix} / {wordData.root}
                </animated.p>
                {wordData.structure && (
                  <animated.p
                    style={{ ...detailSpring, delay: 400 }}
                    className="text-lg text-gray-700"
                  >
                    Struktur: {wordData.structure}
                  </animated.p>
                )}
                {wordData.typeOfWord && wordData.typeOfWord.length > 0 && (
                  <animated.p
                    style={{ ...detailSpring, delay: 500 }}
                    className="text-lg text-gray-700"
                  >
                    Wortart: {wordData.typeOfWord.join(", ")}
                  </animated.p>
                )}
                {wordData.additionalInfo && (
                  <animated.p
                    style={{ ...detailSpring, delay: 600 }}
                    className="text-lg text-gray-700"
                  >
                    Stamm: {wordData.additionalInfo}
                  </animated.p>
                )}
                <div className="mt-8 rounded-md border p-4 overflow-y-auto bg-white shadow-inner">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Beispiel</h4>
                  <div className="space-y-4">
                    {wordData.examples.map((example, index) => (
                      <div key={index} className="space-y-2">
                        <p className="text-blue-900">{example.sentence}</p>
                        <p className="text-sm text-gray-500">Quelle: {example.source}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500 mt-2">
                  Hinzugefügt am: {formattedDate}
                </div>
              </div>
            )}

            {/* Rückseite (nur Übersetzung) */}
            {item && (
              <div className="flex items-center justify-center h-full w-full">
                <animated.h3
                  style={detailSpring}
                  className="text-4xl font-medium text-blue-900"
                >
                  {wordData.translation}
                </animated.h3>
              </div>
            )}
          </div>
        </animated.div>
      ))}
    </animated.div>
  );
}