import { motion, AnimatePresence } from "framer-motion";
import styles from "../../styles/WordCard.module.css";

export default function WordCard({ wordData, showTranslation, onFlip }) {
  const formattedDate = wordData.dateEntryWord
    ? new Date(wordData.dateEntryWord).toLocaleDateString("de-DE")
    : "Datum nicht verfügbar";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={showTranslation ? "translation" : "word"}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.cardContainer} onClick={onFlip}>
          <div className={styles.topRightInfo}>
            Klicken zum {showTranslation ? "Wort" : "Übersetzung"} anzeigen
          </div>

          {/* Vorderseite (Wort & Details) */}
          {!showTranslation && (
            <div className={styles.innerContent}>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl text-blue-700"
              >
                {wordData.article}
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl font-bold text-blue-900"
              >
                {wordData.word}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-blue-700"
              >
                {wordData.prefix} / {wordData.root}
              </motion.p>
              {wordData.structure && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-gray-700"
                >
                  Struktur: {wordData.structure}
                </motion.p>
              )}
              {wordData.typeOfWord && wordData.typeOfWord.length > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-gray-700"
                >
                  Wortart: {wordData.typeOfWord.join(", ")}
                </motion.p>
              )}
              {wordData.additionalInfo && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg text-gray-700"
                >
                  Stamm: {wordData.additionalInfo}
                </motion.p>
              )}
            </div>
          )}

          {/* Rückseite (nur Übersetzung) */}
          {showTranslation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center h-full w-full"
            >
              <h3 className="text-4xl font-medium text-blue-900">
                {wordData.translation}
              </h3>
            </motion.div>
          )}

          {/* Beispielbox nur auf der Vorderseite */}
          {!showTranslation && (
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
          )}

          {/* Hinzugefügt am: Datum unten rechts – nur auf der Vorderseite */}
          {!showTranslation && (
            <div className="text-right text-xs text-gray-500 mt-2">
              Hinzugefügt am: {formattedDate}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}