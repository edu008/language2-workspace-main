// pages/praeposition.js
import { useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { debounce } from "lodash";
import Head from "next/head";
import Header from "../components/deutsch/Header";
import PraepositionCard from "../components/deutsch/WordCardPraeposition";
import ActionButtons from "../components/deutsch/ActionButtons";
import Stats from "../components/deutsch/Stats";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashRestore } from "@fortawesome/free-solid-svg-icons";
import LoadingScreen from "../components/deutsch/LoadingScreen";
import { AppContext } from "./context/AppContext";

export default function Praeposition() {
  const {
    session,
    progressPraep,
    totalCountPraep,
    praeposition,
    setPraeposition,
    standingSummaryPraep,
    setStandingSummaryPraep,
    isDataLoaded,
    setisDataLoaded,
    currentPraeposition,
    setCurrentPraeposition,
    trainedCount,
    attempts,
    saveToServerPraep,
    untrainedPraep,
    setUntrainedPoolPraep,
    repeatPoolPraep,
    setRepeatPoolPraep,
    settrainedCount,
    setAttempts,
    selectNextWordPraep,
    setLearnedPoolPraep,
  } = useContext(AppContext);

  const router = useRouter();
  const [showTranslation, setShowTranslation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isApplyingFilters, setIsApplyingFilters] = useState(false); // Umbenannt für Konsistenz, obwohl keine Filter

  const debouncedHandleClick = debounce((callback) => {
    if (!isApplyingFilters) callback();
  }, 1000);

  const handleOK = async () => {
    if (!currentPraeposition || isApplyingFilters) return;
    setIsApplyingFilters(true);
    let hasSelectedNextWord = false;

    try {
      const exercise = currentPraeposition.id;
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const standingResponse = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(exercise)}&kategorie=praeposition`
      );
      if (!standingResponse.ok) {
        throw new Error("Fehler beim Abrufen des Standing");
      }
      const standing = await standingResponse.json();

      const correct = standing && Object.keys(standing).length > 0 ? Math.min((standing.correct || 0) + 1, 2) : 1;

      const serverResponse = await saveToServerPraep("OK", {
        exercise,
        standingId: standing?.id,
        correct,
        attempts: newAttempts,
        kategorie: "praeposition",
      });

      if (serverResponse) {
        setStandingSummaryPraep((prev) => {
          const existing = prev.find((s) => s.exercise === exercise);
          if (existing) {
            return prev.map((s) =>
              s.exercise === exercise ? { ...s, correct, attempts: newAttempts } : s
            );
          }
          return [
            ...prev,
            {
              exercise,
              correct,
              attempts: newAttempts,
              Satz: currentPraeposition.Satz,
              Loesung: currentPraeposition.Loesung,
            },
          ];
        });
      }

      const updatedUntrained = untrainedPraep.filter((word) => word.id !== exercise);
      const updatedRepeatPool = correct < 2 ? [...repeatPoolPraep, currentPraeposition] : repeatPoolPraep;
      setUntrainedPoolPraep(updatedUntrained);
      setRepeatPoolPraep(updatedRepeatPool);
      if (correct === 2) settrainedCount((prev) => prev + 1);

      await new Promise((resolve) => setTimeout(resolve, 300));
      selectNextWordPraep();
      hasSelectedNextWord = true;
    } catch (error) {
      setErrorMessage("Fehler beim Speichern von OK. Fortfahren lokal...");
      setTimeout(() => setErrorMessage(""), 5000);

      const exercise = currentPraeposition.id;
      const newAttempts = attempts + 1;
      const correct = 1;
      const updatedUntrained = untrainedPraep.filter((word) => word.id !== exercise);
      const updatedRepeatPool = correct < 2 ? [...repeatPoolPraep, currentPraeposition] : repeatPoolPraep;
      setUntrainedPoolPraep(updatedUntrained);
      setRepeatPoolPraep(updatedRepeatPool);
      if (correct === 2) settrainedCount((prev) => prev + 1);

      if (!hasSelectedNextWord) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        selectNextWordPraep();
      }
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleNOK = async () => {
    if (!currentPraeposition || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      const exercise = currentPraeposition.id;
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const standingResponse = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(exercise)}&kategorie=praeposition`
      );
      const standing = await standingResponse.json();

      const serverResponse = await saveToServerPraep("NOK", {
        exercise,
        standingId: standing?.id,
        correct: 0,
        attempts: newAttempts,
      });

      if (serverResponse) {
        setStandingSummaryPraep((prev) => {
          const existing = prev.find((s) => s.exercise === exercise);
          if (existing) {
            return prev.map((s) =>
              s.exercise === exercise ? { ...s, correct: 0, attempts: newAttempts } : s
            );
          }
          return [
            ...prev,
            {
              exercise,
              correct: 0,
              attempts: newAttempts,
              Satz: currentPraeposition.Satz,
              Loesung: currentPraeposition.Loesung,
            },
          ];
        });
      }

      setUntrainedPoolPraep((prev) => [...prev, currentPraeposition]);
      setRepeatPoolPraep((prev) => prev.filter((word) => word.id !== exercise));
      await new Promise((resolve) => setTimeout(resolve, 300));
      selectNextWordPraep();
    } catch (error) {
      setErrorMessage("Fehler beim Speichern von NOK. Fortfahren lokal...");
      setTimeout(() => setErrorMessage(""), 5000);

      const exercise = currentPraeposition.id;
      const newAttempts = attempts + 1;
      setUntrainedPoolPraep((prev) => [...prev, currentPraeposition]);
      setRepeatPoolPraep((prev) => prev.filter((word) => word.id !== exercise));
      selectNextWordPraep();
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleREV = async () => {
    if (!session || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      await saveToServerPraep("REV");
      setUntrainedPoolPraep(praeposition);
      setRepeatPoolPraep([]);
      settrainedCount(0);
      setAttempts(0);
      setCurrentPraeposition(null);
      setStandingSummaryPraep([]);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      selectNextWordPraep();
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
        <title>Präpositionen</title>
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
        {currentPraeposition ? (
          <PraepositionCard
            wordData={{
              satz: currentPraeposition.Satz,
              loesung: currentPraeposition.Loesung,
              quelle: currentPraeposition.Quelle,
              datum: currentPraeposition.Datum ? new Date(currentPraeposition.Datum).toLocaleDateString("de-DE") : "Datum nicht verfügbar",
            }}
            showTranslation={showTranslation}
            onFlip={() => setShowTranslation(!showTranslation)}
          />
        ) : (
          <div>
            Keine Präpositionen verfügbar. Alle Präpositionen wurden gelernt! Setze den Fortschritt zurück, um fortzufahren.
          </div>
        )}
        {currentPraeposition && (
          <>
            <div className="mt-4" style={{ minHeight: "100px" }}>
              <ActionButtons
                onCorrect={() => debouncedHandleClick(handleOK)}
                onIncorrect={() => debouncedHandleClick(handleNOK)}
                isLoading={isApplyingFilters}
              />
            </div>
            <div className="mt-4" style={{ minHeight: "50px" }}>
              <Stats totalCount={totalCountPraep} trainedCount={trainedCount} attempts={attempts} progress={progressPraep} />
            </div>
          </>
        )}
        {standingSummaryPraep && standingSummaryPraep.length > 0 ? (
          <table className="table-auto border-collapse border border-gray-300 mt-4 w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Satz</th>
                <th className="border border-gray-300 p-2 text-left">Lösung</th>
              </tr>
            </thead>
            <tbody>
              {standingSummaryPraep.map((item, index) => (
                <tr key={item.exercise || index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="border border-gray-300 p-2">{item.Satz || "Unbekannt"}</td>
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