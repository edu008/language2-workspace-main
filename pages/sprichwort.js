import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { debounce } from "lodash";
import Head from "next/head";
import Header from "../components/deutsch/Header";
import ActionButtons from "../components/deutsch/ActionButtons";
import Stats from "../components/deutsch/Stats";
import SprichwortCard from "../components/deutsch/WordCardSprichwort";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashRestore } from "@fortawesome/free-solid-svg-icons";
import LoadingScreen from "../components/deutsch/LoadingScreen";
import { Button } from "@material-tailwind/react";
import { getSprichwortCount, getSprichwort } from "../prisma/sprichwort";

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  let sprichwort = [];
  try {
    sprichwort = await getSprichwort();
    console.log("Rohdaten von getSprichwort:", sprichwort);
    if (!Array.isArray(sprichwort)) {
      console.error("getSprichwort returned non-array:", sprichwort);
      sprichwort = [];
    }
    sprichwort.forEach((document) => {
      if (document.Datum instanceof Date) {
        document.Datum = document.Datum.toISOString();
      }
    });
  } catch (error) {
    console.error("Fehler beim Abrufen von sprichwort:", error);
    sprichwort = [];
  }

  const sprichwortCount = await getSprichwortCount().catch((error) => {
    console.error("Fehler beim Abrufen von sprichwortCount:", error);
    return 0;
  });

  console.log("Finale sprichwort-Daten:", sprichwort);
  console.log("sprichwortCount:", sprichwortCount);

  return {
    props: {
      sprichwortCount,
      sprichwort,
    },
  };
}

