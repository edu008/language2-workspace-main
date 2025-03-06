// pages/praepverben.js
import { useContext, useState } from "react";
import { debounce } from "lodash";
import Head from "next/head";
import Header from "../components/deutsch/Header";
import PraepverbenCard from "../components/deutsch/WordCardPraepverben";
import ActionButtons from "../components/deutsch/ActionButtons";
import Stats from "../components/deutsch/Stats";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashRestore } from "@fortawesome/free-solid-svg-icons";
import LoadingScreen from "../components/deutsch/LoadingScreen";
import { AppContext } from "./context/AppContext";

export default function Praepverben() {
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
    handlePraepverbenFeedback,
    resetPraepverbenLearningProgress,
  } = useContext(AppContext);

  const [showTranslation, setShowTranslation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  const debouncedHandleClick = debounce((callback) => {
    if (!isApplyingFilters) callback();
  }, 1000);

  const handleOK = async () => {
    if (!currentItem.praepverben || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      await handlePraepverbenFeedback(true);
    } catch (error) {
      setErrorMessage("Fehler beim Speichern von OK. Fortfahren lokal...");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleNOK = async () => {
    if (!currentItem.praepverben || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      await handlePraepverbenFeedback(false);
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
      await resetPraepverbenLearningProgress();
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
        <title>Präpositionen & Verben</title>
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
        {currentItem.praepverben ? (
          <PraepverbenCard
            wordData={{
              satz: currentItem.praepverben.Satz,
              verb: currentItem.praepverben.Verb,
              loesung: currentItem.praepverben.Loesung,
              beispiele: currentItem.praepverben.Beispiele,
              erklaerung: currentItem.praepverben.Erklaerung,
              quelle: currentItem.praepverben.quelle,
              datum: currentItem.praepverben.Datum
                ? new Date(currentItem.praepverben.Datum).toLocaleDateString("de-DE")
                : "Datum nicht verfügbar",
            }}
            showTranslation={showTranslation}
            onFlip={() => setShowTranslation(!showTranslation)}
          />
        ) : (
          <div>
            Keine Präpositionen & Verben verfügbar. Alle wurden gelernt! Setze den Fortschritt zurück, um fortzufahren.
          </div>
        )}
        {currentItem.praepverben && (
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
                totalCount={stats.praepverben.totalCount}
                trainedCount={trainedCount}
                attempts={attempts}
                progress={stats.praepverben.progress}
              />
            </div>
          </>
        )}
        {standingSummary.praepverben && standingSummary.praepverben.length > 0 ? (
          <table className="table-auto border-collapse border border-gray-300 mt-4 w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Satz</th>
                <th className="border border-gray-300 p-2 text-left">Verb</th>
                <th className="border border-gray-300 p-2 text-left">Lösung</th>
              </tr>
            </thead>
            <tbody>
              {standingSummary.praepverben.map((item, index) => (
                <tr key={item.exercise || index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="border border-gray-300 p-2">{item.Satz || "Unbekannt"}</td>
                  <td className="border border-gray-300 p-2">{item.Verb || "Unbekannt"}</td>
                  <td className="border border-gray-300 p-2">{item.Loesung || "Keine Lösung"}</td>
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