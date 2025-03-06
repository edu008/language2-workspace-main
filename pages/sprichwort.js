// pages/sprichwort.js
import { useContext, useState } from "react";
import { debounce } from "lodash";
import Head from "next/head";
import Header from "../components/layout/Header";
import SprichwortCard from "../components/deutsch/WordCardSprichwort";
import ActionButtons from "../components/deutsch/ActionButtons";
import Stats from "../components/deutsch/Stats";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashRestore } from "@fortawesome/free-solid-svg-icons";
import LoadingScreen from "../components/deutsch/LoadingScreen";
import { AppContext } from "./context/AppContext";

export default function Sprichwort() {
  const {
    session,
    status,
    isDataLoaded,
    data,
    currentItem,
    pools,
    stats,
    standingSummary,
    attempts,
    trainedCount,
    handleSprichwortFeedback,
    resetSprichwortLearningProgress,
  } = useContext(AppContext);

  const [showTranslation, setShowTranslation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  const debouncedHandleClick = debounce((callback) => {
    if (!isApplyingFilters) callback();
  }, 1000);

  const handleOK = async () => {
    if (!currentItem.sprichwort || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      await handleSprichwortFeedback(true);
    } catch (error) {
      setErrorMessage("Fehler beim Speichern von OK. Fortfahren lokal...");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleNOK = async () => {
    if (!currentItem.sprichwort || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      await handleSprichwortFeedback(false);
    } catch (error) {
      setErrorMessage("Fehler beim Speichern von NOK. Fortfahren lokal...");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleREV = async () => {
    if (!session || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      await resetSprichwortLearningProgress();
    } catch (error) {
      setErrorMessage("Fehler beim Zurücksetzen des Spielstands.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  if (!session) return <LoadingScreen message="Authentifizierung läuft..." />;
  if (!isDataLoaded) return <LoadingScreen message="Lade Spielstand..." />;

  return (
    <>
      <Head>
        <title>Sprichwörter</title>
      </Head>
      <Header session={session} />
      <main className="flex justify-end items-start w-full p-6 z-0" style={{ marginTop: "96px" }}>
        <div className="flex gap-4">
          <button
            onClick={handleREV}
            className="py-2 px-4 rounded-md bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faTrashRestore} />
            Alle Daten löschen
          </button>
        </div>
      </main>

      <div
        className="max-w-5xl mx-auto py-2 px-4 sm:px-6 lg:px-8"
        style={{ minHeight: "800px", display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        {currentItem.sprichwort ? (
          <SprichwortCard
            wordData={{
              sprichwort: currentItem.sprichwort.Sprichwort,
              wort: currentItem.sprichwort.Wort,
              erklaerung: currentItem.sprichwort.Erklaerung,
              beispiel: currentItem.sprichwort.Beispiel,
              quelle: currentItem.sprichwort.Quelle,
              datum: currentItem.sprichwort.Datum
                ? new Date(currentItem.sprichwort.Datum).toLocaleDateString("de-DE")
                : "Datum nicht verfügbar",
            }}
            showTranslation={showTranslation}
            onFlip={() => setShowTranslation(!showTranslation)}
          />
        ) : (
          <div>
            Keine Sprichwörter verfügbar. Alle Sprichwörter wurden gelernt! Setze den Fortschritt zurück, um fortzufahren.
          </div>
        )}
        {currentItem.sprichwort && (
          <>
            <div className="mt-4" style={{ minHeight: "100px" }}>
              <ActionButtons
                onCorrect={() => debouncedHandleClick(handleOK)}
                onIncorrect={() => debouncedHandleClick(handleNOK)}
                isLoading={isApplyingFilters}
              />
            </div>
            <div className="mt-4" style={{ minHeight: "50px" }}>
              <Stats
                totalCount={stats.sprichwort.totalCount}
                trainedCount={trainedCount}
                attempts={attempts}
                progress={stats.sprichwort.progress}
              />
            </div>
          </>
        )}
        {standingSummary.sprichwort && standingSummary.sprichwort.length > 0 ? (
          <table className="table-auto border-collapse border border-gray-300 mt-4 w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Sprichwort</th>
                <th className="border border-gray-300 p-2 text-left">Hauptwort</th>
                <th className="border border-gray-300 p-2 text-left">Erklärung</th>
                <th className="border border-gray-300 p-2 text-left">Beispiel</th>
                <th className="border border-gray-300 p-2 text-left">Quelle</th>
              </tr>
            </thead>
            <tbody>
              {standingSummary.sprichwort.map((item, index) => (
                <tr key={item.exercise || index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="border border-gray-300 p-2">{item.Sprichwort || "Unbekannt"}</td>
                  <td className="border border-gray-300 p-2">{item.Wort || ""}</td>
                  <td className="border border-gray-300 p-2">{item.Erklaerung || "Keine Erklärung"}</td>
                  <td className="border border-gray-300 p-2">{item.Beispiel || ""}</td>
                  <td className="border border-gray-300 p-2">{item.Quelle || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p></p>
        )}
      </div>
    </>
  );
}