export default function Sprichwort({ sprichwortCount, sprichwort }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentSprichwort, setCurrentSprichwort] = useState(null);
  const [untrained, setUntrained] = useState(sprichwort);
  const [repeatPool, setRepeatPool] = useState([]);
  const [trained, setTrained] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [standingSummary, setStandingSummary] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const kategorie = "sprichwort";

  console.log("Initial sprichwort (Props):", sprichwort);
  console.log("Initial untrained:", untrained);
  console.log("Initial repeatPool:", repeatPool);
  console.log("Initial currentSprichwort:", currentSprichwort);
  console.log("Initial standingSummary:", standingSummary);

  useEffect(() => {
    if (typeof window !== "undefined" && status === "authenticated" && !isDataLoaded) {
      console.log("Starte loadStanding...");
      loadStanding();
    }
  }, [status, isDataLoaded]);

  const debouncedHandleClick = debounce((callback) => {
    if (!isApplyingFilters) {
      console.log("Debounced handleREV called (kategorie=sprichwort)");
      callback();
    }
  }, 1000);

  const loadStanding = async () => {
    if (!session || isDataLoaded) return;
    try {
      const response = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=${kategorie}`,
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to load standing: ${response.status} - ${await response.text()}`);
      }
      const data = await response.json();
      console.log("Standing Data Loaded (kategorie=sprichwort):", data);

      if (!data.summary || !Array.isArray(data.summary)) {
        console.error("Keine oder ungültige summary-Daten erhalten (kategorie=sprichwort):", data);
        resetState();
        setStandingSummary([]);
        setIsDataLoaded(true);
        return;
      }

      const sprichwortStandings = data.summary.filter((item) => item.kategorie === "sprichwort");
      console.log("Filtered Standings (kategorie=sprichwort):", sprichwortStandings);
      console.log("Anzahl gefilterter Standings:", sprichwortStandings.length);

      applyStandingToWords(sprichwortStandings);
      const newStandingSummary = sprichwortStandings
        .map((item) => {
          const s = sprichwort.find((spr) => spr.id === item.exercise);
          console.log(
            `Mapping exercise ${item.exercise} (kategorie=sprichwort): Found sprichwort - ${
              s ? s.Sprichwort : "none"
            }`
          );
          if (!s) return null;
          return {
            Sprichwort: s.Sprichwort || "",
            Wort: s.Wort || "",
            Erklaerung: s.Erklaerung || "",
            Beispiel: s.Beispiel || "",
            Quelle: s.Quelle || "",
            Datum: s.Datum ? new Date(s.Datum).toLocaleDateString("de-DE") : "",
          };
        })
        .filter((item) => item !== null);
      console.log("Erstelltes standingSummary vor Setzen:", newStandingSummary);
      setStandingSummary(newStandingSummary);
      setLoadingError(null);
    } catch (error) {
      console.error("Fehler beim Laden des Standing (kategorie=sprichwort):", error);
      setLoadingError(error.message);
      resetState();
      setStandingSummary([]);
      setIsDataLoaded(true);
    }
  };

  const applyStandingToWords = (standing) => {
    if (!standing || standing.length === 0) {
      console.log("Kein Spielstand vorhanden, initialisiere mit allen Sprichwörtern (kategorie=sprichwort).");
      resetState();
    } else {
      console.log(
        "Spielstand vorhanden, initialisiere Pools basierend auf Standing-Daten (kategorie=sprichwort):",
        standing
      );
      const learnedIds = standing.filter((s) => s.correct === 2).map((s) => s.exercise);
      const repeatIds = standing.filter((s) => s.correct === 1).map((s) => s.exercise);
      const nokIds = standing.filter((s) => s.correct === 0).map((s) => s.exercise);

      const untrainedWords = sprichwort.filter(
        (word) => !learnedIds.includes(word.id) && !repeatIds.includes(word.id) && !nokIds.includes(word.id)
      );
      const repeatPoolWords = sprichwort.filter((word) =>
        repeatIds.includes(word.id) || nokIds.includes(word.id)
      );

      console.log("Untrained Words (kategorie=sprichwort):", untrainedWords.length, untrainedWords);
      console.log("RepeatPool Words (kategorie=sprichwort):", repeatPoolWords.length, repeatPoolWords);
      console.log("Learned IDs (correct = 2, kategorie=sprichwort):", learnedIds.length, learnedIds);
      console.log("Repeat IDs (correct = 1, kategorie=sprichwort):", repeatIds.length, repeatIds);
      console.log("NOK IDs (correct = 0, kategorie=sprichwort):", nokIds.length, nokIds);

      setUntrained(untrainedWords);
      setRepeatPool(repeatPoolWords);
      const maxAttempts = standing.reduce((max, s) => Math.max(max, s.attempts || 0), 0);
      setAttempts(maxAttempts);
      setTrained(learnedIds.length);
    }
    setIsDataLoaded(true);
    applyNextSprichwort();
  };

  const resetState = () => {
    setUntrained(sprichwort);
    setRepeatPool([]);
    setTrained(0);
    setAttempts(0);
    setStandingSummary([]);
    setCurrentSprichwort(null);
    console.log("State zurückgesetzt: untrained =", sprichwort);
  };

  const saveToServer = async (action, exerciseData = {}) => {
    if (!session) return;
    const { exercise, standingId, correct, attempts } = exerciseData;
    const validatedCorrect = Number.isInteger(correct) && correct >= 0 && correct <= 2 ? correct : 0;
    const payloadKategorie = "sprichwort";

    try {
      let response;
      const payload = {
        user: session.user.email,
        exercise,
        button: action,
        kategorie: payloadKategorie,
        correct: validatedCorrect,
        attempts: attempts ?? 0,
      };
      console.log(`Saving to server (kategorie=${payloadKategorie}): action=${action}, payload=`, payload);

      if (action === "OK" || action === "NOK") {
        if (standingId) {
          response = await fetch("/api/standing", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              standingIN: standingId,
              ...payload,
            }),
          });
        } else {
          response = await fetch("/api/standing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
      } else if (action === "REV") {
        response = await fetch("/api/standing", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: session.user.email,
            kategorie: payloadKategorie,
          }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server responded with ${response.status}: ${errorText} (kategorie=${payloadKategorie})`);
        throw new Error(`Fehler bei ${action} Aktion: ${errorText}`);
      }
      const data = await response.json();
      console.log("Server response (kategorie=sprichwort):", data);
      if (action === "REV") {
        setStandingSummary([]);
      } else if (action === "OK" || action === "NOK") {
        await loadStanding();
      }
      return data;
    } catch (error) {
      console.error(`Fehler beim Senden an Server (kategorie=${payloadKategorie}, ${action}):`, error);
      throw error;
    }
  };

  const applyNextSprichwort = async () => {
    if (isApplyingFilters || (!Array.isArray(untrained) || !Array.isArray(repeatPool))) {
      console.error("Ungültige Pools (kategorie=sprichwort):", { untrained, repeatPool });
      return;
    }
    setIsApplyingFilters(true);
    try {
      console.log("applyNextSprichwort: untrained =", untrained);
      console.log("applyNextSprichwort: repeatPool =", repeatPool);

      const randomCount = Math.floor(Math.random() * 8) + 3;
      const pool = attempts > 0 && randomCount === 10 && repeatPool.length > 0 ? repeatPool : untrained;

      if (pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        const randomSprichwort = { ...pool[randomIndex] };
        randomSprichwort.Datum = randomSprichwort.Datum
          ? new Date(randomSprichwort.Datum).toLocaleDateString("de-DE")
          : "";
        setCurrentSprichwort(randomSprichwort);
        console.log("Gewähltes Sprichwort:", randomSprichwort);
      } else {
        setCurrentSprichwort(null);
        console.log("Keine Sprichwörter verfügbar in pool.");
      }
    } finally {
      setIsApplyingFilters(false);
    }
  };

  useEffect(() => {
    if (isDataLoaded && !isApplyingFilters) {
      console.log("Trigger applyNextSprichwort nach Datenladung...");
      const timer = setTimeout(() => applyNextSprichwort(), 200);
      return () => clearTimeout(timer);
    }
  }, [untrained, repeatPool, attempts, isDataLoaded]);

  const handleOK = async () => {
    if (!currentSprichwort || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      const exercise = currentSprichwort.id;
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const standingResponse = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(
          exercise
        )}&kategorie=${kategorie}`
      );
      const standing = await standingResponse.json();
      console.log("Standing Response for OK (kategorie=sprichwort):", standing);

      const correct = standing && Object.keys(standing).length > 0 ? Math.min((standing.correct || 0) + 1, 2) : 1;

      await saveToServer("OK", {
        exercise,
        standingId: standing?.id,
        correct,
        attempts: newAttempts,
      });

      setUntrained((prev) => prev.filter((word) => word.id !== exercise));
      setRepeatPool((prev) => (correct < 2 ? [...prev, currentSprichwort] : prev));

      if (correct === 2) setTrained((prev) => prev + 1);

      const newEntry = {
        Sprichwort: currentSprichwort.Sprichwort,
        Wort: currentSprichwort.Wort,
        Erklaerung: currentSprichwort.Erklaerung,
        Beispiel: currentSprichwort.Beispiel,
        Quelle: currentSprichwort.Quelle,
        Datum: currentSprichwort.Datum ? new Date(currentSprichwort.Datum).toLocaleDateString("de-DE") : "",
      };
      setStandingSummary((prev) => {
        const updatedSummary = prev.some((entry) => entry.Sprichwort === newEntry.Sprichwort)
          ? prev
          : [...prev, newEntry];
        console.log("Neues standingSummary nach OK:", updatedSummary);
        return updatedSummary;
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
      await applyNextSprichwort();
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleNOK = async () => {
    if (!currentSprichwort || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      const exercise = currentSprichwort.id;
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const standingResponse = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(
          exercise
        )}&kategorie=${kategorie}`
      );
      const standing = await standingResponse.json();
      console.log("Standing Response for NOK (kategorie=sprichwort):", standing);

      await saveToServer("NOK", {
        exercise,
        standingId: standing?.id,
        correct: 0,
        attempts: newAttempts,
      });

      setUntrained((prev) => [...prev, currentSprichwort]);
      setRepeatPool((prev) => prev.filter((word) => word.id !== exercise));

      const newEntry = {
        Sprichwort: currentSprichwort.Sprichwort,
        Wort: currentSprichwort.Wort,
        Erklaerung: currentSprichwort.Erklaerung,
        Beispiel: currentSprichwort.Beispiel,
        Quelle: currentSprichwort.Quelle,
        Datum: currentSprichwort.Datum ? new Date(currentSprichwort.Datum).toLocaleDateString("de-DE") : "",
      };
      setStandingSummary((prev) => {
        const updatedSummary = prev.some((entry) => entry.Sprichwort === newEntry.Sprichwort)
          ? prev
          : [...prev, newEntry];
        console.log("Neues standingSummary nach NOK:", updatedSummary);
        return updatedSummary;
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
      await applyNextSprichwort();
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleREV = async () => {
    if (!session || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      console.log("Starting handleREV - deleting standings and resetting state (kategorie=sprichwort)...");
      const response = await saveToServer("REV");
      console.log("Server response after DELETE (kategorie=sprichwort):", response);
      console.log(
        "Alle Standing-Einträge für den Benutzer (kategorie=sprichwort) gelöscht und Score zurückgesetzt."
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));
      resetState();
      setIsDataLoaded(false);
      await loadStanding();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await applyNextSprichwort();
    } catch (error) {
      console.error("Fehler in handleREV (kategorie=sprichwort):", error);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  useEffect(() => {
    if (router.query.redirected === "true" && !isDataLoaded && !isApplyingFilters) {
      setIsDataLoaded(false);
      loadStanding();
      resetState();
      router.replace("/sprichwort", undefined, { shallow: true });
    }
  }, [router.query.redirected, isDataLoaded, isApplyingFilters]);

  if (!session) return <div>Lade...</div>;
  if (!isDataLoaded) {
    if (loadingError) {
      return <LoadingScreen message={`Fehler beim Laden: ${loadingError}`} isError={true} />;
    }
    return <LoadingScreen message="Lade Spielstand..." />;
  }

  const progress = Math.round((trained / sprichwortCount) * 100) || 0;

  return (
    <>
      <Head>
        <title>Sprichwörter</title>
      </Head>
      {session && (
        <>
          <Header session={session} />
          <main className="flex justify-end items-start w-full p-6 z-0" style={{ marginTop: "96px" }}>
            <div className="flex gap-4">
              <Button
                onClick={handleREV}
                className="py-2 px-4 rounded-md bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faTrashRestore} />
                Alle Daten löschen
              </Button>
            </div>
          </main>

          <div
            className="max-w-5xl mx-auto py-2 px-4 sm:px-6 lg:px-8"
            style={{ minHeight: "800px", display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {currentSprichwort ? (
              <SprichwortCard
                wordData={{
                  sprichwort: currentSprichwort.Sprichwort,
                  wort: currentSprichwort.Wort,
                  erklaerung: currentSprichwort.Erklaerung,
                  beispiel: currentSprichwort.Beispiel,
                  quelle: currentSprichwort.Quelle,
                  datum: currentSprichwort.Datum ? new Date(currentSprichwort.Datum).toLocaleDateString("de-DE") : "",
                }}
                showTranslation={showTranslation}
                onFlip={() => setShowTranslation(!showTranslation)}
              />
            ) : (
              <div>Keine Sprichwörter verfügbar. Alle wurden gelernt!</div>
            )}
            <div className="mt-4" style={{ minHeight: "100px" }}>
              <ActionButtons
                onCorrect={() => debouncedHandleClick(handleOK)}
                onIncorrect={() => debouncedHandleClick(handleNOK)}
                isLoading={isApplyingFilters}
              />
            </div>
            <div className="mt-4" style={{ minHeight: "50px" }}>
              <Stats totalCount={sprichwortCount} trainedCount={trained} attempts={attempts} progress={progress} />
            </div>
            {standingSummary.length > 0 ? (
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
                  {standingSummary.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="border border-gray-300 p-2">{item.Sprichwort}</td>
                      <td className="border border-gray-300 p-2">{item.Wort}</td>
                      <td className="border border-gray-300 p-2">{item.Erklaerung}</td>
                      <td className="border border-gray-300 p-2">{item.Beispiel}</td>
                      <td className="border border-gray-300 p-2">{item.Quelle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ): null}
          </div>
        </>
      )}
    </>
  );
}